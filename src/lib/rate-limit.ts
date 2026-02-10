/**
 * Rate Limiting Utility
 * Provides in-memory rate limiting with sliding window algorithm
 * Can be upgraded to Redis for distributed systems
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  windowStart: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory store (for development/single-instance)
// TODO: Replace with Redis for production multi-instance deployments
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Default rate limit configurations for different endpoint types
 */
export const RateLimitPresets: Record<string, RateLimitConfig> = {
  // API routes - general
  api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute

  // Authentication endpoints - stricter
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
  signIn: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
  signUp: { maxRequests: 3, windowMs: 3600000 }, // 3 per hour

  // Sensitive operations
  payment: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  fileUpload: { maxRequests: 5, windowMs: 60000 }, // 5 per minute

  // Data export
  export: { maxRequests: 2, windowMs: 3600000 }, // 2 per hour

  // Public endpoints
  public: { maxRequests: 50, windowMs: 60000 }, // 50 per minute
};

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Object with isLimited, remaining, resetTime
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.api
): {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Initialize new entry or check sliding window
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      windowStart: now,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  const isLimited = entry.count >= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const retryAfter = isLimited ? Math.ceil((entry.resetTime - now) / 1000) : undefined;

  // Increment counter if not limited
  if (!isLimited) {
    entry.count++;
  }

  return {
    isLimited,
    remaining,
    resetTime: entry.resetTime,
    retryAfter,
  };
}

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
} {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      current: 0,
      max: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  return {
    current: entry.count,
    max: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

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
    const result = checkRateLimit(identifier, this.config);

    return {
      success: !result.isLimited,
      limit: this.config.maxRequests,
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

  console.warn('[Rate Limit] Violation detected:', violation);

  // TODO: Send to monitoring service (Sentry, Datadog, etc.)
}
