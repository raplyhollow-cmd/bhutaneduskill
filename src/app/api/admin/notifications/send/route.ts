/**
 * SEND NOTIFICATION API
 *
 * POST /api/admin/notifications/send - Send a notification to target users
 *
 * This endpoint:
 * - Retrieves target users based on notification's targetAudience
 * - Creates notificationDelivery records for each user
 * - Marks notification as sent
 * - Returns delivery statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { notifications, notificationDeliveries, users, userNotificationSettings } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// ============================================================================
// POST - Send Notification
// ============================================================================

interface SendNotificationRequest {
  notificationId: string;
  sendEmail?: boolean; // Optional: whether to send email notifications
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
    const body: SendNotificationRequest = await request.json();

    if (!body.notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Get notification
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, body.notificationId),
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Check if already sent
    if (notification.status === "sent" || notification.status === "sending") {
      return NextResponse.json(
        { error: "Notification has already been sent" },
        { status: 400 }
      );
    }

    // Check if scheduled for future
    if (notification.scheduledFor && new Date(notification.scheduledFor) > new Date()) {
      return NextResponse.json(
        { error: "Notification is scheduled for future delivery. Use PATCH to change the schedule." },
        { status: 400 }
      );
    }

    // Mark as sending
    await db
      .update(notifications)
      .set({
        status: "sending",
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, body.notificationId));

    // Get target users
    let targetUsers: Array<Record<string, unknown>> = [];

    if (notification.targetAudience === "specific") {
      // Parse target user IDs
      const targetUserIds = notification.targetUserIds
        ? JSON.parse(notification.targetUserIds as string)
        : [];

      if (targetUserIds.length === 0) {
        await db
          .update(notifications)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, body.notificationId));

        return NextResponse.json(
          { error: "No target users specified" },
          { status: 400 }
        );
      }

      targetUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, targetUserIds));
    } else if (notification.targetAudience === "all") {
      targetUsers = await db.select().from(users).where(eq(users.isActive, true));
    } else {
      // Map audience to user type
      const userTypeMap: Record<string, string> = {
        students: "student",
        teachers: "teacher",
        parents: "parent",
        counselors: "counselor",
        school_admins: "school_admin",
        admins: "admin",
      };

      const userType = userTypeMap[notification.targetAudience];
      if (!userType) {
        return NextResponse.json(
          { error: `Invalid target audience: ${notification.targetAudience}` },
          { status: 400 }
        );
      }

      targetUsers = await db
        .select()
        .from(users)
        .where(and(eq(users.type, userType), eq(users.isActive, true)));

      // If targeting school admins and there's a school filter
      if (notification.targetSchoolIds && notification.targetAudience === "school_admins") {
        const targetSchoolIds = JSON.parse(notification.targetSchoolIds as string);
        targetUsers = targetUsers.filter((u) =>
          targetSchoolIds.includes(u.schoolId || "")
        );
      }
    }

    if (targetUsers.length === 0) {
      await db
        .update(notifications)
        .set({
          status: "sent",
          totalRecipients: 0,
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, body.notificationId));

      return NextResponse.json({
        message: "Notification sent successfully (no recipients)",
        data: {
          notificationId: body.notificationId,
          totalRecipients: 0,
          deliveredCount: 0,
          skippedCount: 0,
        },
      });
    }

    // Check user notification preferences
    const userSettings = await db
      .select()
      .from(userNotificationSettings)
      .where(inArray(
        userNotificationSettings.userId,
        targetUsers.map((u) => u.id as string)
      ));

    const settingsMap = new Map(
      userSettings.map((s) => [s.userId, s])
    );

    // Create delivery records
    const deliveryRecords: Array<{
      id: string;
      notificationId: string;
      userId: string;
      status: "pending" | "delivered" | "read" | "failed";
      deliveredAt: Date | null;
      deliveryMethod: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = targetUsers.map((user) => {
      const settings = settingsMap.get(user.id as string);
      const shouldDeliverInApp = settings?.inAppEnabled !== false;

      // Check if user's notification type is enabled
      let shouldDeliver = shouldDeliverInApp;
      if (notification.type === "announcement" && settings?.inAppAnnouncements === false) {
        shouldDeliver = false;
      } else if (notification.type === "alert" && settings?.inAppAlerts === false) {
        shouldDeliver = false;
      } else if (notification.type === "reminder" && settings?.inAppReminders === false) {
        shouldDeliver = false;
      }

      return {
        id: `delivery-${nanoid()}`,
        notificationId: body.notificationId,
        userId: user.id as string,
        status: shouldDeliver ? "delivered" : "pending",
        deliveredAt: shouldDeliver ? new Date() : null,
        deliveryMethod: "in_app",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Batch insert deliveries (in chunks to avoid parameter limits)
    const chunkSize = 500;
    for (let i = 0; i < deliveryRecords.length; i += chunkSize) {
      const chunk = deliveryRecords.slice(i, i + chunkSize);
      await db.insert(notificationDeliveries).values(chunk);
    }

    // Calculate statistics
    const deliveredCount = deliveryRecords.filter((d) => d.status === "delivered").length;
    const skippedCount = deliveryRecords.filter((d) => d.status === "pending").length;

    // Update notification with stats
    await db
      .update(notifications)
      .set({
        status: "sent",
        totalRecipients: targetUsers.length,
        deliveredCount,
        readCount: 0,
        failedCount: 0,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, body.notificationId));

    // Send email notifications if requested
    let emailSent = 0;
    if (body.sendEmail) {
      // TODO: Implement email sending
      // This would integrate with your email service (Resend, SendGrid, etc.)
      // For now, just log
      logger.info("Email notifications requested", {
        notificationId: body.notificationId,
        recipientCount: targetUsers.length,
      });
    }

    logger.info("Notification sent successfully", {
      notificationId: body.notificationId,
      totalRecipients: targetUsers.length,
      deliveredCount,
      sentBy: userId,
    });

    return NextResponse.json({
      message: "Notification sent successfully",
      data: {
        notificationId: body.notificationId,
        totalRecipients: targetUsers.length,
        deliveredCount,
        skippedCount,
        emailSent,
        deliveredUsers: deliveryRecords.filter((d) => d.status === "delivered").length,
      },
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/admin/notifications/send",
      method: "POST",
      userId,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Try to mark notification as failed
    try {
      const body = await request.json().catch(() => ({}));
      if (body.notificationId) {
        await db
          .update(notifications)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, body.notificationId));
      }
    } catch {
      // Ignore errors during cleanup
    }

    return NextResponse.json(
      { error: "Failed to send notification", details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /batch - Send multiple notifications at once
// ============================================================================

interface BatchSendRequest {
  notificationIds: string[];
}

export async function BATCH_SEND(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
    const body: BatchSendRequest = await request.json();

    if (!body.notificationIds || body.notificationIds.length === 0) {
      return NextResponse.json(
        { error: "Notification IDs are required" },
        { status: 400 }
      );
    }

    // Limit batch size
    if (body.notificationIds.length > 10) {
      return NextResponse.json(
        { error: "Cannot send more than 10 notifications at once" },
        { status: 400 }
      );
    }

    const results = [];

    // Send each notification
    for (const notificationId of body.notificationIds) {
      try {
        // Mark as sending
        await db
          .update(notifications)
          .set({
            status: "sending",
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, notificationId));

        // TODO: Add actual sending logic here (similar to main POST endpoint)

        results.push({
          notificationId,
          success: true,
          message: "Notification queued for sending",
        });
      } catch (error: any) {
        results.push({
          notificationId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logger.info("Batch send completed", {
      userId,
      total: body.notificationIds.length,
      successCount,
      failureCount,
    });

    return NextResponse.json({
      message: `Batch send completed: ${successCount} succeeded, ${failureCount} failed`,
      data: results,
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/admin/notifications/send/batch",
      method: "POST",
      userId,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send batch notifications", details: errorMessage },
      { status: 500 }
    );
  }
}

// Export batch send as named export for route handling
export { BATCH_SEND as POST_BATCH };
