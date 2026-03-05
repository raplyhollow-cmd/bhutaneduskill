/**
 * LEGACY UNREAD COUNT API PROXY
 *
 * Proxies old-style API calls to unified API format.
 *
 * Old: GET /api/notifications/my-notifications/unread-count
 * New: POST /api/resources/notifications/actions/unread-count
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // Import the notifications feature action
    const { getFeature } = await import("@/features");
    const notificationsFeature = getFeature("notifications");

    if (!notificationsFeature?.actions?.["unread-count"]) {
      return Response.json({ error: "Unread count action not found" }, { status: 404 });
    }

    // Call the action handler
    return await notificationsFeature.actions["unread-count"].handler(
      undefined,
      {},
      auth
    );
  },
  ["student", "teacher", "parent", "counselor", "school-admin", "admin"]
);
