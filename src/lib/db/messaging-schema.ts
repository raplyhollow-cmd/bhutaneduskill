/**
 * Messaging & Communication Database Schema Extension
 * Add these tables to your existing schema
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// MESSAGING & CONVERSATIONS
// ============================================================================

/**
 * Conversations - A conversation between two or more participants
 */
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"), // For school-scoped conversations

  // Participants
  type: text("type").notNull(), // "direct", "group", "announcement"
  participants: text("participants", { mode: "json" }).$type<string[]>(), // Array of user IDs

  // Group/announcement specific
  name: text("name"), // For group chats
  description: text("description"), // For group chats
  avatar: text("avatar"), // Group avatar URL

  // Metadata
  createdBy: text("created_by"), // User ID who created the conversation
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }), // For sorting
  isArchived: integer("is_archived", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * Messages - Individual messages in a conversation
 */
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),

  // Sender
  senderId: text("sender_id").notNull(), // User ID who sent the message
  senderType: text("sender_type"), // "student", "teacher", "parent", "admin", "system"

  // Content
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // "text", "image", "file", "audio", "system"

  // Attachments
  attachments: text("attachments", { mode: "json" }).$type<Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>>(),

  // Reply/Forward
  replyTo: text("reply_to"), // Message ID being replied to
  forwardedFrom: text("forwarded_from"), // Original message ID if forwarded

  // Status
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  isEdited: integer("is_edited", { mode: "boolean" }).default(false),
  editedAt: integer("edited_at", { mode: "timestamp" }),

  // Read receipts
  readBy: text("read_by", { mode: "json" }).$type<Array<{
    userId: string;
    readAt: number; // timestamp
  }>>(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

/**
 * Announcements - Official announcements from school/admin
 */
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"),
  tenantId: text("tenant_id"),

  // Content
  title: text("title").notNull(),
  content: text("content").notNull(),

  // Targeting
  targetAudience: text("target_audience", { mode: "json" }).$type<Array<
    "student" | "teacher" | "parent" | "admin" | "counselor" | "all"
  >>(),

  // Target specific users
  targetUsers: text("target_users", { mode: "json" }).$type<string[]>(),

  // Priority
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high", "urgent"
  category: text("category"), // "academic", "event", "holiday", "exam", "general"

  // Attachments
  attachments: text("attachments", { mode: "json" }).$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>(),

  // Scheduling
  publishAt: integer("publish_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),

  // Status
  status: text("status").notNull().default("draft"), // "draft", "published", "archived"

  // Creator
  createdBy: text("created_by"), // User ID
  createdByName: text("created_by_name"), // Display name
  createdByRole: text("created_by_role"), // For display

  // Engagement tracking
  viewCount: integer("view_count").default(0),
  clickedCount: integer("clicked_count").default(0),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * Announcement Reads - Track who has read which announcements
 */
export const announcementReads = sqliteTable("announcement_reads", {
  id: text("id").primaryKey(),
  announcementId: text("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  readAt: integer("read_at", { mode: "timestamp" }).notNull(),
  clickedAt: integer("clicked_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Notification Preferences - User's notification settings
 */
export const notificationPreferences = sqliteTable("notification_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),

  // Email notifications
  emailEnabled: integer("email_enabled", { mode: "boolean" }).default(true),
  emailAnnouncements: integer("email_announcements", { mode: "boolean" }).default(true),
  emailMessages: integer("email_messages", { mode: "boolean" }).default(true),
  emailHomework: integer("email_homework", { mode: "boolean" }).default(true),
  emailAttendance: integer("email_attendance", { mode: "boolean" }).default(true),
  emailFees: integer("email_fees", { mode: "boolean" }).default(true),

  // SMS notifications
  smsEnabled: integer("sms_enabled", { mode: "boolean" }).default(false),
  smsAnnouncements: integer("sms_announcements", { mode: "boolean" }).default(false),
  smsAttendance: integer("sms_attendance", { mode: "boolean" }).default(true),
  smsFees: integer("sms_fees", { mode: "boolean" }).default(true),

  // Push notifications (in-app)
  pushEnabled: integer("push_enabled", { mode: "boolean" }).default(true),
  pushAnnouncements: integer("push_announcements", { mode: "boolean" }).default(true),
  pushMessages: integer("push_messages", { mode: "boolean" }).default(true),
  pushHomework: integer("push_homework", { mode: "boolean" }).default(true),

  // Quiet hours
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// NOTIFICATION QUEUE
// ============================================================================

/**
 * Notification Queue - Queue for sending notifications (email/SMS/push)
 */
export const notificationQueue = sqliteTable("notification_queue", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Notification details
  type: text("type").notNull(), // "email", "sms", "push"
  category: text("category").notNull(), // "announcement", "message", "homework", "attendance", "fee"
  title: text("title").notNull(),
  body: text("body").notNull(),

  // Target
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),

  // Data
  data: text("data", { mode: "json" }), // Additional data for the notification
  actionUrl: text("action_url"), // Link to open when clicked

  // Status
  status: text("status").notNull().default("pending"), // "pending", "sending", "sent", "failed"
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),

  // Error tracking
  lastError: text("last_error"),
  failedAt: integer("failed_at", { mode: "timestamp" }),
  sentAt: integer("sent_at", { mode: "timestamp" }),

  // Scheduling
  sendAt: integer("send_at", { mode: "timestamp" }).notNull(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NotificationQueueItem = typeof notificationQueue.$inferSelect;
