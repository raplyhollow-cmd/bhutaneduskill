/**
 * Timeout utility for async operations
 *
 * Wraps promises with a timeout, returning a fallback value if the operation takes too long.
 * Useful for AI calls, database queries, and external API requests.
 */

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within timeoutMs,
 * the fallback value is returned instead.
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetchFromAPI(),
 *   5000,
 *   { error: "Timeout", data: null }
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(fallback), timeoutMs)
    )
  ]);
}

/**
 * Wraps a promise with a timeout that rejects on timeout instead of returning a fallback.
 * Use this when you want to handle timeout errors explicitly.
 *
 * @example
 * ```typescript
 * try {
 *   const result = await withTimeoutReject(
 *     fetchFromAPI(),
 *     5000
 *   );
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     // Handle timeout
 *   }
 * }
 * ```
 */
export function withTimeoutReject<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Creates a timeout error class for explicit timeout handling
 */
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Default timeout values for different operations (in milliseconds)
 */
export const TIMEOUTS = {
  /** Fast database queries (simple lookups) */
  DB_FAST: 2000,
  /** Normal database queries (joins, aggregations) */
  DB_NORMAL: 5000,
  /** Slow database queries (complex aggregations) */
  DB_SLOW: 10000,
  /** AI API calls (can be slow) */
  AI_CALL: 10000,
  /** External API calls */
  EXTERNAL_API: 8000,
  /** Cache operations */
  CACHE: 1000,
} as const;
