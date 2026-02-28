/**
 * ADMIN NOTIFICATIONS API
 *
 * GET /api/admin/notifications - List all notifications with pagination and filters
 * POST /api/admin/notifications - Create a new notification
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications, notificationDeliveries, users } from "@/lib/db/schema";
import { eq, and, desc, asc, like, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET - List Notifications
// ============================================================================

export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    try {
      const { user } = auth;
      const { searchParams } = new URL(req.url);
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
      type QueryCondition = ReturnType<typeof eq> | ReturnType<typeof or> | ReturnType<typeof sql>;
      const conditions: QueryCondition[] = [];

      if (status) {
        conditions.push(sql`${notifications.status} = ${status}`);
      }
      if (type) {
        conditions.push(sql`${notifications.type} = ${type}`);
      }
      if (priority) {
        conditions.push(sql`${notifications.priority} = ${priority}`);
      }
      if (targetAudience) {
        conditions.push(sql`${notifications.targetAudience} = ${targetAudience}`);
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

      return successResponse({
        notifications: enrichedNotifications,
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
      return errorResponse("Failed to fetch notifications: " + errorMessage, 500);
    }
  },
  ['admin']
);

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

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;

    try {
      const body: CreateNotificationRequest = await request.json();

      // Validate required fields
      if (!body.title?.trim()) {
        return badRequestResponse("Title is required");
      }

      if (!body.message?.trim()) {
        return badRequestResponse("Message is required");
      }

      if (!body.targetAudience) {
        return badRequestResponse("Target audience is required");
      }

      // If targetAudience is "specific", targetUserIds must be provided
      if (body.targetAudience === "specific" && (!body.targetUserIds || body.targetUserIds.length === 0)) {
        return badRequestResponse("Target user IDs must be provided when audience is 'specific'");
      }

      // Validate notification type
      const validTypes = ["announcement", "alert", "reminder", "system", "welcome"];
      if (body.type && !validTypes.includes(body.type)) {
        return badRequestResponse(`Invalid notification type. Must be one of: ${validTypes.join(", ")}`);
      }

      // Validate priority
      const validPriorities = ["low", "normal", "high", "urgent"];
      if (body.priority && !validPriorities.includes(body.priority)) {
        return badRequestResponse(`Invalid priority. Must be one of: ${validPriorities.join(", ")}`);
      }

      // Parse dates
      let scheduledFor: Date | undefined;
      let expiresAt: Date | undefined;

      if (body.scheduledFor) {
        scheduledFor = new Date(body.scheduledFor);
        if (isNaN(scheduledFor.getTime())) {
          return badRequestResponse("Invalid scheduledFor date format");
        }

        // Don't allow scheduling in the past
        if (scheduledFor < new Date()) {
          return badRequestResponse("Scheduled date must be in the future");
        }
      }

      if (body.expiresAt) {
        expiresAt = new Date(body.expiresAt);
        if (isNaN(expiresAt.getTime())) {
          return badRequestResponse("Invalid expiresAt date format");
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
            .where(eq(users.type, body.targetAudience === "school_admins" ? "school-admin" : body.targetAudience.slice(0, -1)));
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
      const senderName: string =
        ((user.firstName as string) && (user.lastName as string) ? `${user.firstName} ${user.lastName}` : "Admin");
      const senderRole: string = (user.type as string) || "admin";

      // Helper function to ensure empty strings are converted to null
      const toNull = (value: string | undefined | null): string | null => {
        if (value === undefined || value === null || value === "") return null;
        return value;
      };

      // Build notification values object - use null explicitly for all optional fields
      const notificationValues: Record<string, any> = {
        id: notificationId,
        title: body.title.trim(),
        message: body.message.trim(),
        type: body.type || "announcement",
        category: toNull(body.category),
        targetAudience: body.targetAudience,
        targetUserIds: body.targetUserIds && body.targetUserIds.length > 0 ? JSON.stringify(body.targetUserIds) : null,
        targetSchoolIds: body.targetSchoolIds && body.targetSchoolIds.length > 0 ? JSON.stringify(body.targetSchoolIds) : null,
        priority: body.priority || "normal",
        status,
        senderId: userId,
        senderName: senderName,
        senderRole: senderRole,
        scheduledFor: scheduledFor || null,
        sentAt: null,
        actionUrl: toNull(body.actionUrl),
        actionLabel: toNull(body.actionLabel),
        data: null,
        attachments: body.attachments && body.attachments.length > 0 ? JSON.stringify(body.attachments) : null,
        expiresAt: expiresAt || null,
        totalRecipients: estimatedRecipients,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const notification = await db
        .insert(notifications)
        .values(notificationValues)
        .returning();

      logger.info("Notification created", {
        notificationId,
        userId,
        targetAudience: body.targetAudience,
        estimatedRecipients,
      });

      return createdResponse({
        notification: notification[0],
        message: status === "scheduled"
          ? "Notification scheduled successfully"
          : "Notification created successfully. Use the send endpoint to deliver it.",
      });
    } catch (error: unknown) {
      logger.apiError(error, {
        route: "/api/admin/notifications",
        method: "POST",
        userId,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return errorResponse("Failed to create notification: " + errorMessage, 500);
    }
  },
  ['admin']
);
