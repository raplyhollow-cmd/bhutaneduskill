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
    auth: AuthContext,
    context?: { params?: Promise<TParams> }
  ) => Promise<NextResponse | Response>,
  allowedRoles: UserType[] = []
) {
  return async (
    req: AuthenticatedRequest & { params?: Promise<TParams> },
    context?: { params?: Promise<TParams> }
  ): Promise<NextResponse> => {
    // Authentication check
    const authResult = await requireAuth(allowedRoles);

    if ("error" in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    try {
      // Call the actual handler, passing the auth result directly
      const result = await handler(req, authResult, context);
      // Ensure NextResponse is returned
      return result as NextResponse;
    } catch (error) {
      logger.apiError(error, {
        route: req.url || "unknown",
        method: req.method,
      });

      return errorResponse("An error occurred while processing your request", 500);
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
