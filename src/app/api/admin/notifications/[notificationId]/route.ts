/**
 * INDIVIDUAL NOTIFICATION API
 *
 * GET /api/admin/notifications/[notificationId] - Get a single notification
 * PATCH /api/admin/notifications/[notificationId] - Update a notification
 * DELETE /api/admin/notifications/[notificationId] - Delete a notification
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { notifications, notificationDeliveries, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ notificationId: string }>;
}

// ============================================================================
// GET - Get Single Notification
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;
  const { notificationId } = await params;

  try {
    // Get notification
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId),
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Get delivery statistics
    const deliveryStats = await db
      .select({
        status: notificationDeliveries.status,
        count: sql<number>`count(*)::int`,
      })
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, notificationId))
      .groupBy(notificationDeliveries.status);

    const stats = {
      total: 0,
      pending: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };

    deliveryStats.forEach((stat) => {
      stats.total += stat.count;
      if (stat.status === "pending") stats.pending = stat.count;
      if (stat.status === "delivered") stats.delivered = stat.count;
      if (stat.status === "read") stats.read = stat.count;
      if (stat.status === "failed") stats.failed = stat.count;
    });

    // Get recent deliveries (limit 20)
    const recentDeliveries = await db
      .select({
        id: notificationDeliveries.id,
        userId: notificationDeliveries.userId,
        userName: users.name,
        userEmail: users.email,
        userType: users.type,
        status: notificationDeliveries.status,
        deliveredAt: notificationDeliveries.deliveredAt,
        readAt: notificationDeliveries.readAt,
        errorMessage: notificationDeliveries.errorMessage,
      })
      .from(notificationDeliveries)
      .leftJoin(users, eq(notificationDeliveries.userId, users.id))
      .where(eq(notificationDeliveries.notificationId, notificationId))
      .orderBy(desc(notificationDeliveries.createdAt))
      .limit(20);

    return NextResponse.json({
      data: {
        ...notification,
        deliveryStats: stats,
        recentDeliveries,
      },
    });
  } catch (error: any) {
    logger.apiError(error, {
      route: `/api/admin/notifications/${notificationId}`,
      method: "GET",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to fetch notification", details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Notification
// ============================================================================

interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  type?: "announcement" | "alert" | "reminder" | "system" | "welcome";
  category?: string;
  targetAudience?: "all" | "students" | "teachers" | "parents" | "counselors" | "school_admins" | "admins" | "specific";
  targetUserIds?: string[];
  targetSchoolIds?: string[];
  priority?: "low" | "normal" | "high" | "urgent";
  scheduledFor?: string;
  actionUrl?: string;
  actionLabel?: string;
  attachments?: string[];
  expiresAt?: string;
  status?: "draft" | "scheduled" | "cancelled";
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;
  const { notificationId } = await params;

  try {
    // Check if notification exists
    const existing = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Cannot update sent notifications
    if (existing.status === "sent" || existing.status === "sending") {
      return NextResponse.json(
        { error: "Cannot update a notification that has already been sent" },
        { status: 400 }
      );
    }

    const body: UpdateNotificationRequest = await request.json();

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.message !== undefined) updateData.message = body.message.trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.targetAudience !== undefined) updateData.targetAudience = body.targetAudience;
    if (body.targetUserIds !== undefined) updateData.targetUserIds = JSON.stringify(body.targetUserIds);
    if (body.targetSchoolIds !== undefined) updateData.targetSchoolIds = JSON.stringify(body.targetSchoolIds);
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.actionUrl !== undefined) updateData.actionUrl = body.actionUrl;
    if (body.actionLabel !== undefined) updateData.actionLabel = body.actionLabel;
    if (body.attachments !== undefined) updateData.attachments = JSON.stringify(body.attachments);

    if (body.scheduledFor !== undefined) {
      const scheduledDate = new Date(body.scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduledFor date format" },
          { status: 400 }
        );
      }
      updateData.scheduledFor = scheduledDate;
    }

    if (body.expiresAt !== undefined) {
      const expiresDate = new Date(body.expiresAt);
      if (isNaN(expiresDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiresAt date format" },
          { status: 400 }
        );
      }
      updateData.expiresAt = expiresDate;
    }

    if (body.status !== undefined) {
      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        draft: ["scheduled", "cancelled"],
        scheduled: ["draft", "cancelled"],
        cancelled: [],
        sent: [],
        sending: [],
        failed: [],
      };

      if (!validTransitions[existing.status]?.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${existing.status} to ${body.status}` },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    // Update notification
    const updated = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, notificationId))
      .returning();

    logger.info("Notification updated", {
      notificationId,
      userId,
      changes: Object.keys(body),
    });

    return NextResponse.json({
      data: updated[0],
      message: "Notification updated successfully",
    });
  } catch (error: any) {
    logger.apiError(error, {
      route: `/api/admin/notifications/${notificationId}`,
      method: "PATCH",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to update notification", details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Notification
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;
  const { notificationId } = await params;

  try {
    // Check if notification exists
    const existing = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Cannot delete sent notifications (only cancel)
    if (existing.status === "sent" || existing.status === "sending") {
      return NextResponse.json(
        { error: "Cannot delete a notification that has already been sent. Use PATCH to cancel it." },
        { status: 400 }
      );
    }

    // Delete notification (cascade will delete deliveries)
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    logger.info("Notification deleted", {
      notificationId,
      userId,
    });

    return NextResponse.json({
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    logger.apiError(error, {
      route: `/api/admin/notifications/${notificationId}`,
      method: "DELETE",
      userId,
    });
    return NextResponse.json(
      { error: "Failed to delete notification", details: error.message },
      { status: 500 }
    );
  }
}
