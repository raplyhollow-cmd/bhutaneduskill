/**
 * PUSH SEND API
 *
 * POST /api/push/send - Send a push notification to user(s)
 *
 * This endpoint allows teachers, school admins, and platform admins to send
 * push notifications to students, parents, and other users.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { sendPushNotification, sendBulkPushNotifications } from "@/lib/push/push-sender";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, forbiddenResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface SendPushNotificationRequest {
  userIds: string | string[]; // Single user ID or array of user IDs
  type: "homework" | "announcement" | "grade" | "attendance" | "reminder" | "alert" | "message" | "fee" | "timetable" | "exam";
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    actionId?: string;
    [key: string]: unknown;
  };
  requireInteraction?: boolean;
  tag?: string;
  vibrate?: number[];
  scheduledFor?: string; // ISO date string
}

// ============================================================================
// POST - Send Push Notification
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const body: SendPushNotificationRequest = await req.json();

    // Validate required fields
    if (!body.userIds || !body.type || !body.title || !body.body) {
      return badRequestResponse("Missing required fields: userIds, type, title, body");
    }

    // Check authorization - only teachers, school admins, and platform admins can send
    const allowedRoles = ["teacher", "school-admin", "admin", "counselor"];
    if (!allowedRoles.includes(user.type)) {
      return forbiddenResponse("You don't have permission to send push notifications");
    }

    // Normalize userIds to array
    const targetUserIds = Array.isArray(body.userIds) ? body.userIds : [body.userIds];

    // Prepare notification payload
    const payload = {
      type: body.type,
      title: body.title,
      body: body.body,
      icon: body.icon,
      badge: body.badge,
      data: body.data,
      requireInteraction: body.requireInteraction,
      tag: body.tag,
      vibrate: body.vibrate,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    };

    let result;

    if (targetUserIds.length === 1) {
      // Single user notification
      result = await sendPushNotification({
        userId: targetUserIds[0],
        ...payload,
      });

      if (!result.success) {
        return errorResponse(result.error || "Failed to send notification", 400);
      }

      logger.info("Push notification sent", {
        senderId: userId,
        notificationId: result.notificationId,
        targetUserId: targetUserIds[0],
      });

      return successResponse({
        notificationId: result.notificationId,
        recipients: 1,
      });
    }

    // Bulk notification
    const bulkResult = await sendBulkPushNotifications(targetUserIds, payload);

    logger.info("Bulk push notifications sent", {
      senderId: userId,
      success: bulkResult.success,
      failed: bulkResult.failed,
    });

    return successResponse({
      recipients: bulkResult.success,
      failed: bulkResult.failed,
    });
  },
  ["teacher", "school-admin", "admin", "counselor"]
);
