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

    // Get total unread count
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          or(
            eq(notificationDeliveries.status, "pending"),
            eq(notificationDeliveries.status, "delivered")
          )!
        )
      );

    const unreadCount = result[0]?.count || 0;

    // Also get high priority unread count (urgent)
    const highPriorityResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationDeliveries)
      .innerJoin(notifications, eq(notificationDeliveries.notificationId, notifications.id))
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          or(
            eq(notificationDeliveries.status, "pending"),
            eq(notificationDeliveries.status, "delivered")
          )!,
          eq(notifications.priority, "urgent")
        )
      );

    const urgentCount = highPriorityResult[0]?.count || 0;

    return successResponse({
      unreadCount,
      urgentCount,
    });
  },
  [] // Any authenticated user can get their unread count
);
