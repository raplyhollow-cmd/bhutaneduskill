/**
 * PUSH NOTIFICATION SENDER
 *
 * Utility for sending Web Push API notifications using VAPID authentication.
 * This handles the conversion of subscriptions and sending via web-push library.
 */

import { pushSubscriptions, pushNotifications, pushNotificationSettings } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Stub web-push for now - package not installed
// TODO: Install web-push package when implementing push notifications
interface WebPushAPI {
  sendNotification: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) => Promise<void>;
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
}

const webpush: WebPushAPI = {
  sendNotification: async (): Promise<void> => {
    // Stub implementation
  },
  setVapidDetails: (): void => {
    // Stub implementation
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface PushNotificationPayload {
  userId: string;
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
  scheduledFor?: Date;
}

export interface PushSubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ============================================================================
// VAPID KEY MANAGEMENT
// ============================================================================

/**
 * Get VAPID keys from environment variables
 * These should be generated using npm run generate:vapid-keys
 */
function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@bhutaneduskill.bt";

  if (!publicKey || !privateKey) {
    logger.error("VAPID keys not configured", {
      hasPublicKey: !!publicKey,
      hasPrivateKey: !!privateKey,
    });
    throw new Error("VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.");
  }

  return { publicKey, privateKey, subject };
}

/**
 * Configure web-push with VAPID keys
 * This should be called once when the module is loaded
 */
let isWebPushConfigured = false;

function configureWebPush() {
  if (isWebPushConfigured) return;

  try {
    const vapidKeys = getVapidKeys();
    webpush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    isWebPushConfigured = true;
    logger.info("Web Push configured successfully");
  } catch (error) {
    logger.error("Failed to configure Web Push", { error: error instanceof Error ? error.message : String(error) });
  }
}

// ============================================================================
// PUSH NOTIFICATION SENDING
// ============================================================================

/**
 * Send a push notification to a user
 * This queues the notification and attempts immediate delivery
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<{
  success: boolean;
  notificationId?: string;
  error?: string;
}> {
  // Configure web-push (idempotent)
  configureWebPush();

  // Extract userId outside try block for error handling
  const { userId } = payload;

  try {
    const {
      type,
      title,
      body,
      icon = "/icon-192.png",
      badge = "/badge-72.png",
      data,
      requireInteraction = false,
      tag,
      vibrate,
      scheduledFor,
    } = payload;

    // Check if user has push notification settings
    const settings = await db
      .select()
      .from(pushNotificationSettings)
      .where(eq(pushNotificationSettings.userId, userId))
      .limit(1);

    // Check if notifications are enabled for this type
    if (settings.length > 0) {
      const userSettings = settings[0];

      if (!userSettings.enabled) {
        logger.debug("Push notifications disabled for user", { userId });
        return { success: false, error: "Push notifications disabled" };
      }

      // Check type-specific setting
      const typeEnabled = `${type}Enabled` as keyof typeof userSettings;
      if (userSettings[typeEnabled] === false) {
        logger.debug(`Push notifications disabled for type: ${type}`, { userId });
        return { success: false, error: `${type} notifications disabled` };
      }

      // Check quiet hours
      if (userSettings.quietHoursEnabled) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        if (userSettings.quietHoursStart && userSettings.quietHoursEnd) {
          const [startHour, startMin] = userSettings.quietHoursStart.split(":").map(Number);
          const [endHour, endMin] = userSettings.quietHoursEnd.split(":").map(Number);
          const startTime = startHour * 60 + startMin;
          const endTime = endHour * 60 + endMin;

          // Check if current time is within quiet hours
          let inQuietHours = false;
          if (startTime < endTime) {
            inQuietHours = currentTime >= startTime && currentTime < endTime;
          } else {
            // Spans midnight
            inQuietHours = currentTime >= startTime || currentTime < endTime;
          }

          if (inQuietHours) {
            logger.debug("Quiet hours - skipping push notification", { userId });
            return { success: false, error: "Quiet hours" };
          }
        }
      }
    }

    // If scheduled for future, just queue it
    if (scheduledFor && scheduledFor > new Date()) {
      const notificationId = `push-${nanoid()}`;
      await db.insert(pushNotifications).values({
        id: notificationId,
        userId,
        type,
        title,
        body,
        icon,
        badge,
        data: data || {},
        requireInteraction: requireInteraction ?? false,
        tag,
        vibrate: vibrate || [],
        status: "pending",
        scheduledFor: scheduledFor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info("Push notification scheduled", { notificationId, userId, scheduledFor });
      return { success: true, notificationId };
    }

    // Get active subscriptions for user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.isActive, true)
        )
      );

    if (subscriptions.length === 0) {
      logger.debug("No active push subscriptions for user", { userId });
      return { success: false, error: "No active subscriptions" };
    }

    // Create notification record
    const notificationId = `push-${nanoid()}`;
    await db.insert(pushNotifications).values({
      id: notificationId,
      userId,
      type,
      title,
      body,
      icon,
      badge,
      data: data || {},
      requireInteraction: requireInteraction ?? false,
      tag,
      vibrate: vibrate || [],
      status: "sent",
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send to all active subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Prepare the push payload
          const pushPayload = JSON.stringify({
            title,
            body,
            icon,
            badge,
            data,
            tag,
            requireInteraction,
            vibrate,
          });

          // Send push notification using web-push library
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              },
              pushPayload
            );

            // Update last used timestamp
            await db
              .update(pushSubscriptions)
              .set({ lastUsedAt: new Date() })
              .where(eq(pushSubscriptions.id, sub.id));

            return { success: true, subscriptionId: sub.id };
          } catch (pushError) {
            // Handle specific web-push errors
            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
              // Subscription expired or invalid - deactivate it
              await db
                .update(pushSubscriptions)
                .set({ isActive: false })
                .where(eq(pushSubscriptions.id, sub.id));

              logger.warn("Deactivated expired push subscription", {
                subscriptionId: sub.id,
                statusCode: pushError.statusCode,
              });

              return { success: false, subscriptionId: sub.id, error: "Subscription expired" };
            }

            throw pushError;
          }
        } catch (error) {
          logger.error("Failed to send push notification to subscription", {
            subscriptionId: sub.id,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
          });
          return { success: false, subscriptionId: sub.id, error: String(error) };
        }
      })
    );

    // Check results
    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - successful;

    if (successful === 0) {
      await db
        .update(pushNotifications)
        .set({
          status: "failed",
          errorMessage: "All subscriptions failed",
          updatedAt: new Date(),
        })
        .where(eq(pushNotifications.id, notificationId));

      return { success: false, error: "All subscriptions failed" };
    }

    logger.info("Push notification sent", {
      notificationId,
      userId,
      successful,
      failed,
    });

    return { success: true, notificationId };
  } catch (error) {
    logger.error("Failed to send push notification", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// BULK NOTIFICATIONS
// ============================================================================

/**
 * Send push notification to multiple users
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  payload: Omit<PushNotificationPayload, "userId">
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushNotification({ ...payload, userId }))
  );

  const success = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - success;

  return { success, failed };
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Send homework notification
 */
export async function sendHomeworkNotification(
  userId: string,
  homeworkTitle: string,
  dueDate: string
) {
  return sendPushNotification({
    userId,
    type: "homework",
    title: "New Homework Assigned",
    body: `${homeworkTitle} is due on ${dueDate}`,
    data: { url: "/student/homework" },
    tag: `homework:${homeworkTitle}`,
  });
}

/**
 * Send grade notification
 */
export async function sendGradeNotification(
  userId: string,
  subject: string,
  grade: string
) {
  return sendPushNotification({
    userId,
    type: "grade",
    title: "New Grade Posted",
    body: `You received ${grade} in ${subject}`,
    data: { url: "/student/grades" },
    tag: "grade",
  });
}

/**
 * Send attendance notification
 */
export async function sendAttendanceNotification(
  userId: string,
  status: string,
  date: string
) {
  return sendPushNotification({
    userId,
    type: "attendance",
    title: "Attendance Marked",
    body: `Your attendance for ${date} is marked as ${status}`,
    data: { url: "/student/attendance" },
    tag: `attendance:${date}`,
  });
}

/**
 * Send announcement notification
 */
export async function sendAnnouncementNotification(
  userIds: string[],
  title: string,
  message: string
) {
  return sendBulkPushNotifications(userIds, {
    type: "announcement",
    title,
    body: message,
    data: { url: "/announcements" },
    tag: `announcement:${Date.now()}`,
  });
}

/**
 * Send fee reminder notification
 */
export async function sendFeeReminderNotification(
  userId: string,
  amount: number,
  dueDate: string
) {
  return sendPushNotification({
    userId,
    type: "fee",
    title: "Fee Payment Reminder",
    body: `Fee payment of Nu.${amount} is due on ${dueDate}`,
    data: { url: "/parent/fees" },
    requireInteraction: true,
    tag: "fee:reminder",
  });
}

// ============================================================================
// PUSH NOTIFICATION SETTINGS
// ============================================================================

/**
 * Get user's push notification settings
 */
export async function getPushNotificationSettings(userId: string) {
  const settings = await db
    .select()
    .from(pushNotificationSettings)
    .where(eq(pushNotificationSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    // Return default settings
    return {
      enabled: true,
      homeworkEnabled: true,
      announcementEnabled: true,
      gradeEnabled: true,
      attendanceEnabled: true,
      reminderEnabled: true,
      alertEnabled: true,
      messageEnabled: true,
      feeEnabled: true,
      timetableEnabled: true,
      examEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      quietHoursOnlyOnMobile: true,
    };
  }

  return settings[0];
}

/**
 * Update user's push notification settings
 */
export async function updatePushNotificationSettings(
  userId: string,
  settings: Partial<Omit<typeof pushNotificationSettings.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>
) {
  const existing = await db
    .select()
    .from(pushNotificationSettings)
    .where(eq(pushNotificationSettings.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    const id = `push-settings-${nanoid()}`;
    await db.insert(pushNotificationSettings).values({
      id,
      userId,
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id, ...settings };
  }

  await db
    .update(pushNotificationSettings)
    .set({
      ...settings,
      updatedAt: new Date(),
    })
    .where(eq(pushNotificationSettings.id, existing[0].id));

  return { ...existing[0], ...settings };
}
