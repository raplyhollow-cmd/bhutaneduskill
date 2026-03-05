/**
 * UNIVERSAL FEATURE API ROUTE
 *
 * Single route that handles ALL resources using the feature system.
 *
 * Standard CRUD Routes:
 * GET    /api/resources/students              → list students
 * GET    /api/resources/students/123          → get student
 * POST   /api/resources/students              → create student
 * PUT    /api/resources/students/123          → update student
 * DELETE /api/resources/students/123          → delete student
 *
 * Extended Routes (Actions, Webhooks, Public):
 * POST   /api/resources/students?action=set-role      → execute action
 * POST   /api/resources/users?webhook=clerk           → webhook handler
 * GET    /api/resources/schools?public=search         → public endpoint (no auth)
 * POST   /api/resources/schools?public=validate-code  → public endpoint (no auth)
 *
 * Same pattern for: teachers, classes, subjects, schools, assessments, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse, methodNotAllowedResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { getFeature, type FeatureName } from "@/features";

interface RouteContext {
  params: Promise<{ resource: string; id?: string[] }>;
}

// Get feature from resource name
function getFeatureFromResource(resource: string) {
  // Map plural resource names to feature names
  const mapping: Record<string, FeatureName> = {
    users: "users",
    user: "users",
    students: "students",
    student: "students",
    teachers: "teachers",
    teacher: "teachers",
    classes: "classes",
    class: "classes",
    subjects: "subjects",
    subject: "subjects",
    schools: "schools",
    school: "schools",
    assessments: "assessments",
    assessment: "assessments",
    attendance: "attendance",
    attendance_records: "attendance",
  };

  const featureName = mapping[resource];
  if (featureName) {
    return getFeature(featureName);
  }
  return undefined;
}

// GET handler - list, get single, or public endpoint
export const GET = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource, id } = await context.params;
    const feature = getFeatureFromResource(resource);

    if (!feature) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    try {
      const url = new URL(request.url);
      const params = Object.fromEntries(url.searchParams);

      // Check for public endpoint (no auth required)
      const publicEndpoint = url.searchParams.get("public");
      if (publicEndpoint && feature.public?.[publicEndpoint]) {
        const endpointConfig = feature.public[publicEndpoint];
        if (endpointConfig.method === "GET") {
          return await endpointConfig.handler(params, request);
        }
        return errorResponse(`Public endpoint "${publicEndpoint}" does not support GET`, 405);
      }

      // Check permissions for standard endpoints
      const { user } = auth;
      const permissions = feature.config.permissions?.read || ["school-admin", "admin"];
      if (!user || !permissions.includes(user.type as any)) {
        return errorResponse("Unauthorized", 401);
      }

      if (id && id.length > 0) {
        // Get single record
        return await feature.api.get(id[0], auth);
      } else {
        // List records
        return await feature.api.list(params, auth);
      }
    } catch (error) {
      logger.error(`Feature API GET error for ${resource}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Failed to fetch");
    }
  },
  ["student", "teacher", "school-admin", "counselor", "parent", "admin"]
);

// POST handler - create
export const POST = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource } = await context.params;
    const feature = getFeatureFromResource(resource);

    if (!feature) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    // Check permissions
    const { user } = auth;
    const permissions = feature.config.permissions?.create || ["school-admin", "admin"];
    if (!user || !permissions.includes(user.type as any)) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      const data = await request.json();
      return await feature.api.create(data, auth);
    } catch (error) {
      logger.error(`Feature API POST error for ${resource}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Failed to create");
    }
  },
  ["school-admin", "admin"]
);

// PUT handler - update
export const PUT = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource, id } = await context.params;
    const feature = getFeatureFromResource(resource);

    if (!feature) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    if (!id || id.length === 0) {
      return errorResponse("ID required for update", 400);
    }

    // Check permissions
    const { user } = auth;
    const permissions = feature.config.permissions?.update || ["school-admin", "admin"];
    if (!user || !permissions.includes(user.type as any)) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      const data = await request.json();
      return await feature.api.update(id[0], data, auth);
    } catch (error) {
      logger.error(`Feature API PUT error for ${resource}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Failed to update");
    }
  },
  ["school-admin", "admin"]
);

// DELETE handler - delete
export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource, id } = await context.params;
    const feature = getFeatureFromResource(resource);

    if (!feature) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    if (!id || id.length === 0) {
      return errorResponse("ID required for delete", 400);
    }

    // Check permissions
    const { user } = auth;
    const permissions = feature.config.permissions?.delete || ["school-admin", "admin"];
    if (!user || !permissions.includes(user.type as any)) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      return await feature.api.delete(id[0], auth);
    } catch (error) {
      logger.error(`Feature API DELETE error for ${resource}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Failed to delete");
    }
  },
  ["school-admin", "admin"]
);
