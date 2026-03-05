/**
 * MESSAGES FEATURE
 *
 * Internal messaging system
 */

import { defineFeature } from "@/lib/features/define-feature";

export const MessageFeature = defineFeature({
  name: "messages",
  tableName: "messages",

  schema: {
    id: { type: "text", required: true },
    fromId: { type: "text", required: true, reference: "users" },
    toId: { type: "text", required: true, reference: "users" },
    subject: { type: "text", required: true },
    content: { type: "text", required: true, multiline: true },
    priority: { type: "select", options: ["low", "normal", "high", "urgent"] },
    readAt: { type: "timestamp" },
    archived: { type: "boolean" },
    threadId: { type: "text" }, // For grouping messages
    replyTo: { type: "text" }, // Parent message ID for replies
    attachments: { type: "json" }, // Array of file URLs
    sentAt: { type: "timestamp" },
    createdAt: { type: "timestamp" },
    updatedAt: { type: "timestamp" },
  },

  permissions: {
    read: ["admin", "school-admin", "teacher", "student", "parent"],
    create: ["admin", "school-admin", "teacher", "student", "parent"],
    update: ["admin", "school-admin", "teacher", "student", "parent"],
    delete: ["admin", "school-admin"],
  },

  ui: {
    title: "Message",
    titlePlural: "Messages",
    basePath: "/messages",
    columns: [
      { key: "subject", label: "Subject" },
      { key: "fromId", label: "From" },
      { key: "toId", label: "To" },
      { key: "priority", label: "Priority" },
      { key: "sentAt", label: "Sent" },
    ],
  },

  // Actions for messages
  actions: {
    // Mark messages as read
    markRead: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { messages } = await import("@/lib/db/schema");
        const { eq, or, and } = await import("drizzle-orm");
        const { successResponse } = await import("@/lib/api/response-helpers");

        const { userId } = auth;
        const { messageIds, markAll } = data;
        const now = new Date();

        if (markAll) {
          await db
            .update(messages)
            .set({ readAt: now, updatedAt: now })
            .where(
              and(
                eq(messages.toId, userId),
                or(eq(messages.readAt, null), eq(messages.archived, false))
              )
            );
        } else if (messageIds && messageIds.length > 0) {
          for (const messageId of messageIds) {
            await db
              .update(messages)
              .set({ readAt: now, updatedAt: now })
              .where(and(eq(messages.id, messageId), eq(messages.toId, userId)));
          }
        }

        return successResponse({ message: "Messages marked as read" });
      },
      allowedRoles: ["admin", "school-admin", "teacher", "student", "parent"] as any[],
    },

    // Get unread count
    unreadCount: {
      handler: async (id: string | undefined, data: any, auth: any) => {
        const { db } = await import("@/lib/db");
        const { messages } = await import("@/lib/db/schema");
        const { eq, or, and, sql } = await import("drizzle-orm");
        const { successResponse } = await import("@/lib/api/response-helpers");

        const { userId } = auth;

        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.toId, userId),
              or(eq(messages.readAt, null), eq(messages.archived, false))
            )
          );

        return successResponse({ unreadCount: result?.count || 0 });
      },
      allowedRoles: ["admin", "school-admin", "teacher", "student", "parent"] as any[],
    },
  },
});
