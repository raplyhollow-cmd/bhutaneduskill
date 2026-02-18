/**
 * ADMIN NOTIFICATIONS API
 *
 * GET /api/admin/notifications - List all notifications with pagination and filters
 * POST /api/admin/notifications - Create a new notification
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { notifications, notificationDeliveries, users } from "@/lib/db/schema";
import { eq, and, desc, asc, like, or, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// ============================================================================
// GET - List Notifications
// ============================================================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user, userId } = authResult;
  const { searchParams } = new URL(request.url);

  try {
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const targetAudience = searchParams.get("targetAudience");
    const search = searchParams.get("search");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where conditions
    const conditions: Array<ReturnType<typeof eq>> = [];

    if (status) {
      conditions.push(eq(notifications.status, status as unknown as typeof notifications.status));
    }
    if (type) {
      conditions.push(eq(notifications.type, type as unknown as typeof notifications.type));
    }
    if (priority) {
      conditions.push(eq(notifications.priority, priority as unknown as typeof notifications.priority));
    }
    if (targetAudience) {
      conditions.push(eq(notifications.targetAudience, targetAudience as unknown as typeof notifications.targetAudience));
    }
    if (search) {
      conditions.push(
        or(
          like(notifications.title, `%${search}%`),
          like(notifications.message, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Build order by clause
    let orderBy;
    const orderColumn = sortBy === "scheduledFor" ? notifications.scheduledFor :
                       sortBy === "sentAt" ? notifications.sentAt :
                       sortBy === "priority" ? notifications.priority :
                       notifications.createdAt;

    orderBy = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    // Fetch notifications
    const notificationList = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        category: notifications.category,
        targetAudience: notifications.targetAudience,
        priority: notifications.priority,
        status: notifications.status,
        scheduledFor: notifications.scheduledFor,
        sentAt: notifications.sentAt,
        senderId: notifications.senderId,
        senderName: notifications.senderName,
        senderRole: notifications.senderRole,
        actionUrl: notifications.actionUrl,
        actionLabel: notifications.actionLabel,
        expiresAt: notifications.expiresAt,
        totalRecipients: notifications.totalRecipients,
        deliveredCount: notifications.deliveredCount,
        readCount: notifications.readCount,
        failedCount: notifications.failedCount,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
      })
      .from(notifications)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get delivery statistics for each notification
    const enrichedNotifications = await Promise.all(
      notificationList.map(async (notification) => {
        // Get additional stats if needed
        if (notification.status === "sent" || notification.status === "sending") {
          const pendingCount = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notificationDeliveries)
            .where(
              and(
                eq(notificationDeliveries.notificationId, notification.id),
                eq(notificationDeliveries.status, "pending")
              )
            );

          return {
            ...notification,
            pendingCount: pendingCount[0]?.count || 0,
          };
        }
        return {
          ...notification,
          pendingCount: 0,
        };
      })
    );

    return NextResponse.json({
      data: enrichedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/admin/notifications",
      method: "GET",
      userId,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Notification
// ============================================================================

interface CreateNotificationRequest {
  title: string;
  message: string;
  type?: "announcement" | "alert" | "reminder" | "system" | "welcome";
  category?: string;
  targetAudience: "all" | "students" | "teachers" | "parents" | "counselors" | "school_admins" | "admins" | "specific";
  targetUserIds?: string[];
  targetSchoolIds?: string[];
  priority?: "low" | "normal" | "high" | "urgent";
  scheduledFor?: string; // ISO date string
  actionUrl?: string;
  actionLabel?: string;
  attachments?: string[];
  expiresAt?: string; // ISO date string
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user, userId } = authResult;

  try {
    const body: CreateNotificationRequest = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!body.targetAudience) {
      return NextResponse.json(
        { error: "Target audience is required" },
        { status: 400 }
      );
    }

    // If targetAudience is "specific", targetUserIds must be provided
    if (body.targetAudience === "specific" && (!body.targetUserIds || body.targetUserIds.length === 0)) {
      return NextResponse.json(
        { error: "Target user IDs must be provided when audience is 'specific'" },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ["announcement", "alert", "reminder", "system", "welcome"];
    if (body.type && !validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` },
        { status: 400 }
      );
    }

    // Parse dates
    let scheduledFor: Date | undefined;
    let expiresAt: Date | undefined;

    if (body.scheduledFor) {
      scheduledFor = new Date(body.scheduledFor);
      if (isNaN(scheduledFor.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduledFor date format" },
          { status: 400 }
        );
      }

      // Don't allow scheduling in the past
      if (scheduledFor < new Date()) {
        return NextResponse.json(
          { error: "Scheduled date must be in the future" },
          { status: 400 }
        );
      }
    }

    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiresAt date format" },
          { status: 400 }
        );
      }
    }

    // Estimate recipients count
    let estimatedRecipients = 0;

    if (body.targetAudience === "specific" && body.targetUserIds) {
      estimatedRecipients = body.targetUserIds.length;
    } else {
      // Count users by type
      const recipientQuery = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);

      if (body.targetAudience === "all") {
        estimatedRecipients = recipientQuery[0]?.count || 0;
      } else {
        const userCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(eq(users.type, body.targetAudience === "school_admins" ? "school_admin" : body.targetAudience.slice(0, -1)));
        estimatedRecipients = userCount[0]?.count || 0;
      }
    }

    // Determine status
    let status: "draft" | "scheduled" = "draft";
    if (scheduledFor) {
      status = "scheduled";
    }

    // Create notification
    const notificationId: string = `notif-${nanoid()}`;
    const senderName: string = (user.name as string) ||
      ((user.firstName as string) && (user.lastName as string) ? `${user.firstName} ${user.lastName}` : "Admin");
    const senderRole: string = (user.type as string) || "admin";

    const notification = await db
      .insert(notifications)
      .values({
        id: notificationId,
        title: body.title.trim(),
        message: body.message.trim(),
        type: body.type || "announcement",
        category: body.category || null,
        targetAudience: body.targetAudience,
        targetUserIds: body.targetUserIds ? JSON.stringify(body.targetUserIds) : null,
        targetSchoolIds: body.targetSchoolIds ? JSON.stringify(body.targetSchoolIds) : null,
        priority: body.priority || "normal",
        status,
        senderId: userId,
        senderName: senderName,
        senderRole: senderRole,
        scheduledFor,
        actionUrl: body.actionUrl || null,
        actionLabel: body.actionLabel || null,
        attachments: body.attachments ? JSON.stringify(body.attachments) : null,
        expiresAt,
        totalRecipients: estimatedRecipients,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Notification created", {
      notificationId,
      userId,
      targetAudience: body.targetAudience,
      estimatedRecipients,
    });

    return NextResponse.json({
      data: notification[0],
      message: status === "scheduled"
        ? "Notification scheduled successfully"
        : "Notification created successfully. Use the send endpoint to deliver it.",
    }, { status: 201 });
  } catch (error: unknown) {
    logger.apiError(error, {
      route: "/api/admin/notifications",
      method: "POST",
      userId,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create notification", details: errorMessage },
      { status: 500 }
    );
  }
}
