/**
 * NOTIFICATION SERVICE
 *
 * Service layer for creating and managing notifications.
 * Handles student, parent, and ministry notifications.
 *
 * @module services/notification
 */

import { db } from "@/lib/db";
import {
  notifications,
  notificationDeliveries,
  users,
  userNotificationSettings,
  verificationRequests,
} from "@/lib/db/schema";
import { eq, and, desc, count, sql, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type {
  Notification,
  NewNotification,
  NotificationDelivery,
  NewNotificationDelivery,
} from "@/lib/db/schema";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: "announcement" | "alert" | "reminder" | "system" | "welcome" | "homework" | "grade" | "attendance";
  priority?: "low" | "normal" | "high" | "urgent";
  targetAudience?: "all" | "students" | "teachers" | "parents" | "counselors" | "school_admins" | "admins" | "specific";
  targetUserIds?: string[];
  targetSchoolIds?: string[];
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
  attachments?: Array<{ url: string; name: string; type: string }>;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface NotifyStudentInput {
  studentId: string;
  type: "homework" | "grade" | "attendance" | "announcement" | "alert" | "reminder";
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export interface NotifyParentInput {
  parentId: string;
  childId: string;
  type: "homework" | "grade" | "attendance" | "fee" | "behavior" | "announcement";
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export interface NotificationWithDelivery {
  id: string;
  title: string;
  message: string;
  type: "announcement" | "alert" | "reminder" | "system" | "welcome" | "homework" | "grade" | "attendance";
  priority: "low" | "normal" | "high" | "urgent";
  actionUrl: string | null;
  actionLabel: string | null;
  data: string | null;
  createdAt: Date;
  readAt: Date | null;
  deliveredAt: Date | null;
}

// ============================================================================
// NOTIFICATION CREATION
// ============================================================================

/**
 * Create a notification in the database
 *
 * @param data - Notification data
 * @returns Created notification
 */
export async function createNotification(
  data: CreateNotificationInput
): Promise<Notification> {
  try {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const notificationData: NewNotification = {
      id: notificationId,
      title: data.title,
      message: data.message,
      type: data.type || "announcement",
      priority: data.priority || "normal",
      targetAudience: data.targetAudience || "all",
      targetUserIds: data.targetUserIds ? JSON.stringify(data.targetUserIds) : null,
      targetSchoolIds: data.targetSchoolIds ? JSON.stringify(data.targetSchoolIds) : null,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      data: data.data ? JSON.stringify(data.data) : null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      scheduledFor: data.scheduledFor,
      expiresAt: data.expiresAt,
      status: data.scheduledFor && data.scheduledFor > new Date() ? "scheduled" : "sent",
      sentAt: data.scheduledFor && data.scheduledFor > new Date() ? null : new Date(),
      totalRecipients: 0,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [created] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();

    logger.info("Notification created", {
      notificationId,
      type: data.type,
      targetAudience: data.targetAudience,
    });

    return created;
  } catch (error) {
    logger.error(error, { data });
    throw new Error("Failed to create notification");
  }
}

/**
 * Notify admins of ministry verification requests
 *
 * @param submissionId - The verification request ID
 * @param schoolName - Name of the school requesting verification
 * @returns Created notification
 */
export async function notifyMinistryVerification(
  submissionId: string,
  schoolName: string
): Promise<Notification> {
  try {
    // Get all admin users to notify
    const adminUsers = await db.query.users.findMany({
      where: eq(users.type, "admin"),
      columns: { id: true },
    });

    const targetUserIds = adminUsers.map((u) => u.id);

    const notification = await createNotification({
      title: "New School Verification Request",
      message: `${schoolName} has submitted a verification request. Please review and approve.`,
      type: "alert",
      priority: "high",
      targetAudience: "specific",
      targetUserIds,
      senderId: "system",
      senderName: "System",
      senderRole: "system",
      actionUrl: `/ministry/verifications?submission=${submissionId}`,
      actionLabel: "Review Request",
      data: { submissionId, schoolName },
    });

    // Create deliveries for all admins
    for (const admin of adminUsers) {
      await createNotificationDelivery({
        notificationId: notification.id,
        userId: admin.id,
        deliveryMethod: "in_app",
      });
    }

    logger.info("Ministry verification notification sent", {
      notificationId: notification.id,
      submissionId,
      adminCount: targetUserIds.length,
    });

    return notification;
  } catch (error) {
    logger.error(error, { submissionId, schoolName });
    throw new Error("Failed to notify ministry of verification");
  }
}

/**
 * Send notification to a student
 *
 * @param input - Student notification data
 * @returns Created notification delivery
 */
export async function notifyStudent(
  input: NotifyStudentInput
): Promise<NotificationDelivery> {
  try {
    // Create the notification
    const notification = await createNotification({
      title: input.title,
      message: input.message,
      type: input.type,
      targetAudience: "specific",
      targetUserIds: [input.studentId],
      actionUrl: input.actionUrl,
      data: input.data,
    });

    // Create delivery for the student
    const delivery = await createNotificationDelivery({
      notificationId: notification.id,
      userId: input.studentId,
      deliveryMethod: "in_app",
    });

    logger.info("Student notification sent", {
      notificationId: notification.id,
      studentId: input.studentId,
      type: input.type,
    });

    return delivery;
  } catch (error) {
    logger.error(error, { input });
    throw new Error("Failed to notify student");
  }
}

/**
 * Send notification to a parent about their child
 *
 * @param input - Parent notification data
 * @returns Created notification delivery
 */
export async function notifyParent(
  input: NotifyParentInput
): Promise<NotificationDelivery> {
  try {
    // Create the notification
    const notification = await createNotification({
      title: input.title,
      message: input.message,
      type: input.type === "fee" ? "reminder" : "announcement",
      targetAudience: "specific",
      targetUserIds: [input.parentId],
      actionUrl: input.actionUrl,
      data: { ...input.data, childId: input.childId },
    });

    // Create delivery for the parent
    const delivery = await createNotificationDelivery({
      notificationId: notification.id,
      userId: input.parentId,
      deliveryMethod: "in_app",
    });

    logger.info("Parent notification sent", {
      notificationId: notification.id,
      parentId: input.parentId,
      childId: input.childId,
      type: input.type,
    });

    return delivery;
  } catch (error) {
    logger.error(error, { input });
    throw new Error("Failed to notify parent");
  }
}

/**
 * Create notification delivery record
 *
 * @param input - Delivery data
 * @returns Created delivery
 */
export async function createNotificationDelivery(input: {
  notificationId: string;
  userId: string;
  deliveryMethod?: "in_app" | "email" | "sms" | "push";
}): Promise<NotificationDelivery> {
  try {
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const deliveryData: NewNotificationDelivery = {
      id: deliveryId,
      notificationId: input.notificationId,
      userId: input.userId,
      status: "delivered",
      deliveredAt: new Date(),
      deliveryMethod: input.deliveryMethod || "in_app",
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [created] = await db
      .insert(notificationDeliveries)
      .values(deliveryData)
      .returning();

    // Update notification delivery count
    await db
      .update(notifications)
      .set({
        deliveredCount: sql`${notifications.deliveredCount} + 1`,
        totalRecipients: sql`${notifications.totalRecipients} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, input.notificationId));

    return created;
  } catch (error) {
    logger.error(error, { input });
    throw new Error("Failed to create notification delivery");
  }
}

// ============================================================================
// NOTIFICATION RETRIEVAL
// ============================================================================

/**
 * Get notifications for a user
 *
 * @param userId - The database user ID
 * @param options - Query options
 * @returns Array of notifications with delivery status
 */
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<NotificationWithDelivery[]> {
  try {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;

    const deliveries = await db.query.notificationDeliveries.findMany({
      where: and(
        eq(notificationDeliveries.userId, userId),
        unreadOnly ? sql`${notificationDeliveries.readAt} IS NULL` : undefined
      ),
      orderBy: [desc(notificationDeliveries.createdAt)],
      limit,
      offset,
    });

    const notificationIds = deliveries.map((d) => d.notificationId);

    if (notificationIds.length === 0) {
      return [];
    }

    const notificationRecords = await db.query.notifications.findMany({
      where: inArray(notifications.id, notificationIds),
    });

    const notificationMap = new Map(
      notificationRecords.map((n) => [n.id, n])
    );

    return deliveries.map((d) => {
      const notif = notificationMap.get(d.notificationId);
      if (!notif) return null;

      return {
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        priority: notif.priority,
        actionUrl: notif.actionUrl,
        actionLabel: notif.actionLabel,
        data: notif.data,
        createdAt: notif.createdAt,
        readAt: d.readAt,
        deliveredAt: d.deliveredAt,
      };
    }).filter((n): n is NotificationWithDelivery => n !== null);
  } catch (error) {
    logger.error(error, { userId, options });
    throw new Error("Failed to fetch user notifications");
  }
}

/**
 * Get unread notification count for a user
 *
 * @param userId - The database user ID
 * @returns Number of unread notifications
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          sql`${notificationDeliveries.readAt} IS NULL`
        )
      );

    return result?.count || 0;
  } catch (error) {
    logger.error(error, { userId });
    return 0;
  }
}

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================

/**
 * Mark a notification as read
 *
 * @param notificationId - The notification ID
 * @param userId - The user ID
 * @returns Updated delivery record
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<NotificationDelivery | null> {
  try {
    const delivery = await db.query.notificationDeliveries.findFirst({
      where: and(
        eq(notificationDeliveries.notificationId, notificationId),
        eq(notificationDeliveries.userId, userId)
      ),
    });

    if (!delivery) {
      return null;
    }

    if (delivery.readAt) {
      return delivery; // Already read
    }

    const [updated] = await db
      .update(notificationDeliveries)
      .set({
        status: "read",
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, delivery.id))
      .returning();

    // Update notification read count
    await db
      .update(notifications)
      .set({
        readCount: sql`${notifications.readCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));

    logger.info("Notification marked as read", {
      notificationId,
      userId,
    });

    return updated;
  } catch (error) {
    logger.error(error, { notificationId, userId });
    throw new Error("Failed to mark notification as read");
  }
}

/**
 * Mark all notifications as read for a user
 *
 * @param userId - The user ID
 * @returns Number of notifications marked as read
 */
export async function markAllAsRead(userId: string): Promise<number> {
  try {
    const unreadDeliveries = await db.query.notificationDeliveries.findMany({
      where: and(
        eq(notificationDeliveries.userId, userId),
        sql`${notificationDeliveries.readAt} IS NULL`
      ),
    });

    if (unreadDeliveries.length === 0) {
      return 0;
    }

    const now = new Date();
    const notificationIds = unreadDeliveries.map((d) => d.notificationId);

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
          sql`${notificationDeliveries.readAt} IS NULL`
        )
      );

    // Update read counts for all affected notifications
    for (const notificationId of notificationIds) {
      await db
        .update(notifications)
        .set({
          readCount: sql`${notifications.readCount} + 1`,
          updatedAt: now,
        })
        .where(eq(notifications.id, notificationId));
    }

    logger.info("All notifications marked as read", {
      userId,
      count: unreadDeliveries.length,
    });

    return unreadDeliveries.length;
  } catch (error) {
    logger.error(error, { userId });
    throw new Error("Failed to mark all notifications as read");
  }
}

/**
 * Delete a notification delivery for a user
 *
 * @param notificationId - The notification ID
 * @param userId - The user ID
 * @returns Success status
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    const delivery = await db.query.notificationDeliveries.findFirst({
      where: and(
        eq(notificationDeliveries.notificationId, notificationId),
        eq(notificationDeliveries.userId, userId)
      ),
    });

    if (!delivery) {
      return false;
    }

    await db
      .delete(notificationDeliveries)
      .where(eq(notificationDeliveries.id, delivery.id));

    logger.info("Notification deleted", {
      notificationId,
      userId,
    });

    return true;
  } catch (error) {
    logger.error(error, { notificationId, userId });
    throw new Error("Failed to delete notification");
  }
}

/**
 * Get user notification settings
 *
 * @param userId - The user ID
 * @returns User notification settings
 */
export async function getUserNotificationSettings(userId: string) {
  try {
    const settings = await db.query.userNotificationSettings.findFirst({
      where: eq(userNotificationSettings.userId, userId),
    });

    if (!settings) {
      // Create default settings
      const [newSettings] = await db
        .insert(userNotificationSettings)
        .values({
          id: `uns_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId,
          emailEnabled: true,
          emailAnnouncements: true,
          emailAlerts: true,
          emailReminders: true,
          inAppEnabled: true,
          inAppAnnouncements: true,
          inAppAlerts: true,
          inAppReminders: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newSettings;
    }

    return settings;
  } catch (error) {
    logger.error(error, { userId });
    throw new Error("Failed to get user notification settings");
  }
}

/**
 * Update user notification settings
 *
 * @param userId - The user ID
 * @param settings - Settings to update
 * @returns Updated settings
 */
export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<{
    emailEnabled: boolean;
    emailAnnouncements: boolean;
    emailAlerts: boolean;
    emailReminders: boolean;
    inAppEnabled: boolean;
    inAppAnnouncements: boolean;
    inAppAlerts: boolean;
    inAppReminders: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  }>
) {
  try {
    const existing = await getUserNotificationSettings(userId);

    const [updated] = await db
      .update(userNotificationSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(userNotificationSettings.id, existing.id))
      .returning();

    logger.info("User notification settings updated", { userId });

    return updated;
  } catch (error) {
    logger.error(error, { userId, settings });
    throw new Error("Failed to update user notification settings");
  }
}
