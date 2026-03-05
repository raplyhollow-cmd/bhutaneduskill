/**
 * NOTIFICATIONS FEATURE
 *
 * Unified definition for Notification resource: Schema + API + Actions
 * Handles user notifications with actions for marking as read, getting counts
 */

import { defineFeature } from "@/lib/features/define-feature";

export const NotificationsFeature = defineFeature({
  name: "notifications",
  tableName: "notification_deliveries",

  schema: {
    id: { type: "text", required: true, label: "ID" },
    userId: { type: "text", required: true, label: "User ID", index: true },
    notificationId: { type: "text", label: "Notification ID" },
    status: {
      type: "select",
      label: "Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "delivered", label: "Delivered" },
        { value: "read", label: "Read" },
      ],
    },
    type: {
      type: "select",
      label: "Type",
      options: [
        { value: "info", label: "Info" },
        { value: "warning", label: "Warning" },
        { value: "urgent", label: "Urgent" },
      ],
    },
    title: { type: "text", label: "Title" },
    message: { type: "text", label: "Message" },
    readAt: { type: "timestamp", label: "Read At" },
    createdAt: { type: "timestamp", label: "Created At", sortable: true },
    updatedAt: { type: "timestamp", label: "Updated At" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent", "counselor"],
    create: ["admin", "school-admin"],
    update: ["admin", "school-admin"],
    delete: ["admin"],
  },

  ui: {
    title: "Notification",
    titlePlural: "Notifications",
    basePath: "/notifications",
    columns: [
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created" },
    ],
  },

  // Actions for notifications
  actions: {
    // Get current user's notifications (my-notifications)
    "my-notifications": {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { notificationDeliveries } = await import("@/lib/db/schema");
        const { eq, and, desc, or, sql } = await import("drizzle-orm");
        const { successResponse } = await import("@/lib/api/response-helpers");

        const { userId } = auth;
        const { page = 1, limit = 20, status } = data;
        const offset = (page - 1) * limit;

        // Build conditions
        const conditions = [eq(notificationDeliveries.userId, userId)];

        if (status === "unread") {
          conditions.push(or(eq(notificationDeliveries.status, "pending"), eq(notificationDeliveries.status, "delivered"))!);
        } else if (status === "read") {
          conditions.push(eq(notificationDeliveries.status, "read"));
        }

        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationDeliveries)
          .where(whereClause);

        const total = countResult[0]?.count || 0;

        // Get notifications
        const notifications = await db
          .select()
          .from(notificationDeliveries)
          .where(whereClause)
          .orderBy(desc(notificationDeliveries.createdAt))
          .limit(limit)
          .offset(offset);

        // Get unread count
        const unreadResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationDeliveries)
          .where(
            and(
              eq(notificationDeliveries.userId, userId),
              or(eq(notificationDeliveries.status, "pending"), eq(notificationDeliveries.status, "delivered"))!
            )
          );

        return successResponse({
          notifications,
          unreadCount: unreadResult[0]?.count || 0,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      },
      allowedRoles: ["admin", "school-admin", "teacher", "student", "parent", "counselor"] as any[],
    },

    // Mark notifications as read
    "mark-read": {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { notificationDeliveries } = await import("@/lib/db/schema");
        const { eq, and, or, sql } = await import("drizzle-orm");
        const { successResponse, badRequestResponse } = await import("@/lib/api/response-helpers");
        const { logger } = await import("@/lib/logger");

        const { userId } = auth;
        const { deliveryIds, notificationId, markAll } = data;

        const now = new Date();
        let updatedCount = 0;

        if (markAll) {
          // Mark all unread notifications as read
          await db
            .update(notificationDeliveries)
            .set({
              status: "read",
              readAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(notificationDeliveries.userId, userId),
                or(eq(notificationDeliveries.status, "pending"), eq(notificationDeliveries.status, "delivered"))!
              )
            );

          // Get count
          const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notificationDeliveries)
            .where(
              and(
                eq(notificationDeliveries.userId, userId),
                eq(notificationDeliveries.status, "read"),
                // @ts-ignore - readAt comparison
                eq(notificationDeliveries.readAt, now)
              )
            );

          updatedCount = countResult[0]?.count || 0;
          logger.info("All notifications marked as read", { userId });
        } else if (deliveryIds && deliveryIds.length > 0) {
          // Mark specific delivery IDs as read
          for (const deliveryId of deliveryIds) {
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
        } else if (notificationId) {
          // Mark all deliveries for a specific notification as read
          await db
            .update(notificationDeliveries)
            .set({
              status: "read",
              readAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(notificationDeliveries.notificationId, notificationId),
                eq(notificationDeliveries.userId, userId),
                or(eq(notificationDeliveries.status, "pending"), eq(notificationDeliveries.status, "delivered"))!
              )
            );

          const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notificationDeliveries)
            .where(
              and(
                eq(notificationDeliveries.notificationId, notificationId),
                eq(notificationDeliveries.userId, userId),
                eq(notificationDeliveries.status, "read")
              )
            );

          updatedCount = countResult[0]?.count || 0;
          logger.info("Notification marked as read", { userId, notificationId });
        } else {
          return badRequestResponse("Must provide deliveryIds, notificationId, or markAll");
        }

        return successResponse({
          message: `${updatedCount} notification(s) marked as read`,
          updatedCount,
          readAt: now,
        });
      },
      allowedRoles: ["admin", "school-admin", "teacher", "student", "parent", "counselor"] as any[],
    },

    // Get unread count
    "unread-count": {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { notificationDeliveries } = await import("@/lib/db/schema");
        const { eq, and, or, sql } = await import("drizzle-orm");
        const { successResponse } = await import("@/lib/api/response-helpers");

        const { userId } = auth;

        // Get total unread count
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationDeliveries)
          .where(
            and(
              eq(notificationDeliveries.userId, userId),
              or(eq(notificationDeliveries.status, "pending"), eq(notificationDeliveries.status, "delivered"))
            )
          );

        const unreadCount = result[0]?.count || 0;

        return successResponse({
          unreadCount,
          urgentCount: 0, // Simplified for now
        });
      },
      allowedRoles: ["admin", "school-admin", "teacher", "student", "parent", "counselor"] as any[],
    },
  },

  customHandlers: {
    list: async (params: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { notificationDeliveries } = await import("@/lib/db/schema");
      const { eq, desc } = await import("drizzle-orm");
      const { successResponse } = await import("@/lib/api/response-helpers");

      const { page = 1, limit = 20 } = params;
      const offset = (page - 1) * limit;

      // Admin can see all notifications, regular users only see theirs
      const whereCondition = auth.user.type === "admin"
        ? undefined
        : eq(notificationDeliveries.userId, auth.userId);

      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(notificationDeliveries)
          .where(whereCondition)
          .orderBy(desc(notificationDeliveries.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationDeliveries)
          .where(whereCondition)
      ]);

      const { sql } = await import("drizzle-orm");

      return successResponse({
        data: dataResult,
        pagination: {
          total: countResult[0]?.count || 0,
          page,
          limit,
          totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
        },
      });
    },

    get: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { notificationDeliveries } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const whereCondition = auth.user.type === "admin"
        ? eq(notificationDeliveries.id, id)
        : and(eq(notificationDeliveries.id, id), eq(notificationDeliveries.userId, auth.userId));

      const result = await db
        .select()
        .from(notificationDeliveries)
        .where(whereCondition!)
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse("Notification");
      }

      return successResponse({ data: result[0] });
    },

    create: async (data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { notificationDeliveries } = await import("@/lib/db/schema");
      const { createdResponse } = await import("@/lib/api/response-helpers");
      const { nanoid } = await import("nanoid");

      const deliveryId = `notif-${nanoid()}`;

      const result = await db
        .insert(notificationDeliveries)
        .values({
          id: deliveryId,
          userId: data.userId,
          notificationId: data.notificationId,
          status: "pending",
          type: data.type || "info",
          title: data.title,
          message: data.message,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ data: result[0] });
    },

    update: async (id: string, data: any, auth: any) => {
      const { db } = await import("@/lib/db");
      const { notificationDeliveries } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const { updatedResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const whereCondition = auth.user.type === "admin"
        ? eq(notificationDeliveries.id, id)
        : and(eq(notificationDeliveries.id, id), eq(notificationDeliveries.userId, auth.userId));

      const result = await db
        .update(notificationDeliveries)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(whereCondition!)
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Notification");
      }

      return updatedResponse({ data: result[0] });
    },

    delete: async (id: string, auth: any) => {
      const { db } = await import("@/lib/db");
      const { notificationDeliveries } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const { successResponse, notFoundResponse } = await import("@/lib/api/response-helpers");

      const whereCondition = auth.user.type === "admin"
        ? eq(notificationDeliveries.id, id)
        : and(eq(notificationDeliveries.id, id), eq(notificationDeliveries.userId, auth.userId));

      const result = await db
        .delete(notificationDeliveries)
        .where(whereCondition!)
        .returning();

      if (result.length === 0) {
        return notFoundResponse("Notification");
      }

      return successResponse({ message: "Notification deleted successfully" });
    },
  },
});
