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
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
} from "@/lib/services/notification.service";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

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
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadCountOnly = searchParams.get("unreadCount") === "true";

    // If only requesting unread count
    if (unreadCountOnly) {
      const count = await getUnreadCount(userId);

      logger.info("Fetched unread notification count", { userId, count });

      return successResponse({ unreadCount: count });
    }

    // Get notifications
    const notifications = await getUserNotifications(userId, {
      unreadOnly,
      limit,
      offset,
    });

    logger.info("Fetched notifications", { userId, count: notifications.length });

    return successResponse(notifications);
  },
  [] // No role restriction - any authenticated user
);

/**
 * POST /api/notifications
 *
 * Create a new notification
 * Requires admin role
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;

    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return badRequestResponse("Title and message are required");
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
      senderName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Admin",
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

    return successResponse(notification);
  },
  ['admin']
);

/**
 * PATCH /api/notifications
 *
 * Update notification status
 * Used to mark notifications as read or unread
 */
export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();

    // Mark all as read
    if (body.action === "markAllAsRead") {
      const count = await markAllAsRead(userId);

      logger.info("All notifications marked as read", { userId, count });

      return successResponse({ markedAsRead: count });
    }

    // Mark specific notification as read
    if (body.action === "markAsRead" && body.notificationId) {
      const delivery = await markAsRead(body.notificationId, userId);

      if (!delivery) {
        return notFoundResponse("Notification");
      }

      logger.info("Notification marked as read", {
        notificationId: body.notificationId,
        userId,
      });

      return successResponse(delivery);
    }

    return badRequestResponse("Invalid action. Use 'markAsRead' or 'markAllAsRead'");
  },
  [] // No role restriction - any authenticated user
);

/**
 * DELETE /api/notifications
 *
 * Delete a notification for the current user
 */
export const DELETE = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return badRequestResponse("notificationId is required");
    }

    const success = await deleteNotification(notificationId, userId);

    if (!success) {
      return notFoundResponse("Notification");
    }

    logger.info("Notification deleted", { notificationId, userId });

    return successResponse({ deleted: true });
  },
  [] // No role restriction - any authenticated user
);
