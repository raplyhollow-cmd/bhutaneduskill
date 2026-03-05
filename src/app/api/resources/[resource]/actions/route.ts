/**
 * ACTIONS FOR FEATURES
 *
 * Handles non-CRUD operations for features.
 * Requires authentication.
 *
 * Routes:
 * POST   /api/resources/users/actions/set-role       → set user role
 * POST   /api/resources/notifications/actions/mark-read → mark as read
 * POST   /api/resources/timetable/actions/auto-generate → auto-generate
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { errorResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { getFeature, type FeatureName } from "@/features";

interface RouteContext {
  params: Promise<{ resource: string }>;
}

// Map resource names to feature names
const resourceMapping: Record<string, FeatureName> = {
  users: "users",
  user: "users",
  notifications: "notifications",
  notification: "notifications",
  timetable: "timetable",
  subscriptions: "subscriptions",
  payments: "payments",
  billing: "billing",
};

// Helper function to execute an action
async function executeAction(
  resource: string,
  actionName: string,
  data: Record<string, unknown>,
  auth: any
) {
  const featureName = resourceMapping[resource];
  if (!featureName) {
    return notFoundResponse(`Resource "${resource}" not found`);
  }

  const feature = getFeature(featureName);
  if (!feature) {
    return notFoundResponse(`Feature "${featureName}" not found`);
  }

  const action = feature.actions?.[actionName];
  if (!action) {
    return notFoundResponse(`Action "${actionName}" not found`);
  }

  // Check action-specific permissions
  const { user } = auth;
  const allowedRoles = action.allowedRoles;
  if (allowedRoles && user && !allowedRoles.includes(user.type as any)) {
    return errorResponse("Unauthorized for this action", 403);
  }

  try {
    return await action.handler(undefined, data, auth);
  } catch (error) {
    logger.error(`Action ${actionName} error for ${resource}`, { error });
    return errorResponse(error instanceof Error ? error.message : "Action failed", 500);
  }
}

export const GET = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource } = await context.params;
    const url = new URL(request.url);
    const actionName = url.searchParams.get("action");

    if (!actionName) {
      return errorResponse("Missing 'action' query parameter", 400);
    }

    // For GET requests, parse query params as data
    const data: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "action") {
        data[key] = value;
      }
    }

    return executeAction(resource, actionName, data, auth);
  },
  ["school-admin", "admin", "teacher", "student", "counselor", "parent"]
);

export const POST = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource } = await context.params;
    const url = new URL(request.url);
    const actionName = url.searchParams.get("action");

    if (!actionName) {
      return errorResponse("Missing 'action' query parameter", 400);
    }

    try {
      const data = await request.json();
      return executeAction(resource, actionName, data, auth);
    } catch (error) {
      logger.error(`Action ${actionName} error for ${resource}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Action failed", 500);
    }
  },
  ["school-admin", "admin", "teacher", "student", "counselor", "parent"]
);
