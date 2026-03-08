/**
 * INDIVIDUAL RESOURCE API ROUTE
 *
 * Handles operations on individual resources by ID.
 *
 * Routes:
 * GET    /api/resources/classes/123          → get class
 * PUT    /api/resources/classes/123          → update class
 * DELETE /api/resources/classes/123          → delete class
 */

console.log("[ID Route] FILE LOADED - /api/resources/[resource]/[id]/route.ts");

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { errorResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { getFeature, type FeatureName } from "@/features";

interface RouteContext {
  params: Promise<{ resource: string; id: string }>;
}

// Get feature from resource name
function getFeatureFromResource(resource: string) {
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
    notifications: "notifications",
    notification: "notifications",
  };

  const featureName = mapping[resource];
  if (featureName) {
    return getFeature(featureName);
  }
  return undefined;
}

// GET - Get single record
export const GET = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource, id } = await context.params;
    const feature = getFeatureFromResource(resource);

    if (!feature) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    // Check permissions
    const { user } = auth;
    const permissions = feature.config.permissions?.read || ["school-admin", "admin"];
    if (!user || !permissions.includes(user.type as any)) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      return await feature.api.get(id, auth);
    } catch (error) {
      logger.error(`Feature API GET error for ${resource}/${id}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Failed to fetch");
    }
  },
  ["student", "teacher", "school-admin", "counselor", "parent", "admin"]
);

// PUT - Update record
export const PUT = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource, id } = await context.params;
    const feature = getFeatureFromResource(resource);

    console.log(`[ID Route] PUT ${resource}/${id}`, { resource, id, featureFound: !!feature });

    if (!feature) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    // Check permissions
    const { user } = auth;
    const permissions = feature.config.permissions?.update || ["school-admin", "admin"];
    if (!user || !permissions.includes(user.type as any)) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      const data = await request.json();
      console.log(`[ID Route] Calling feature.api.update`, { id, data });
      const result = await feature.api.update(id, data, auth);
      console.log(`[ID Route] Update result:`, result);
      return result;
    } catch (error) {
      console.error(`[ID Route] PUT error`, { error });
      logger.error(`Feature API PUT error for ${resource}/${id}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Failed to update");
    }
  },
  ["school-admin", "admin"]
);

// DELETE - Delete record
export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource, id } = await context.params;
    const feature = getFeatureFromResource(resource);

    if (!feature) {
      return notFoundResponse(`Resource "${resource}" not found`);
    }

    // Check permissions
    const { user } = auth;
    const permissions = feature.config.permissions?.delete || ["school-admin", "admin"];
    if (!user || !permissions.includes(user.type as any)) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      return await feature.api.delete(id, auth);
    } catch (error) {
      logger.error(`Feature API DELETE error for ${resource}/${id}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Failed to delete");
    }
  },
  ["school-admin", "admin"]
);
