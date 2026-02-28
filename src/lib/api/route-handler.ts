/**
 * API Route Handler Wrapper
 *
 * Provides a wrapper that combines authentication, error handling, and response formatting
 * Eliminates ~2,000 lines of duplicate code across 100+ API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export type UserType = "admin" | "school-admin" | "teacher" | "student" | "parent" | "counselor" | "ministry";

/**
 * Creates a type-safe API route handler with built-in authentication
 *
 * @param handler - The route handler function
 * @param allowedRoles - Array of user types that can access this route
 * @returns An Express.js-style route handler
 */
export function createApiRoute<
  TParams extends Record<string, unknown> = {},
  TResponse = unknown
>(
  handler: (
    req: AuthenticatedRequest & { params?: Promise<TParams> },
    auth: AuthContext | null,
    context?: { params?: Promise<TParams> }
  ) => Promise<NextResponse | Response | Record<string, unknown>>,
  allowedRoles: UserType[] = []
) {
  return async (
    req: AuthenticatedRequest & { params?: Promise<TParams> },
    context?: { params?: Promise<TParams> }
  ): Promise<NextResponse> => {
    try {
      // Authentication check - skip if allowedRoles is empty (open endpoint)
      let result: any;

      if (allowedRoles.length > 0) {
        // Protected endpoint - require auth
        const authResult = await requireAuth(allowedRoles);

        if ("error" in authResult) {
          console.log("[createApiRoute] Auth failed:", authResult.error, "status:", authResult.status);
          return errorResponse(authResult.error, authResult.status);
        }

        console.log("[createApiRoute] Auth succeeded, calling handler for:", req.url);

        // Call the actual handler, passing auth context
        const authContext = { userId: authResult.userId, user: authResult.user };
        result = await handler(req, authContext, context);
      } else {
        // Open endpoint - no auth required
        console.log("[createApiRoute] Open endpoint (no auth), calling handler for:", req.url);

        // Call the actual handler, passing null for auth
        result = await handler(req, null, context);
      }

      // Convert plain object returns to NextResponse
      if (result instanceof NextResponse || result instanceof Response) {
        return result as NextResponse;
      }

      // Handle { data, message } responses
      if ("data" in result) {
        return NextResponse.json(result, { status: 200 });
      }

      // Handle { error } responses
      if ("error" in result) {
        const status = "status" in result && typeof result.status === "number" ? result.status as number : 400;
        return NextResponse.json(result, { status });
      }

      // Default: return as JSON
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      // Enhanced error logging for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.log("[createApiRoute] CATCH BLOCK ERROR:", {
        errorMessage,
        errorName,
        route: req.url || "unknown",
        method: req.method,
        hasStack: !!errorStack,
      });

      logger.apiError(error, {
        route: req.url || "unknown",
        method: req.method,
        errorMessage,
        errorName,
      });

      // Use getErrorMessage to handle empty error messages
      const displayMessage = getErrorMessage(error);
      return errorResponse(`An error occurred: ${displayMessage}`, 500);
    }
  };
}

/**
 * Type for auth context attached to requests
 */
export interface AuthContext {
  userId: string;
  user: {
    id: string;
    clerkUserId: string;
    type: string;
    schoolId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    settings?: unknown;
  };
}

/**
 * Extended NextRequest with auth context
 */
export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthContext;
}

/**
 * Helper to get auth context from request
 */
export function getAuth(req: NextRequest): AuthContext | null {
  return (req as AuthenticatedRequest).auth || null;
}

/**
 * Helper function to extract meaningful error messages
 * Handles cases where Error objects have empty messages
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // If error has message, use it
    if (error.message && error.message.trim().length > 0) {
      return error.message;
    }
    // Otherwise use error name
    return error.name || 'Unknown Error';
  }
  return String(error);
}

/**
 * Helper function to create standardized error responses
 */
function errorResponse(message: string, status: number): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: message, status },
    { status }
  );
}

/**
 * Helper function to create standardized success responses
 */
function successResponse<T>(data: T, status: number = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    { data },
    { status }
  );
}

/**
 * API Response type alias for convenience
 */
type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;
