/**
 * UNREAD NOTIFICATION COUNT API
 *
 * GET /api/notifications/my-notifications/unread-count - Get unread notification count
 *
 * This is a lightweight endpoint for polling notification badge counts.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notificationDeliveries, notifications } from "@/lib/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    console.log("[UnreadCount API] Fetching unread count for userId:", userId);

    // Get total unread count (pending or delivered but not read)
    let result;
    try {
      result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationDeliveries)
        .where(
          and(
            eq(notificationDeliveries.userId, userId),
            or(
              eq(notificationDeliveries.status, "pending"),
              eq(notificationDeliveries.status, "delivered")
            )
          )
        );
      console.log("[UnreadCount API] Query result:", result);
    } catch (dbError) {
      console.error("[UnreadCount API] Database query failed:", dbError);
      // Return 0 instead of failing - notifications may not exist yet
      return successResponse({
        unreadCount: 0,
        urgentCount: 0,
      });
    }

    const unreadCount = result[0]?.count || 0;

    // For now, return same count for urgent (simplified - no join)
    // TODO: Add proper urgent counting when notifications table has data
    return successResponse({
      unreadCount,
      urgentCount: 0,
    });
  },
  [] // Any authenticated user can get their unread count
);
