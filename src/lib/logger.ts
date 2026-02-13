/**
 * Centralized Logging Utility
 *
 * Features:
 * - Development-only debug/info logging
 * - Production error tracking with Sentry (optional - install @sentry/nextjs to enable)
 * - Consistent log format across the codebase
 * - Context-aware error logging
 */

// Optional Sentry integration - only import if package is installed
let Sentry: typeof import("@sentry/nextjs") | null = null;
try {
  Sentry = require("@sentry/nextjs");
} catch {
  // Sentry not installed - that's ok, we'll log to console only
  if (process.env.NODE_ENV === 'development') {
    console.log('[Logger] Sentry not installed - console logging only');
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const LOG_PREFIX = '[BhutanEduSkill]';
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// ============================================================================
// LOGGER FUNCTIONS
// ============================================================================

/**
 * Debug-level logging (development only)
 * Use for detailed debugging information that shouldn't appear in production
 */
export function debug(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(LOG_PREFIX, '[DEBUG]', ...args);
  }
}

/**
 * Info-level logging (development only)
 * Use for general informational messages
 */
export function info(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(LOG_PREFIX, '[INFO]', ...args);
  }
}

/**
 * Warning-level logging (development only, production to Sentry if needed)
 * Use for warnings that don't break the application
 */
export function warn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(LOG_PREFIX, '[WARN]', ...args);
  } else if (isProduction && Sentry) {
    // Optionally send warnings to Sentry in production
    Sentry.captureMessage(args.join(' '), 'warning');
  }
}

/**
 * Error-level logging (always logged, with Sentry in production)
 * Use for application errors and exceptions
 */
export function error(error: Error | unknown, context?: LogContext): void {
  // Format error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Always log to console
  console.error(LOG_PREFIX, '[ERROR]', errorMessage, context || '', errorStack || '');

  // Send to Sentry in production (if installed)
  if (isProduction && Sentry) {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: context,
        tags: {
          source: 'logger',
        },
      });
    } else {
      Sentry.captureMessage(String(error), {
        level: 'error',
        extra: context,
      });
    }
  }
}

/**
 * API error logging with request context
 * Use for API route errors
 */
export function apiError(
  error: Error | unknown,
  requestContext: {
    route: string;
    method?: string;
    userId?: string;
    [key: string]: unknown;
  }
): void {
  const context: LogContext = {
    ...requestContext,
    timestamp: new Date().toISOString(),
  };

  error(error, context);
}

/**
 * Security event logging
 * Use for security-relevant events
 */
export function security(
  event: string,
  details: {
    userId?: string;
    ip?: string;
    route?: string;
    [key: string]: unknown;
  }
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  if (event.includes('unauthorized') || event.includes('denied') || event.includes('attack')) {
    console.error(LOG_PREFIX, '[SECURITY]', logEntry);
  } else {
    console.log(LOG_PREFIX, '[SECURITY]', logEntry);
  }

  // Send security events to Sentry in production (if installed)
  if (isProduction && Sentry) {
    Sentry.captureMessage(`Security: ${event}`, {
      level: 'warning',
      extra: details,
    });
  }
}

// ============================================================================
// NAMED EXPORTS (for cleaner imports)
// ============================================================================

export const logger = {
  debug,
  info,
  warn,
  error,
  apiError,
  security,
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default logger;
