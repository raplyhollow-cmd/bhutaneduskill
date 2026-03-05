/**
 * LEGACY NOTIFICATIONS API PROXY
 *
 * Proxies old-style API calls to unified API format.
 * This ensures backward compatibility during migration.
 *
 * Old: GET/POST /api/notifications/my-notifications
 * New: POST /api/resources/notifications/actions/my-notifications
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // Proxy to the unified API action handler
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "20";
    const status = url.searchParams.get("status") || "all";
    const page = url.searchParams.get("page") || "1";

    // Import the notifications feature action
    const { getFeature } = await import("@/features");
    const notificationsFeature = getFeature("notifications");

    if (!notificationsFeature?.actions?.["my-notifications"]) {
      return Response.json({ error: "Notifications action not found" }, { status: 404 });
    }

    // Call the action handler
    return await notificationsFeature.actions["my-notifications"].handler(
      undefined,
      { limit: parseInt(limit), status, page: parseInt(page) },
      auth
    );
  },
  ["student", "teacher", "parent", "counselor", "school-admin", "admin"]
);

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    // Proxy to the unified API action handler
    const data = await request.json();

    // Import the notifications feature action
    const { getFeature } = await import("@/features");
    const notificationsFeature = getFeature("notifications");

    if (!notificationsFeature?.actions?.["my-notifications"]) {
      return Response.json({ error: "Notifications action not found" }, { status: 404 });
    }

    // Call the action handler
    return await notificationsFeature.actions["my-notifications"].handler(
      undefined,
      data,
      auth
    );
  },
  ["student", "teacher", "parent", "counselor", "school-admin", "admin"]
);
