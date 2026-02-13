/**
 * Messaging & Communication Database Schema Extension
 * Add these tables to your existing schema
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// MESSAGING & CONVERSATIONS
// ============================================================================

/**
 * Conversations - A conversation between two or more participants
 */
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"), // For school-scoped conversations

  // Participants
  type: text("type").notNull(), // "direct", "group", "announcement"
  participants: json("participants").$type<string[]>(), // Array of user IDs

  // Group/announcement specific
  name: text("name"), // For group chats
  description: text("description"), // For group chats
  avatar: text("avatar"), // Group avatar URL

  // Metadata
  createdBy: text("created_by"), // User ID who created the conversation
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }), // For sorting
  isArchived: boolean("is_archived").default(false),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

/**
 * Messages - Individual messages in a conversation
 */
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),

  // Sender
  senderId: text("sender_id").notNull(), // User ID who sent the message
  senderType: text("sender_type"), // "student", "teacher", "parent", "admin", "system"

  // Content
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // "text", "image", "file", "audio", "system"

  // Attachments
  attachments: json("attachments").$type<Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>>(),

  // Reply/Forward
  replyTo: text("reply_to"), // Message ID being replied to
  forwardedFrom: text("forwarded_from"), // Original message ID if forwarded

  // Status
  isDeleted: boolean("is_deleted").default(false),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at", { withTimezone: true }),

  // Read receipts
  readBy: json("read_by").$type<Array<{
    userId: string;
    readAt: number; // timestamp
  }>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

/**
 * Announcements - Official announcements from school/admin
 */
export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"),
  tenantId: text("tenant_id"),

  // Content
  title: text("title").notNull(),
  content: text("content").notNull(),

  // Targeting
  targetAudience: json("target_audience").$type<Array<
    "student" | "teacher" | "parent" | "admin" | "counselor" | "all"
  >>(),

  // Target specific users
  targetUsers: json("target_users").$type<string[]>(),

  // Priority
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high", "urgent"
  category: text("category"), // "academic", "event", "holiday", "exam", "general"

  // Attachments
  attachments: json("attachments").$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>(),

  // Scheduling
  publishAt: timestamp("publish_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  // Status
  status: text("status").notNull().default("draft"), // "draft", "published", "archived"

  // Creator
  createdBy: text("created_by"), // User ID
  createdByName: text("created_by_name"), // Display name
  createdByRole: text("created_by_role"), // For display

  // Engagement tracking
  viewCount: integer("view_count").default(0),
  clickedCount: integer("clicked_count").default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

/**
 * Announcement Reads - Track who has read which announcements
 */
export const announcementReads = pgTable("announcement_reads", {
  id: text("id").primaryKey(),
  announcementId: text("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).notNull(),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Notification Preferences - User's notification settings
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),

  // Email notifications
  emailEnabled: boolean("email_enabled").default(true),
  emailAnnouncements: boolean("email_announcements").default(true),
  emailMessages: boolean("email_messages").default(true),
  emailHomework: boolean("email_homework").default(true),
  emailAttendance: boolean("email_attendance").default(true),
  emailFees: boolean("email_fees").default(true),

  // SMS notifications
  smsEnabled: boolean("sms_enabled").default(false),
  smsAnnouncements: boolean("sms_announcements").default(false),
  smsAttendance: boolean("sms_attendance").default(true),
  smsFees: boolean("sms_fees").default(true),

  // Push notifications (in-app)
  pushEnabled: boolean("push_enabled").default(true),
  pushAnnouncements: boolean("push_announcements").default(true),
  pushMessages: boolean("push_messages").default(true),
  pushHomework: boolean("push_homework").default(true),

  // Quiet hours
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// NOTIFICATION QUEUE
// ============================================================================

/**
 * Notification Queue - Queue for sending notifications (email/SMS/push)
 */
export const notificationQueue = pgTable("notification_queue", {
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
  data: json("data"), // Additional data for the notification
  actionUrl: text("action_url"), // Link to open when clicked

  // Status
  status: text("status").notNull().default("pending"), // "pending", "sending", "sent", "failed"
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),

  // Error tracking
  lastError: text("last_error"),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),

  // Scheduling
  sendAt: timestamp("send_at", { withTimezone: true }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
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
