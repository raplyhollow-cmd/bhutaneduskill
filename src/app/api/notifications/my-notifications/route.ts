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
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET - Get User Notifications
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;
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
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/notifications/my-notifications",
      method: "GET",
      userId,
    });
    return errorResponse("Failed to fetch notifications", 500);
  }
},
  [] // Any authenticated user can access their notifications
);

// ============================================================================
// POST - Mark Notifications as Read
// ============================================================================

interface MarkAsReadRequest {
  deliveryIds?: string[]; // Specific delivery IDs to mark as read
  notificationId?: string; // Or mark all deliveries for a notification as read
  markAll?: boolean; // Or mark all notifications as read
}

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

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
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/notifications/my-notifications",
      method: "POST",
      userId,
    });
    return errorResponse("Failed to mark notifications as read", 500);
  }
},
  [] // Any authenticated user can mark their notifications as read
);

// ============================================================================
// GET /unread-count - Get unread notification count
// ============================================================================

