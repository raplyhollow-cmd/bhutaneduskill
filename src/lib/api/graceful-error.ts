/**
 * Graceful error handling utilities for API routes
 *
 * Provides consistent error response formatting across all API endpoints.
 * Includes error type classification and development-only details.
 */

import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export type ErrorType =
  | "database_connection"
  | "database_query"
  | "timeout"
  | "authentication"
  | "authorization"
  | "validation"
  | "not_found"
  | "unknown";

export interface ErrorContext {
  route: string;
  method: string;
  userId?: string;
  [key: string]: unknown;
}

export interface ErrorResponse {
  error: string;
  errorType?: ErrorType;
  details?: string;
}

/**
 * Classifies an error into a type for better handling and debugging
 */
function classifyError(error: unknown): ErrorType {
  if (!(error instanceof Error)) {
    return "unknown";
  }

  const message = error.message.toLowerCase();

  // Database connection errors
  if (
    message.includes("connect") ||
    message.includes("connection") ||
    message.includes("pool") ||
    message.includes("econnrefused")
  ) {
    return "database_connection";
  }

  // Database query errors
  if (
    message.includes("query") ||
    message.includes("syntax") ||
    message.includes("constraint") ||
    message.includes("duplicate")
  ) {
    return "database_query";
  }

  // Timeout errors
  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("etimedout")
  ) {
    return "timeout";
  }

  // Authentication errors
  if (
    message.includes("unauthorized") ||
    message.includes("authentication") ||
    message.includes("token") ||
    message.includes("invalid credentials")
  ) {
    return "authentication";
  }

  // Authorization errors
  if (
    message.includes("forbidden") ||
    message.includes("permission") ||
    message.includes("access denied") ||
    message.includes("not allowed")
  ) {
    return "authorization";
  }

  // Validation errors
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return "validation";
  }

  // Not found errors
  if (
    message.includes("not found") ||
    message.includes("does not exist") ||
    message.includes("no rows")
  ) {
    return "not_found";
  }

  return "unknown";
}

/**
 * Handles API errors with logging and consistent response formatting
 *
 * @example
 * ```typescript
 * } catch (error) {
 *   const response = handleApiError(error, {
 *     route: "/api/admin/dashboard",
 *     method: "GET",
 *     userId
 *   });
 *   return NextResponse.json(response, { status: 500 });
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context: ErrorContext
): ErrorResponse {
  const isDev = process.env.NODE_ENV === "development";
  const errorType = classifyError(error);

  // Log the error with context
  logger.apiError(error, {
    ...context,
    errorType
  });

  // Build response
  const response: ErrorResponse = {
    error: getUserFacingMessage(errorType)
  };

  // Include error type in development for debugging
  if (isDev) {
    response.errorType = errorType;
  }

  // Include error details in development
  if (isDev && error instanceof Error) {
    response.details = error.message;
  }

  return response;
}

/**
 * Returns a user-friendly error message based on error type
 */
function getUserFacingMessage(errorType: ErrorType): string {
  const messages: Record<ErrorType, string> = {
    database_connection: "Unable to connect to the database. Please try again.",
    database_query: "An error occurred while processing your request.",
    timeout: "The request took too long to complete. Please try again.",
    authentication: "You need to sign in to access this resource.",
    authorization: "You don't have permission to perform this action.",
    validation: "Please check your input and try again.",
    not_found: "The requested resource was not found.",
    unknown: "An unexpected error occurred. Please try again."
  };

  return messages[errorType] || messages.unknown;
}

/**
 * Creates a JSON response for API errors with proper HTTP status
 *
 * @example
 * ```typescript
 * } catch (error) {
 *   return apiErrorResponse(error, {
 *     route: "/api/admin/dashboard",
 *     method: "GET",
 *     userId
 *   }, 500);
 * }
 * ```
 */
export function apiErrorResponse(
  error: unknown,
  context: ErrorContext,
  status: number = 500
): NextResponse<ErrorResponse> {
  const response = handleApiError(error, context);
  return NextResponse.json(response, { status });
}

/**
 * Wraps an async function with error handling
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   return withApiErrorHandling(async () => {
 *     // Your logic here
 *     return NextResponse.json({ data });
 *   }, {
 *     route: "/api/admin/dashboard",
 *     method: "GET"
 *   });
 * }
 * ```
 */
export async function withApiErrorHandling<T>(
  fn: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw apiErrorResponse(error, context);
  }
}
