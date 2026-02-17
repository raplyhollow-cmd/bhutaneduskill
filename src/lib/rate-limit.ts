import { logger } from "@/lib/logger";
/**
 * Rate Limiting Utility
 * Provides in-memory rate limiting with sliding window algorithm
 * Supports burst allowance, per-user/per-IP tracking, and tier-based limits
 * Can be upgraded to Redis for distributed systems
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SlidingWindowEntry {
  timestamp: number;
}

interface RateLimitEntry {
  requests: SlidingWindowEntry[];
  burstAllowance: number;
  lastBurstRefill: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstRequests?: number;
  burstWindowMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
  window: number;
}

// ============================================================================
// IN-MEMORY STORE (Fallback for single-instance deployments)
// ============================================================================

// TODO: Replace with Redis for production multi-instance deployments
// Format: Map<identifier, RateLimitEntry>
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration for burst allowance
const BURST_REFILL_RATE = 1; // Refill 1 burst token per second
const BURST_MAX_ALLOWANCE = 10; // Maximum burst tokens

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, entry] of entries) {
      // Remove requests outside the window
      const windowStart = now - CLEANUP_INTERVAL;
      entry.requests = entry.requests.filter(r => r.timestamp > windowStart);

      // Remove empty entries
      if (entry.requests.length === 0 && entry.burstAllowance === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent process exit in development
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

// Start cleanup timer on module load
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startCleanupTimer();
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RateLimitPresets: Record<string, RateLimitConfig> = {
  // API routes - general
  api: {
    maxRequests: 100,
    windowMs: 60000,
    burstRequests: 20,
    burstWindowMs: 10000,
  }, // 100 requests per minute, burst 20 in 10s

  // Authentication endpoints - stricter
  auth: {
    maxRequests: 5,
    windowMs: 60000,
    burstRequests: 2,
    burstWindowMs: 10000,
  }, // 5 requests per minute
  signIn: {
    maxRequests: 5,
    windowMs: 300000,
    burstRequests: 2,
    burstWindowMs: 30000,
  }, // 5 per 5 minutes
  signUp: {
    maxRequests: 3,
    windowMs: 3600000,
    burstRequests: 1,
    burstWindowMs: 60000,
  }, // 3 per hour

  // Sensitive operations
  payment: {
    maxRequests: 10,
    windowMs: 60000,
    burstRequests: 3,
    burstWindowMs: 10000,
  }, // 10 per minute
  fileUpload: {
    maxRequests: 5,
    windowMs: 60000,
    burstRequests: 2,
    burstWindowMs: 10000,
  }, // 5 per minute

  // Assessment endpoints
  assessment: {
    maxRequests: 20,
    windowMs: 60000,
    burstRequests: 5,
    burstWindowMs: 10000,
  }, // 20 per minute

  // Data export
  export: {
    maxRequests: 2,
    windowMs: 3600000,
    burstRequests: 1,
    burstWindowMs: 30000,
  }, // 2 per hour

  // Public endpoints
  public: {
    maxRequests: 50,
    windowMs: 60000,
    burstRequests: 10,
    burstWindowMs: 10000,
  }, // 50 per minute
};

// ============================================================================
// SLIDING WINDOW COUNTER WITH BURST ALLOWANCE
// ============================================================================

/**
 * Refill burst allowance based on time elapsed
 * Uses a token bucket approach for burst tokens
 */
function refillBurstAllowance(entry: RateLimitEntry, now: number): void {
  const timeSinceLastRefill = now - entry.lastBurstRefill;
  const tokensToAdd = Math.floor(timeSinceLastRefill / 1000) * BURST_REFILL_RATE;

  if (tokensToAdd > 0) {
    entry.burstAllowance = Math.min(
      BURST_MAX_ALLOWANCE,
      entry.burstAllowance + tokensToAdd
    );
    entry.lastBurstRefill = now;
  }
}

/**
 * Get or create rate limit entry for identifier
 */
function getOrCreateEntry(identifier: string): RateLimitEntry {
  let entry = rateLimitStore.get(identifier);

  if (!entry) {
    entry = {
      requests: [],
      burstAllowance: BURST_MAX_ALLOWANCE,
      lastBurstRefill: Date.now(),
    };
    rateLimitStore.set(identifier, entry);
  }

  return entry;
}

/**
 * Clean old requests outside the sliding window
 */
function cleanOldRequests(entry: RateLimitEntry, windowMs: number): void {
  const now = Date.now();
  const windowStart = now - windowMs;
  entry.requests = entry.requests.filter(r => r.timestamp > windowStart);
}

/**
 * Check rate limit with sliding window counter and burst allowance
 * @param identifier - Unique identifier (IP address or user ID)
 * @param limit - Maximum requests allowed in the window
 * @param window - Time window in milliseconds
 * @returns RateLimitCheckResult with allowed status and remaining count
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = getOrCreateEntry(identifier);

  // Refill burst allowance
  refillBurstAllowance(entry, now);

  // Clean old requests outside the sliding window
  cleanOldRequests(entry, window);

  // Count requests in the current window
  const requestCount = entry.requests.length;

  // Calculate remaining requests
  const remaining = Math.max(0, limit - requestCount);

  // Check if request is allowed (either within limit or has burst tokens)
  let allowed = requestCount < limit;

  // If over limit, try to use burst allowance
  if (!allowed && entry.burstAllowance > 0) {
    allowed = true;
    entry.burstAllowance--;
  }

  // If allowed, add this request to the window
  if (allowed) {
    entry.requests.push({ timestamp: now });
  }

  return { allowed, remaining };
}

// ============================================================================
// ADVANCED RATE LIMITING (Full config support)
// ============================================================================

/**
 * Check rate limit with full configuration
 * @param identifier - Unique identifier (IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Detailed rate limit result
 */
export function checkRateLimitWithConfig(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.api
): RateLimitCheckResult {
  const now = Date.now();
  const entry = getOrCreateEntry(identifier);

  // Refill burst allowance
  refillBurstAllowance(entry, now);

  // Clean old requests outside the sliding window
  cleanOldRequests(entry, config.windowMs);

  // Count requests in the current window
  const requestCount = entry.requests.length;

  // Calculate remaining requests
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const resetTime = now + config.windowMs;

  // Check if request is allowed (either within limit or has burst tokens)
  let allowed = requestCount < config.maxRequests;

  // If over limit, try to use burst allowance (if configured)
  if (!allowed && config.burstRequests && entry.burstAllowance > 0) {
    allowed = true;
    entry.burstAllowance--;
  }

  // Calculate retry after if not allowed
  let retryAfter: number | undefined;
  if (!allowed) {
    // Find oldest request in window
    const oldestRequest = entry.requests[0];
    if (oldestRequest) {
      retryAfter = Math.ceil((oldestRequest.timestamp + config.windowMs - now) / 1000);
    }
  }

  // If allowed, add this request to the window
  if (allowed) {
    entry.requests.push({ timestamp: now });
  }

  return {
    allowed,
    remaining,
    resetTime,
    retryAfter,
    limit: config.maxRequests,
    window: config.windowMs,
  };
}

/**
 * Check rate limit for a user (by userId)
 * Uses user-specific limits which are typically higher than IP limits
 */
export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig = RateLimitPresets.api
): RateLimitCheckResult {
  return checkRateLimitWithConfig(`user:${userId}`, config);
}

/**
 * Check rate limit for an IP address
 * Uses IP-specific limits which are typically stricter
 */
export function checkIpRateLimit(
  ipAddress: string,
  config: RateLimitConfig = RateLimitPresets.public
): RateLimitCheckResult {
  return checkRateLimitWithConfig(`ip:${ipAddress}`, config);
}

/**
 * Check rate limit for both user and IP (stricter of the two)
 * Useful for authenticated requests where you want to limit both
 */
export function checkDualRateLimit(
  userId: string | undefined,
  ipAddress: string,
  config: RateLimitConfig = RateLimitPresets.api
): RateLimitCheckResult {
  const ipResult = checkIpRateLimit(ipAddress, config);

  if (!userId) {
    return ipResult;
  }

  const userResult = checkUserRateLimit(userId, config);

  // Return the stricter result (the one with fewer remaining)
  return userResult.remaining < ipResult.remaining ? userResult : ipResult;
}

// ============================================================================
// LEGACY API (Backwards compatibility)
// ============================================================================

/**
 * Check if a request should be rate limited (legacy API)
 * @deprecated Use checkRateLimitWithConfig instead
 * @param identifier - Unique identifier (IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Object with isLimited, remaining, resetTime
 */
export function checkRateLimitLegacy(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.api
): {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const result = checkRateLimitWithConfig(identifier, config);
  return {
    isLimited: !result.allowed,
    remaining: result.remaining,
    resetTime: result.resetTime,
    retryAfter: result.retryAfter,
  };
}

// ============================================================================
// RESET & STATUS
// ============================================================================

/**
 * Reset rate limit for a specific identifier
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.api
): {
  current: number;
  max: number;
  remaining: number;
  resetTime: number;
  burstRemaining: number;
} {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry) {
    return {
      current: 0,
      max: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      burstRemaining: BURST_MAX_ALLOWANCE,
    };
  }

  // Refill burst allowance before returning status
  refillBurstAllowance(entry, now);

  // Clean old requests
  cleanOldRequests(entry, config.windowMs);

  // Find the oldest request to calculate reset time
  let resetTime = now + config.windowMs;
  if (entry.requests.length > 0) {
    const oldestRequest = entry.requests[0];
    resetTime = oldestRequest.timestamp + config.windowMs;
  }

  return {
    current: entry.requests.length,
    max: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.requests.length),
    resetTime,
    burstRemaining: entry.burstAllowance,
  };
}

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

/**
 * Middleware helper to rate limit based on IP and/or user ID
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(identifier: string): RateLimitResult {
    const result = checkRateLimitWithConfig(identifier, this.config);

    return {
      success: result.allowed,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.resetTime),
      retryAfter: result.retryAfter,
    };
  }

  reset(identifier: string): void {
    resetRateLimit(identifier);
  }

  status(identifier: string) {
    return getRateLimitStatus(identifier, this.config);
  }
}

/**
 * Create a rate limiter instance with preset configuration
 */
export function createRateLimiter(preset: keyof typeof RateLimitPresets): RateLimiter {
  return new RateLimiter(RateLimitPresets[preset] || RateLimitPresets.api);
}

/**
 * Extract client IP from request headers
 * Handles various proxy configurations
 */
export function getClientIp(request: Request): string {
  // Check various headers for real IP
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, use the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default
  return 'unknown';
}

/**
 * Generate rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset.getTime() / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Determine which preset to use based on request path
 */
export function getRateLimitPresetForPath(pathname: string): keyof typeof RateLimitPresets {
  if (pathname.startsWith('/api/auth') || pathname.includes('sign-in') || pathname.includes('sign-up')) {
    return 'auth';
  }
  if (pathname.includes('sign-in')) {
    return 'signIn';
  }
  if (pathname.includes('sign-up')) {
    return 'signUp';
  }
  if (pathname.includes('/api/payments') || pathname.includes('/api/fees')) {
    return 'payment';
  }
  if (pathname.includes('/api/assessments')) {
    return 'assessment';
  }
  if (pathname.includes('/api/files/upload')) {
    return 'fileUpload';
  }
  if (pathname.includes('/api/data-export') || pathname.includes('/api/reports')) {
    return 'export';
  }
  if (pathname.startsWith('/api/')) {
    return 'api';
  }

  return 'public';
}

// ============================================================================
// API ROUTE HELPERS
// ============================================================================

/**
 * Helper function to apply rate limiting to API routes
 * Returns a NextResponse with rate limit headers or null if allowed
 *
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(req);
 *   if (rateLimitResult) return rateLimitResult; // Rate limited
 *
 *   // Your route logic here
 * }
 * ```
 */
export async function applyRateLimit(
  request: Request,
  config?: RateLimitConfig
): Promise<Response | null> {
  const ipAddress = getClientIp(request);

  // Check rate limit
  const result = checkRateLimitWithConfig(
    `ip:${ipAddress}`,
    config || RateLimitPresets.api
  );

  // Create response headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  // If rate limited, return error response
  if (!result.allowed) {
    logRateLimitViolation(
      ipAddress,
      request.headers.get('x-next-pathname') || 'unknown',
      request.headers.get('user-agent') || undefined
    );

    const { NextResponse } = await import('next/server');
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Return null to indicate request is allowed
  // Caller should add the rate limit headers to their response
  return null;
}

/**
 * Helper function to apply rate limiting to authenticated API routes
 * Checks both IP and user ID, using the stricter limit
 *
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const { userId } = await auth();
 *   const rateLimitResult = await applyRateLimitAuth(req, userId);
 *   if (rateLimitResult) return rateLimitResult; // Rate limited
 *
 *   // Your route logic here
 * }
 * ```
 */
export async function applyRateLimitAuth(
  request: Request,
  userId: string | undefined,
  config?: RateLimitConfig
): Promise<Response | null> {
  const ipAddress = getClientIp(request);

  // Check both IP and user rate limits
  const result = checkDualRateLimit(
    userId,
    ipAddress,
    config || RateLimitPresets.api
  );

  // Create response headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  // If rate limited, return error response
  if (!result.allowed) {
    logRateLimitViolation(
      userId ? `user:${userId}` : `ip:${ipAddress}`,
      request.headers.get('x-next-pathname') || 'unknown',
      request.headers.get('user-agent') || undefined
    );

    const { NextResponse } = await import('next/server');
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitCheckResult
): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }

  return response;
}

/**
 * Log rate limit violations for security monitoring
 */
export function logRateLimitViolation(
  identifier: string,
  pathname: string,
  userAgent?: string
): void {
  const violation = {
    timestamp: new Date().toISOString(),
    identifier,
    pathname,
    userAgent: userAgent || 'unknown',
    severity: 'warning',
  };

  logger.warn('[Rate Limit] Violation detected:', violation);

  // TODO: Send to monitoring service (Sentry, Datadog, etc.)
}
