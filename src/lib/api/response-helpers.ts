/**
 * Response Helper Functions for API Routes
 *
 * Provides standardized response formatting to reduce code duplication
 */

import { NextResponse } from "next/server";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: message, status },
    { status }
  );
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    { data },
    { status }
  );
}

/**
 * Create a response for a successful resource creation
 */
export function createdResponse<T>(
  data: T,
  status: number = 201
): NextResponse<ApiSuccess<T>> {
  return successResponse(data, status);
}

/**
 * Create a response for a successful update
 */
export function updatedResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return successResponse(data, status);
}

/**
 * Create a response for a successful deletion
 */
export function deletedResponse(): NextResponse<ApiSuccess<{ message: string }>> {
  return successResponse({ message: "Resource deleted successfully" }, 200);
}

/**
 * Create a "not found" error response
 */
export function notFoundResponse(resource: string = "Resource"): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Create a "bad request" error response
 */
export function badRequestResponse(message: string = "Bad request"): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 400);
}

/**
 * Create an "unauthorized" error response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401);
}

/**
 * Create a "forbidden" error response
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403);
}

/**
 * Create a "conflict" error response
 */
export function conflictResponse(message: string = "Conflict"): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 409);
}

/**
 * Create a "method not allowed" error response
 */
export function methodNotAllowedResponse(allowedMethods: string = "GET, POST, PUT, DELETE"): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { error: "Method not allowed", status: 405, allowedMethods },
    { status: 405, headers: { Allow: allowedMethods } }
  );
}
