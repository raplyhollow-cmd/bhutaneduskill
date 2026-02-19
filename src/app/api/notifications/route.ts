/**
 * NOTIFICATIONS API ROUTE
 *
 * Handles notification retrieval, creation, and status updates.
 *
 * Routes:
 * - GET /api/notifications - Get user's notifications
 * - POST /api/notifications - Create new notification (admin only)
 * - PATCH /api/notifications - Mark notification as read
 * - DELETE /api/notifications - Delete notification
 */

import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
} from "@/lib/services/notification.service";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/notifications
 *
 * Get notifications for the current user
 *
 * Query params:
 * - unreadOnly: boolean - Only get unread notifications
 * - limit: number - Max number of notifications to return
 * - offset: number - Number of notifications to skip
 * - unreadCount: boolean - Return only the unread count
 */
export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status || 401 } satisfies ApiErrorResponse,
        { status: authResult.status || 401 }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadCountOnly = searchParams.get("unreadCount") === "true";

    // If only requesting unread count
    if (unreadCountOnly) {
      const count = await getUnreadCount(userId);

      logger.info("Fetched unread notification count", { userId, count });

      return Response.json({ data: { unreadCount: count }, status: 200 } satisfies ApiSuccess<{ unreadCount: number }>);
    }

    // Get notifications
    const notifications = await getUserNotifications(userId, {
      unreadOnly,
      limit,
      offset,
    });

    logger.info("Fetched notifications", { userId, count: notifications.length });

    return Response.json({ data: notifications, status: 200 } satisfies ApiSuccess<typeof notifications>);
  } catch (error) {
    logger.apiError(error, { route: "/api/notifications", method: "GET" });
    return Response.json(
      { error: "Failed to fetch notifications", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 *
 * Create a new notification
 * Requires admin role
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ('error' in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status || 401 } satisfies ApiErrorResponse,
        { status: authResult.status || 401 }
      );
    }
    const { userId, user } = authResult;

    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return Response.json(
        { error: "Title and message are required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Create notification with current user as sender
    const notification = await createNotification({
      title: body.title,
      message: body.message,
      type: body.type || "announcement",
      priority: body.priority || "normal",
      targetAudience: body.targetAudience || "all",
      targetUserIds: body.targetUserIds,
      targetSchoolIds: body.targetSchoolIds,
      senderId: userId,
      senderName: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Admin",
      senderRole: user.type,
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      data: body.data,
      attachments: body.attachments,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    logger.info("Notification created", {
      notificationId: notification.id,
      createdBy: userId,
    });

    return Response.json({ data: notification, status: 200 } satisfies ApiSuccess<typeof notification>);
  } catch (error) {
    logger.apiError(error, { route: "/api/notifications", method: "POST" });
    return Response.json(
      { error: "Failed to create notification", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 *
 * Update notification status
 * Used to mark notifications as read or unread
 */
export async function PATCH(req: Request) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status || 401 } satisfies ApiErrorResponse,
        { status: authResult.status || 401 }
      );
    }
    const { userId } = authResult;

    const body = await req.json();

    // Mark all as read
    if (body.action === "markAllAsRead") {
      const count = await markAllAsRead(userId);

      logger.info("All notifications marked as read", { userId, count });

      return Response.json({ data: { markedAsRead: count }, status: 200 } satisfies ApiSuccess<{ markedAsRead: number }>);
    }

    // Mark specific notification as read
    if (body.action === "markAsRead" && body.notificationId) {
      const delivery = await markAsRead(body.notificationId, userId);

      if (!delivery) {
        return Response.json(
          { error: "Notification not found", status: 404 } satisfies ApiErrorResponse,
          { status: 404 }
        );
      }

      logger.info("Notification marked as read", {
        notificationId: body.notificationId,
        userId,
      });

      return Response.json({ data: delivery, status: 200 } satisfies ApiSuccess<typeof delivery>);
    }

    return Response.json(
      { error: "Invalid action. Use 'markAsRead' or 'markAllAsRead'", status: 400 } satisfies ApiErrorResponse,
      { status: 400 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/api/notifications", method: "PATCH" });
    return Response.json(
      { error: "Failed to update notification", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 *
 * Delete a notification for the current user
 */
export async function DELETE(req: Request) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status || 401 } satisfies ApiErrorResponse,
        { status: authResult.status || 401 }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return Response.json(
        { error: "notificationId is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const success = await deleteNotification(notificationId, userId);

    if (!success) {
      return Response.json(
        { error: "Notification not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    logger.info("Notification deleted", { notificationId, userId });

    return Response.json({ data: { deleted: true }, status: 200 } satisfies ApiSuccess<{ deleted: boolean }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/notifications", method: "DELETE" });
    return Response.json(
      { error: "Failed to delete notification", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
