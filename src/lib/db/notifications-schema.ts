/**
 * Notifications & Notification Deliveries Schema
 *
 * This schema handles platform-wide notifications sent by admins to users.
 * It supports:
 * - Different notification types (announcement, alert, reminder)
 * - Target audience filtering (all, students, teachers, parents, etc.)
 * - Priority levels (low, normal, high, urgent)
 * - Scheduling notifications for future delivery
 * - Tracking delivery and read status per user
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum, index } from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const notificationTypeEnum = pgEnum("notification_type", [
  "announcement",  // General announcements
  "alert",         // Urgent alerts
  "reminder",      // Reminders for deadlines/events
  "system",        // System notifications
  "welcome",       // Welcome messages
  "homework",      // Homework-related notifications
  "grade",         // Grade-related notifications
  "attendance",    // Attendance-related notifications
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "draft",      // Not yet sent
  "scheduled",  // Scheduled for future delivery
  "sending",    // Currently being sent
  "sent",       // Successfully sent to all recipients
  "failed",     // Failed to send
  "cancelled",  // Cancelled before sending
]);

export const targetAudienceEnum = pgEnum("target_audience", [
  "all",         // All users
  "students",    // All students
  "teachers",    // All teachers
  "parents",     // All parents
  "counselors",  // All counselors
  "school_admins", // All school admins
  "admins",      // Platform admins
  "specific",    // Specific users (defined in targetUserIds)
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",     // Not yet delivered
  "delivered",   // Delivered to user
  "read",        // Read by user
  "failed",      // Failed to deliver
]);

// ============================================================================
// NOTIFICATIONS TABLE
// ============================================================================

/**
 * Notifications - Main notification records created by admins
 */
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),

  // Content
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull().default("announcement"),
  category: text("category"), // Optional category for grouping

  // Targeting
  targetAudience: targetAudienceEnum("target_audience").notNull().default("all"),
  targetUserIds: text("target_user_ids"), // JSON array of specific user IDs (when audience is "specific")
  targetSchoolIds: text("target_school_ids"), // JSON array of school IDs to target

  // Priority & Status
  priority: notificationPriorityEnum("priority").notNull().default("normal"),
  status: notificationStatusEnum("status").notNull().default("draft"),

  // Sender
  senderId: text("sender_id"), // User ID who created the notification
  senderName: text("sender_name"), // Cached sender name for display
  senderRole: text("sender_role"), // Sender's role

  // Scheduling
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }), // When to send
  sentAt: timestamp("sent_at", { withTimezone: true }), // When it was actually sent

  // Additional data
  actionUrl: text("action_url"), // Optional link to open when clicked
  actionLabel: text("action_label"), // Label for the action button
  data: text("data"), // JSON string for additional data
  attachments: text("attachments"), // JSON array of attachment URLs

  // Expiry
  expiresAt: timestamp("expires_at", { withTimezone: true }), // When notification expires

  // Delivery statistics (denormalized for performance)
  totalRecipients: integer("total_recipients").default(0),
  deliveredCount: integer("delivered_count").default(0),
  readCount: integer("read_count").default(0),
  failedCount: integer("failed_count").default(0),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("notifications_status_idx").on(table.status),
  scheduledForIdx: index("notifications_scheduled_for_idx").on(table.scheduledFor),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

// ============================================================================
// NOTIFICATION DELIVERIES TABLE
// ============================================================================

/**
 * Notification Deliveries - Track delivery and read status per user
 */
export const notificationDeliveries = pgTable("notification_deliveries", {
  id: text("id").primaryKey(),

  // References
  notificationId: text("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),

  // Delivery tracking
  status: deliveryStatusEnum("status").notNull().default("pending"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }), // When it was delivered
  readAt: timestamp("read_at", { withTimezone: true }), // When user read it

  // Delivery method
  deliveryMethod: text("delivery_method"), // "in_app", "email", "sms", "push"

  // Error tracking
  errorMessage: text("error_message"), // If delivery failed
  retryCount: integer("retry_count").default(0),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  notificationIdIdx: index("notification_deliveries_notification_id_idx").on(table.notificationId),
  userIdIdx: index("notification_deliveries_user_id_idx").on(table.userId),
  statusIdx: index("notification_deliveries_status_idx").on(table.status),
  readAtIdx: index("notification_deliveries_read_at_idx").on(table.readAt),
  // Composite index for user's notifications
  userStatusIdx: index("notification_deliveries_user_status_idx").on(table.userId, table.status),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NewNotificationDelivery = typeof notificationDeliveries.$inferInsert;

// ============================================================================
// NOTIFICATION PREFERENCES (per user)
// ============================================================================

/**
 * User Notification Settings - Per-user notification preferences
 */
export const userNotificationSettings = pgTable("user_notification_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),

  // Email notifications
  emailEnabled: boolean("email_enabled").default(true),
  emailAnnouncements: boolean("email_announcements").default(true),
  emailAlerts: boolean("email_alerts").default(true),
  emailReminders: boolean("email_reminders").default(true),

  // In-app notifications
  inAppEnabled: boolean("in_app_enabled").default(true),
  inAppAnnouncements: boolean("in_app_announcements").default(true),
  inAppAlerts: boolean("in_app_alerts").default(true),
  inAppReminders: boolean("in_app_reminders").default(true),

  // Quiet hours
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserNotificationSettings = typeof userNotificationSettings.$inferSelect;
export type NewUserNotificationSettings = typeof userNotificationSettings.$inferInsert;
