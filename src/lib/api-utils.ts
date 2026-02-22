import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API response type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string | string[]>;
}

/**
 * Error response type
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string | string[]>;
}

/**
 * Success response type
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

/**
 * Development mode flag
 */
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Creates a safe API handler with standardized error handling
 *
 * @param callback - The async function to wrap with error handling
 * @returns A NextResponse with standardized format
 *
 * @example
 * ```ts
 * export const GET = createSafeHandler(async (req) => {
 *   const { userId } = await requireAuth(['admin']);
 *   const data = await someOperation();
 *   return { success: true, data };
 * });
 * ```
 */
export function createSafeHandler<T = unknown>(
  callback: (req: Request) => Promise<ApiSuccess<T>>
): (req: Request) => Promise<NextResponse<ApiResponse<T>>> {
  return async (req: Request) => {
    try {
      const result = await callback(req);
      return NextResponse.json(result);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Creates a safe API handler with URL params support
 *
 * @param callback - The async function to wrap with error handling
 * @returns A NextResponse with standardized format
 *
 * @example
 * ```ts
 * export const GET = createSafeHandlerWithParams(async (req, params) => {
 *   const { userId } = await requireAuth(['admin']);
 *   const data = await getSchool(params.id);
 *   return { success: true, data };
 * });
 * ```
 */
export function createSafeHandlerWithParams<T = unknown, P extends Record<string, string> = Record<string, string>>(
  callback: (req: Request, params: P) => Promise<ApiSuccess<T>>
): (req: Request, params: P) => Promise<NextResponse<ApiResponse<T>>> {
  return async (req: Request, params: P) => {
    try {
      const result = await callback(req, params);
      return NextResponse.json(result);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Handles errors and returns appropriate response
 */
function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  // Zod validation errors
  if (error instanceof ZodError) {
    const details: Record<string, string | string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (details[path]) {
        // Append to existing error
        const existing = details[path];
        details[path] = Array.isArray(existing)
          ? [...existing, issue.message]
          : [existing, issue.message];
      } else {
        details[path] = issue.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: isDevelopment ? details : undefined,
      } satisfies ApiErrorResponse,
      { status: 400 }
    );
  }

  // Known error objects with message property
  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === "NotFoundError") {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Resource not found",
        } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    if (error.name === "UnauthorizedError") {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Unauthorized",
        } satisfies ApiErrorResponse,
        { status: 401 }
      );
    }

    if (error.name === "ForbiddenError") {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Forbidden",
        } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: isDevelopment ? error.message : "An error occurred",
        details: isDevelopment
          ? { stack: error.stack || "No stack trace available" }
          : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }

  // Unknown error types
  return NextResponse.json(
    {
      success: false,
      error: isDevelopment ? String(error) : "An unexpected error occurred",
      details: isDevelopment
        ? { type: typeof error, value: JSON.stringify(error) }
        : undefined,
    } satisfies ApiErrorResponse,
    { status: 500 }
  );
}

/**
 * Creates a success response
 */
export function successResponse<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data } satisfies ApiSuccess<T>);
}

/**
 * Creates an error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: Record<string, string | string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      details: isDevelopment ? details : undefined,
    } satisfies ApiErrorResponse,
    { status }
  );
}

/**
 * Creates a validation error response from Zod errors
 */
export function validationErrorResponse(
  errors: Record<string, string | string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: isDevelopment ? errors : undefined,
    } satisfies ApiErrorResponse,
    { status: 400 }
  );
}

/**
 * Creates a not found response
 */
export function notFoundResponse(
  resource: string = "Resource"
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: `${resource} not found`,
    } satisfies ApiErrorResponse,
    { status: 404 }
  );
}

/**
 * Creates an unauthorized response
 */
export function unauthorizedResponse(
  message: string = "Unauthorized"
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    } satisfies ApiErrorResponse,
    { status: 401 }
  );
}

/**
 * Creates a forbidden response
 */
export function forbiddenResponse(
  message: string = "Forbidden"
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    } satisfies ApiErrorResponse,
    { status: 403 }
  );
}

/**
 * Creates a bad request response
 */
export function badRequestResponse(
  message: string = "Bad request",
  details?: Record<string, string | string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details: isDevelopment ? details : undefined,
    } satisfies ApiErrorResponse,
    { status: 400 }
  );
}
