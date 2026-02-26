/**
 * Parent-Teacher Chat Schema
 *
 * Dedicated schema for parent-teacher messaging functionality.
 * Uses the existing messaging infrastructure with specific parent-teacher context.
 */

import { pgTable, text, integer, timestamp, boolean, index, pgEnum } from "drizzle-orm/pg-core";

/**
 * Chat status enum
 */
export const chatStatusEnum = pgEnum("chat_status", ["active", "archived", "blocked"]);

/**
 * Parent-Teacher Conversations
 *
 * Represents a unique conversation thread between a parent and a teacher
 * about a specific student.
 */
export const parentTeacherConversations = pgTable("parent_teacher_conversations", {
  id: text("id").primaryKey(),

  // Participants
  parentId: text("parent_id").notNull().references(() => /* users */ "users".id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => /* users */ "users".id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => /* users */ "users".id, { onDelete: "cascade" }),

  // School context
  schoolId: text("school_id").notNull().references(() => /* schools */ "schools".id, { onDelete: "cascade" }),

  // Conversation metadata
  subject: text("subject"), // Optional subject line for the conversation
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }), // Updated when new messages arrive
  lastMessagePreview: text("last_message_preview"), // First 100 chars of last message

  // Status tracking
  status: text("status").notNull().default("active"), // "active" | "archived" | "blocked"

  // Read tracking - helps show unread badges
  parentUnreadCount: integer("parent_unread_count").notNull().default(0),
  teacherUnreadCount: integer("teacher_unread_count").notNull().default(0),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for common queries
  parentIdIdx: index("idx_pt_convo_parent_id").on(table.parentId),
  teacherIdIdx: index("idx_pt_convo_teacher_id").on(table.teacherId),
  studentIdIdx: index("idx_pt_convo_student_id").on(table.studentId),
  schoolIdIdx: index("idx_pt_convo_school_id").on(table.schoolId),
  lastMessageAtIdx: index("idx_pt_convo_last_message_at").on(table.lastMessageAt),
  // Composite index for parent's conversations
  parentStatusIdx: index("idx_pt_convo_parent_status").on(table.parentId, table.status),
  // Composite index for teacher's conversations
  teacherStatusIdx: index("idx_pt_convo_teacher_status").on(table.teacherId, table.status),
  // Unique constraint: one active conversation per parent-teacher-student trio
  uniqueActiveConversation: index("idx_pt_convo_unique").on(table.parentId, table.teacherId, table.studentId),
}));

/**
 * Parent-Teacher Messages
 *
 * Individual messages within a parent-teacher conversation.
 */
export const parentTeacherMessages = pgTable("parent_teacher_messages", {
  id: text("id").primaryKey(),

  // Conversation reference
  conversationId: text("conversation_id").notNull().references(() => parentTeacherConversations.id, { onDelete: "cascade" }),

  // Sender information
  senderId: text("sender_id").notNull().references(() => /* users */ "users".id, { onDelete: "cascade" }),
  senderRole: text("sender_role").notNull(), // "parent" | "teacher"

  // Message content
  content: text("content").notNull(),

  // Attachment support
  attachmentUrl: text("attachment_url"), // URL to attached file/image
  attachmentType: text("attachment_type"), // "image" | "file" | null
  attachmentName: text("attachment_name"), // Original filename

  // Message status
  isDeleted: boolean("is_deleted").notNull().default(false),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at", { withTimezone: true }),

  // Read receipts
  readAt: timestamp("read_at", { withTimezone: true }), // When the recipient read the message

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for common queries
  conversationIdIdx: index("idx_pt_msg_conversation_id").on(table.conversationId),
  senderIdIdx: index("idx_pt_msg_sender_id").on(table.senderId),
  createdAtIdx: index("idx_pt_msg_created_at").on(table.createdAt),
  // Composite index for fetching messages in a conversation
  conversationCreatedAtIdx: index("idx_pt_msg_convo_created").on(table.conversationId, table.createdAt),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ParentTeacherConversation = typeof parentTeacherConversations.$inferSelect;
export type NewParentTeacherConversation = typeof parentTeacherConversations.$inferInsert;
export type ParentTeacherMessage = typeof parentTeacherMessages.$inferSelect;
export type NewParentTeacherMessage = typeof parentTeacherMessages.$inferInsert;
