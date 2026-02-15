/**
 * UNREAD NOTIFICATION COUNT API
 *
 * GET /api/notifications/my-notifications/unread-count - Get unread notification count
 *
 * This is a lightweight endpoint for polling notification badge counts
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { notificationDeliveries, notifications } from "@/lib/db/schema";
import { eq, and, or, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
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

    return NextResponse.json({
      data: {
        unreadCount,
        urgentCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch unread count", details: error.message },
      { status: 500 }
    );
  }
}
