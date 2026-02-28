/**
 * SEND NOTIFICATION HELPER
 *
 * Simplified API for sending notifications to users.
 * Supports:
 * - Direct user notifications
 * - Bulk notifications by role
 * - School-wide notifications
 * - Email fallback
 *
 * @example
 * ```typescript
 * import { sendNotification } from "@/lib/notifications/send";
 *
 * // Send to a specific user
 * await sendNotification({
 *   userId: "user-123",
 *   title: "Homework Due",
 *   message: "Your math homework is due tomorrow.",
 *   type: "homework",
 * });
 *
 * // Send to all students
 * await sendNotification({
 *   targetAudience: "students",
 *   schoolId: "school-456",
 *   title: "School Closure",
 *   message: "School will be closed tomorrow due to weather.",
 *   type: "alert",
 *   priority: "urgent",
 * });
 * ```
 */

import { db } from "@/lib/db";
import { users, notifications, notificationDeliveries, userNotificationSettings } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface SendNotificationOptions {
  // User targeting
  userId?: string;
  userIds?: string[];
  targetAudience?: "all" | "students" | "teachers" | "parents" | "counselors" | "school_admins" | "admins";
  schoolId?: string;
  schoolIds?: string[];

  // Content
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  category?: string;

  // Actions
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;

  // Sender
  senderId?: string;
  senderName?: string;
  senderRole?: string;

  // Scheduling
  scheduledFor?: Date;
  expiresAt?: Date;

  // Email fallback
  sendEmail?: boolean;
  emailSubject?: string;
}

export type NotificationType =
  | "announcement"
  | "alert"
  | "reminder"
  | "system"
  | "welcome"
  | "homework"
  | "grade"
  | "attendance";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface SendNotificationResult {
  success: boolean;
  notificationId?: string;
  recipientCount: number;
  error?: string;
}

// ============================================================================
// NOTIFICATION TYPES FOR SPECIFIC EVENTS
// ============================================================================

/**
 * Send homework due notification to student
 */
export async function notifyHomeworkDue(options: {
  studentId: string;
  homeworkTitle: string;
  subject: string;
  dueDate: Date;
  actionUrl?: string;
}): Promise<SendNotificationResult> {
  const dueDateStr = options.dueDate.toLocaleDateString();
  const isUrgent = options.dueDate.getTime() - Date.now() < 86400000; // Due within 24 hours

  return sendNotification({
    userId: options.studentId,
    title: "Homework Due Soon",
    message: `${options.homeworkTitle} for ${options.subject} is due on ${dueDateStr}.`,
    type: "homework",
    priority: isUrgent ? "urgent" : "normal",
    actionUrl: options.actionUrl,
    category: "homework",
  });
}

/**
 * Send assessment posted notification
 */
export async function notifyAssessmentPosted(options: {
  studentIds: string[];
  assessmentTitle: string;
  subject: string;
  dueDate: Date;
  actionUrl?: string;
}): Promise<SendNotificationResult> {
  const dueDateStr = options.dueDate.toLocaleDateString();

  return sendNotification({
    userIds: options.studentIds,
    title: "New Assessment Posted",
    message: `${options.assessmentTitle} for ${options.subject} is due on ${dueDateStr}.`,
    type: "announcement",
    priority: "high",
    actionUrl: options.actionUrl,
    category: "assessment",
  });
}

/**
 * Send attendance marked notification to parent
 */
export async function notifyAttendanceMarked(options: {
  parentId: string;
  studentName: string;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  actionUrl?: string;
}): Promise<SendNotificationResult> {
  const statusText = options.status.charAt(0).toUpperCase() + options.status.slice(1);
  const isAbsent = options.status === "absent";

  return sendNotification({
    userId: options.parentId,
    title: isAbsent ? "Attendance Alert" : "Attendance Recorded",
    message: `${options.studentName} was marked ${statusText} on ${options.date.toLocaleDateString()}.`,
    type: "attendance",
    priority: isAbsent ? "high" : "low",
    actionUrl: options.actionUrl,
    category: "attendance",
  });
}

/**
 * Send grade posted notification
 */
export async function notifyGradePosted(options: {
  studentId: string;
  assessmentTitle: string;
  grade: string;
  actionUrl?: string;
}): Promise<SendNotificationResult> {
  return sendNotification({
    userId: options.studentId,
    title: "Grade Posted",
    message: `Your grade for ${options.assessmentTitle} is now available.`,
    type: "grade",
    priority: "normal",
    actionUrl: options.actionUrl,
    category: "grade",
  });
}

/**
 * Send fee reminder notification to parent
 */
export async function notifyFeeReminder(options: {
  parentId: string;
  studentName: string;
  amount: number;
  dueDate: Date;
  actionUrl?: string;
}): Promise<SendNotificationResult> {
  const amountStr = `Nu. ${options.amount.toLocaleString()}`;
  const dueDateStr = options.dueDate.toLocaleDateString();
  const isUrgent = options.dueDate.getTime() - Date.now() < 604800000; // Due within 7 days

  return sendNotification({
    userId: options.parentId,
    title: "Fee Payment Reminder",
    message: `Fee payment of ${amountStr} for ${options.studentName} is due on ${dueDateStr}.`,
    type: "reminder",
    priority: isUrgent ? "urgent" : "high",
    actionUrl: options.actionUrl,
    category: "fees",
    sendEmail: isUrgent, // Send email for urgent fee reminders
  });
}

/**
 * Send message received notification
 */
export async function notifyMessageReceived(options: {
  recipientId: string;
  senderName: string;
  messagePreview: string;
  actionUrl?: string;
}): Promise<SendNotificationResult> {
  return sendNotification({
    userId: options.recipientId,
    title: `New message from ${options.senderName}`,
    message: options.messagePreview.substring(0, 100),
    type: "announcement",
    priority: "normal",
    actionUrl: options.actionUrl,
    category: "message",
  });
}

// ============================================================================
// CORE SEND FUNCTION
// ============================================================================

/**
 * Send a notification to targeted users
 *
 * Creates a notification record and delivery records for all recipients.
 * Optionally sends email fallback for urgent notifications.
 */
export async function sendNotification(
  options: SendNotificationOptions
): Promise<SendNotificationResult> {
  try {
    const {
      userId,
      userIds,
      targetAudience,
      schoolId,
      schoolIds,
      title,
      message,
      type = "announcement",
      priority = "normal",
      category,
      actionUrl,
      actionLabel,
      data,
      senderId = "system",
      senderName = "System",
      senderRole = "system",
      scheduledFor,
      expiresAt,
      sendEmail = false,
      emailSubject,
    } = options;

    // Validate input
    if (!title || !message) {
      return {
        success: false,
        recipientCount: 0,
        error: "Title and message are required",
      };
    }

    // Determine recipient IDs
    let recipientIds: string[] = [];

    if (userId) {
      recipientIds = [userId];
    } else if (userIds && userIds.length > 0) {
      recipientIds = userIds;
    } else if (targetAudience) {
      // Build query for target audience
      const conditions = [];

      if (targetAudience !== "all") {
        conditions.push(eq(users.type, targetAudience === "school_admins" ? "school-admin" : targetAudience));
      }

      if (schoolId) {
        conditions.push(eq(users.schoolId, schoolId));
      } else if (schoolIds && schoolIds.length > 0) {
        conditions.push(inArray(users.schoolId, schoolIds));
      }

      // Only active users
      conditions.push(eq(users.isActive, true));

      const targetUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(and(...conditions));

      recipientIds = targetUsers.map((u) => u.id);
    }

    if (recipientIds.length === 0) {
      return {
        success: false,
        recipientCount: 0,
        error: "No recipients found",
      };
    }

    // Create notification record
    const notificationId = `notif_${nanoid()}`;
    const isScheduled = scheduledFor && scheduledFor > new Date();

    await db.insert(notifications).values({
      id: notificationId,
      title,
      message,
      type,
      priority,
      category,
      targetAudience: targetAudience || "specific",
      targetUserIds: JSON.stringify(recipientIds),
      targetSchoolIds: schoolIds ? JSON.stringify(schoolIds) : schoolId ? JSON.stringify([schoolId]) : null,
      senderId,
      senderName,
      senderRole,
      actionUrl,
      actionLabel,
      data: data ? JSON.stringify(data) : null,
      scheduledFor: isScheduled ? scheduledFor : null,
      sentAt: isScheduled ? null : new Date(),
      expiresAt,
      status: isScheduled ? "scheduled" : "sent",
      totalRecipients: recipientIds.length,
      deliveredCount: isScheduled ? 0 : recipientIds.length,
      readCount: 0,
      failedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create delivery records (only if not scheduled for future)
    if (!isScheduled) {
      const deliveryRecords = recipientIds.map((userId) => ({
        id: `del_${nanoid()}`,
        notificationId,
        userId,
        status: "delivered" as const,
        deliveredAt: new Date(),
        deliveryMethod: "in_app" as const,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(notificationDeliveries).values(deliveryRecords);

      logger.info("Notification sent", {
        notificationId,
        recipientCount: recipientIds.length,
        type,
        priority,
      });

      // Email fallback for urgent notifications
      if (sendEmail || priority === "urgent") {
        // TODO: Integrate email service
        logger.info("Email fallback for notification", { notificationId });
      }
    } else {
      logger.info("Notification scheduled", {
        notificationId,
        scheduledFor,
        recipientCount: recipientIds.length,
      });
    }

    return {
      success: true,
      notificationId,
      recipientCount: recipientIds.length,
    };
  } catch (error) {
    logger.error(error, { options });
    return {
      success: false,
      recipientCount: 0,
      error: error instanceof Error ? error.message : "Failed to send notification",
    };
  }
}

// ============================================================================
// BATCH NOTIFICATIONS
// ============================================================================

/**
 * Send bulk notifications to multiple users with individualized messages
 */
export async function sendBulkNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    actionUrl?: string;
  }>
): Promise<SendNotificationResult[]> {
  const results = await Promise.all(
    notifications.map((n) => sendNotification(n))
  );

  const successCount = results.filter((r) => r.success).length;
  logger.info("Bulk notifications sent", {
    total: notifications.length,
    success: successCount,
    failed: notifications.length - successCount,
  });

  return results;
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Check if user has opted out of specific notification type
 */
export async function shouldSendNotification(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    const userSettings = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!userSettings) {
      return true; // Default to sending if no settings
    }

    // Check in-app enabled
    if (!userSettings.inAppEnabled) {
      return false;
    }

    // Check type-specific settings
    switch (type) {
      case "announcement":
        return userSettings.inAppAnnouncements ?? true;
      case "alert":
        return userSettings.inAppAlerts ?? true;
      case "reminder":
        return userSettings.inAppReminders ?? true;
      default:
        return true;
    }
  } catch (error) {
    logger.error(error, { userId, type });
    return true; // Default to sending on error
  }
}
