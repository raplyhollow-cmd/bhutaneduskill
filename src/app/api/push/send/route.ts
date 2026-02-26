/**
 * PUSH SEND API
 *
 * POST /api/push/send - Send a push notification to user(s)
 *
 * This endpoint allows teachers, school admins, and platform admins to send
 * push notifications to students, parents, and other users.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { sendPushNotification, sendBulkPushNotifications } from "@/lib/push/push-sender";
import { logger } from "@/lib/logger";

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

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user } = authResult;

  try {
    const body: SendPushNotificationRequest = await request.json();

    // Validate required fields
    if (!body.userIds || !body.type || !body.title || !body.body) {
      return NextResponse.json(
        { error: "Missing required fields: userIds, type, title, body" },
        { status: 400 }
      );
    }

    // Check authorization - only teachers, school admins, and platform admins can send
    const allowedRoles = ["teacher", "school_admin", "admin", "counselor"];
    if (!allowedRoles.includes(user.type)) {
      return NextResponse.json(
        { error: "You don't have permission to send push notifications" },
        { status: 403 }
      );
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
        return NextResponse.json(
          { error: result.error || "Failed to send notification" },
          { status: 400 }
        );
      }

      logger.info("Push notification sent", {
        senderId: userId,
        notificationId: result.notificationId,
        targetUserId: targetUserIds[0],
      });

      return NextResponse.json({
        success: true,
        data: {
          notificationId: result.notificationId,
          recipients: 1,
        },
      });
    }

    // Bulk notification
    const bulkResult = await sendBulkPushNotifications(targetUserIds, payload as any);

    logger.info("Bulk push notifications sent", {
      senderId: userId,
      success: bulkResult.success,
      failed: bulkResult.failed,
    });

    return NextResponse.json({
      success: true,
      data: {
        recipients: bulkResult.success,
        failed: bulkResult.failed,
      },
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/push/send",
      method: "POST",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to send push notification", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
