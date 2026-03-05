/**
 * CATCH-ALL ACTION ROUTE
 *
 * Handles action calls in the format:
 * POST /api/resources/[resource]/actions/[action-name]
 *
 * This is an alternative to the query parameter format:
 * POST /api/resources/[resource]/actions?action=[action-name]
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { errorResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { getFeature, type FeatureName } from "@/features";

interface RouteContext {
  params: Promise<{ resource: string; action: string }>;
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

export const POST = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { resource, action: actionName } = await context.params;
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
      return notFoundResponse(`Action "${actionName}" not found for ${resource}`);
    }

    // Check action-specific permissions
    const { user } = auth;
    const allowedRoles = action.allowedRoles;
    if (allowedRoles && user && !allowedRoles.includes(user.type as any)) {
      return errorResponse("Unauthorized for this action", 403);
    }

    try {
      const data = await request.json();
      // Actions can be called with or without an ID
      return await action.handler(undefined, data, auth);
    } catch (error) {
      logger.error(`Action ${actionName} error for ${resource}`, { error });
      return errorResponse(error instanceof Error ? error.message : "Action failed", 500);
    }
  },
  ["school-admin", "admin", "teacher", "student", "counselor", "parent", "ministry"]
);
