/**
 * Push Notification Schema
 *
 * This schema handles Web Push API notifications for real-time updates.
 * It supports:
 * - Push subscription management per user/device
 * - VAPID key management for push authentication
 * - Push notification queue and tracking
 * - Per-user push notification preferences
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum, index, json } from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const pushNotificationTypeEnum = pgEnum("push_notification_type", [
  "homework",      // Homework assignments
  "announcement",  // School announcements
  "grade",         // Grade posted
  "attendance",    // Attendance marked
  "reminder",      // Reminder notifications
  "alert",         // Urgent alerts
  "message",       // New messages
  "fee",           // Fee payment reminders
  "timetable",     // Timetable changes
  "exam",          // Exam notifications
]);

export const pushNotificationStatusEnum = pgEnum("push_notification_status", [
  "pending",       // Queued, waiting to be sent
  "sent",          // Successfully sent to push service
  "delivered",     // Confirmed delivered to device
  "failed",        // Failed to send
]);

// ============================================================================
// PUSH SUBSCRIPTIONS TABLE
// ============================================================================

/**
 * Push Subscriptions - Store user's push subscription endpoints
 * Each user can have multiple subscriptions (different devices/browsers)
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Push subscription details from PushSubscription object
  endpoint: text("endpoint").notNull().unique(),

  // VAPID keys for authentication
  keys: json("keys").$type<{
    p256dh: string;
    auth: string;
  }>().notNull(),

  // Device/user agent info for debugging
  userAgent: text("user_agent"),
  deviceType: text("device_type"), // "desktop", "mobile", "tablet"

  // Subscription status
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}, (table) => ({
  userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
  endpointIdx: index("push_subscriptions_endpoint_idx").on(table.endpoint),
  isActiveIdx: index("push_subscriptions_is_active_idx").on(table.isActive),
  // Composite index for active subscriptions per user
  userActiveIdx: index("push_subscriptions_user_active_idx").on(table.userId, table.isActive),
}));

// ============================================================================
// PUSH NOTIFICATIONS TABLE
// ============================================================================

/**
 * Push Notifications - Queue and track push notifications sent to users
 */
export const pushNotifications = pgTable("push_notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Notification content
  type: pushNotificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),

  // Optional icon and badge
  icon: text("icon"), // URL to notification icon
  badge: text("badge"), // URL to notification badge

  // Action data
  data: json("data").$type<{
    url?: string;
    actionId?: string;
    [key: string]: unknown;
  }>(),

  // Notification behavior
  requireInteraction: boolean("require_interaction").default(false),
  vibrate: json("vibrate").$type<number[]>(), // Vibration pattern

  // Tag for grouping/replacing
  tag: text("tag"), // Tag to group notifications

  // Delivery status
  status: pushNotificationStatusEnum("status").notNull().default("pending"),

  // Error tracking
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),

  // Timestamps
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }), // For scheduled notifications
  sentAt: timestamp("sent_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("push_notifications_user_id_idx").on(table.userId),
  statusIdx: index("push_notifications_status_idx").on(table.status),
  scheduledForIdx: index("push_notifications_scheduled_for_idx").on(table.scheduledFor),
  createdAtIdx: index("push_notifications_created_at_idx").on(table.createdAt),
  // Composite index for user's pending notifications
  userPendingIdx: index("push_notifications_user_pending_idx").on(table.userId, table.status),
}));

// ============================================================================
// PUSH NOTIFICATION SETTINGS TABLE
// ============================================================================

/**
 * Push Notification Settings - Per-user push notification preferences
 */
export const pushNotificationSettings = pgTable("push_notification_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),

  // Master switch
  enabled: boolean("enabled").default(true),

  // Per-type preferences
  homeworkEnabled: boolean("homework_enabled").default(true),
  announcementEnabled: boolean("announcement_enabled").default(true),
  gradeEnabled: boolean("grade_enabled").default(true),
  attendanceEnabled: boolean("attendance_enabled").default(true),
  reminderEnabled: boolean("reminder_enabled").default(true),
  alertEnabled: boolean("alert_enabled").default(true), // Always enabled
  messageEnabled: boolean("message_enabled").default(true),
  feeEnabled: boolean("fee_enabled").default(true),
  timetableEnabled: boolean("timetable_enabled").default(true),
  examEnabled: boolean("exam_enabled").default(true),

  // Quiet hours (no push notifications during these times)
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),

  // Device preferences
  quietHoursOnlyOnMobile: boolean("quiet_hours_only_on_mobile").default(true),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("push_notification_settings_user_id_idx").on(table.userId),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

export type PushNotification = typeof pushNotifications.$inferSelect;
export type NewPushNotification = typeof pushNotifications.$inferInsert;

export type PushNotificationSettings = typeof pushNotificationSettings.$inferSelect;
export type NewPushNotificationSettings = typeof pushNotificationSettings.$inferInsert;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationInput {
  userId: string;
  type: typeof pushNotificationTypeEnum.enumValues[number];
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

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}
