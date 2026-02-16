/**
 * Centralized Logging Utility
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LOG_PREFIX = "[BhutanEduSkill]";
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Debug-level logging (development only)
 */
export function debug(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(LOG_PREFIX, "[DEBUG]", ...args);
  }
}

/**
 * Info-level logging (development only)
 */
export function info(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(LOG_PREFIX, "[INFO]", ...args);
  }
}

/**
 * Warning-level logging (development only)
 */
export function warn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(LOG_PREFIX, "[WARN]", ...args);
  }
}

/**
 * Error-level logging (always logged)
 */
export function error(error: Error | unknown, context?: LogContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  console.error(LOG_PREFIX, "[ERROR]", errorMessage, context || "", errorStack || "");
}

/**
 * API error logging with request context
 */
export function apiError(error: Error | unknown, requestContext: { route: string; method?: string; userId?: string; [key: string]: unknown }): void {
  const ctx: LogContext = { ...requestContext, timestamp: new Date().toISOString() };
  console.error(LOG_PREFIX, "[API ERROR]", error, ctx);
}

/**
 * Security event logging
 */
export function security(event: string, details: { userId?: string; ip?: string; route?: string; [key: string]: unknown }): void {
  console.log(LOG_PREFIX, "[SECURITY]", event, details);
}

export const logger = { debug, info, warn, error, apiError, security };
export default logger;
