/**
 * USER NOTIFICATIONS API
 *
 * GET /api/notifications/my-notifications - Get current user's notifications
 * POST /api/notifications/my-notifications/read - Mark notifications as read
 *
 * This endpoint allows all authenticated users to:
 * - Get their notifications (unread first, then read)
 * - Mark notifications as read
 * - Filter by status, type
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { notifications, notificationDeliveries } from "@/lib/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// GET - Get User Notifications
// ============================================================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user, userId } = authResult;
  const { searchParams } = new URL(request.url);

  try {
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status"); // "unread", "read", "all"
    const type = searchParams.get("type");

    // Build where conditions
    const conditions = [
      eq(notificationDeliveries.userId, userId),
    ];

    // Filter by status
    if (status === "unread") {
      conditions.push(
        or(
          eq(notificationDeliveries.status, "pending"),
          eq(notificationDeliveries.status, "delivered")
        )!
      );
    } else if (status === "read") {
      conditions.push(eq(notificationDeliveries.status, "read"));
    }
    // If status is "all" or not specified, include all except failed

    if (type) {
      conditions.push(eq(notifications.type, type as any));
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationDeliveries)
      .innerJoin(notifications, eq(notificationDeliveries.notificationId, notifications.id))
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Fetch notifications with unread first
    // We need to do two queries and merge to get proper sorting
    const unreadDeliveries = await db
      .select({
        id: notificationDeliveries.id,
        notificationId: notificationDeliveries.notificationId,
        status: notificationDeliveries.status,
        deliveredAt: notificationDeliveries.deliveredAt,
        readAt: notificationDeliveries.readAt,
        notification: {
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          category: notifications.category,
          priority: notifications.priority,
          actionUrl: notifications.actionUrl,
          actionLabel: notifications.actionLabel,
          expiresAt: notifications.expiresAt,
          createdAt: notifications.createdAt,
        },
      })
      .from(notificationDeliveries)
      .innerJoin(notifications, eq(notificationDeliveries.notificationId, notifications.id))
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          or(
            eq(notificationDeliveries.status, "pending"),
            eq(notificationDeliveries.status, "delivered")
          )!
        )
      )
      .orderBy(desc(notificationDeliveries.deliveredAt))
      .limit(limit);

    const readDeliveries = await db
      .select({
        id: notificationDeliveries.id,
        notificationId: notificationDeliveries.notificationId,
        status: notificationDeliveries.status,
        deliveredAt: notificationDeliveries.deliveredAt,
        readAt: notificationDeliveries.readAt,
        notification: {
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          category: notifications.category,
          priority: notifications.priority,
          actionUrl: notifications.actionUrl,
          actionLabel: notifications.actionLabel,
          expiresAt: notifications.expiresAt,
          createdAt: notifications.createdAt,
        },
      })
      .from(notificationDeliveries)
      .innerJoin(notifications, eq(notificationDeliveries.notificationId, notifications.id))
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          eq(notificationDeliveries.status, "read")
        )
      )
      .orderBy(desc(notificationDeliveries.readAt))
      .limit(Math.max(0, limit - unreadDeliveries.length));

    // Merge results (unread first, then read)
    const allDeliveries = [...unreadDeliveries, ...readDeliveries];

    // Apply pagination
    const paginatedDeliveries = allDeliveries.slice(offset, offset + limit);

    // Get unread count
    const unreadCount = await db
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

    // Transform response
    const transformedNotifications = paginatedDeliveries.map((delivery) => ({
      id: delivery.notificationId,
      deliveryId: delivery.id,
      title: delivery.notification.title,
      message: delivery.notification.message,
      type: delivery.notification.type,
      category: delivery.notification.category,
      priority: delivery.notification.priority,
      actionUrl: delivery.notification.actionUrl,
      actionLabel: delivery.notification.actionLabel,
      isRead: delivery.status === "read",
      readAt: delivery.readAt,
      deliveredAt: delivery.deliveredAt,
      expiresAt: delivery.notification.expiresAt,
      createdAt: delivery.notification.createdAt,
    }));

    return NextResponse.json({
      data: transformedNotifications,
      unreadCount: unreadCount[0]?.count || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.apiError(error, {
      route: "/api/notifications/my-notifications",
      method: "GET",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Mark Notifications as Read
// ============================================================================

interface MarkAsReadRequest {
  deliveryIds?: string[]; // Specific delivery IDs to mark as read
  notificationId?: string; // Or mark all deliveries for a notification as read
  markAll?: boolean; // Or mark all notifications as read
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
    const body: MarkAsReadRequest = await request.json();

    const now = new Date();
    let updatedCount = 0;

    if (body.markAll) {
      // Mark all unread notifications as read
      const result = await db
        .update(notificationDeliveries)
        .set({
          status: "read",
          readAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(notificationDeliveries.userId, userId),
            or(
              eq(notificationDeliveries.status, "pending"),
              eq(notificationDeliveries.status, "delivered")
            )!
          )
        );

      // Estimate count (Drizzle doesn't return affected rows count directly in all cases)
      updatedCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationDeliveries)
        .where(
          and(
            eq(notificationDeliveries.userId, userId),
            eq(notificationDeliveries.status, "read"),
            eq(notificationDeliveries.readAt, now)
          )
        )
        .then((r) => r[0]?.count || 0);

      logger.info("All notifications marked as read", { userId });
    } else if (body.deliveryIds && body.deliveryIds.length > 0) {
      // Mark specific delivery IDs as read
      for (const deliveryId of body.deliveryIds) {
        await db
          .update(notificationDeliveries)
          .set({
            status: "read",
            readAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(notificationDeliveries.id, deliveryId),
              eq(notificationDeliveries.userId, userId)
            )
          );
        updatedCount++;
      }

      logger.info("Specific notifications marked as read", { userId, count: updatedCount });
    } else if (body.notificationId) {
      // Mark all deliveries for a specific notification as read
      const result = await db
        .update(notificationDeliveries)
        .set({
          status: "read",
          readAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(notificationDeliveries.notificationId, body.notificationId),
            eq(notificationDeliveries.userId, userId),
            or(
              eq(notificationDeliveries.status, "pending"),
              eq(notificationDeliveries.status, "delivered")
            )!
          )
        );

      // Get count
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationDeliveries)
        .where(
          and(
            eq(notificationDeliveries.notificationId, body.notificationId),
            eq(notificationDeliveries.userId, userId),
            eq(notificationDeliveries.status, "read")
          )
        );

      updatedCount = countResult[0]?.count || 0;

      logger.info("Notification marked as read", { userId, notificationId: body.notificationId });
    } else {
      return NextResponse.json(
        { error: "Must provide deliveryIds, notificationId, or markAll" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `${updatedCount} notification(s) marked as read`,
      data: {
        updatedCount,
        readAt: now,
      },
    });
  } catch (error: any) {
    logger.apiError(error, {
      route: "/api/notifications/my-notifications",
      method: "POST",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to mark notifications as read", details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /unread-count - Get unread notification count
// ============================================================================

export async function UNREAD_COUNT(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
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

    // Also get high priority unread count
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
    logger.apiError(error, {
      route: "/api/notifications/my-notifications/unread-count",
      method: "GET",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to fetch unread count", details: error.message },
      { status: 500 }
    );
  }
}
