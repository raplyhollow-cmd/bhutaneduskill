/**
 * Messages API - Communication between parents, teachers, and admins
 *
 * Supports:
 * - GET: Fetch conversations and messages
 * - POST: Send new messages or create conversations
 * - PATCH: Mark messages as read/unread
 * - DELETE: Delete message or archive conversation
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { conversations, messages, users } from "@/lib/db/schema";
import { eq, and, or, desc, asc, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface SendMessageBody {
  conversationId?: string;
  recipientId?: string;
  subject?: string;
  content: string;
  messageType?: "text" | "image" | "file" | "audio";
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  replyTo?: string;
}

interface MessageReadBody {
  messageIds: string[];
  conversationId?: string;
  read: boolean;
}

interface MessageWithSender {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string | null;
  content: string;
  messageType: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }> | null;
  replyTo: string | null;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt: Date | null;
  readBy: Array<{
    userId: string;
    readAt: number;
  }> | null;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    type: string;
    email: string;
    profileImage: string | null;
  };
}

interface ConversationWithParticipants {
  id: string;
  schoolId: string | null;
  type: string;
  participants: string[] | null;
  name: string | null;
  description: string | null;
  avatar: string | null;
  createdBy: string | null;
  lastMessageAt: Date | null;
  isArchived: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: MessageWithSender;
  unreadCount?: number;
  otherParticipants?: Array<{
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    type: string;
    email: string;
    profileImage: string | null;
  }>;
}

// ============================================================================
// GET - Fetch conversations and messages
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const folder = searchParams.get("folder") || "inbox"; // inbox, sent, archived
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    logger.info("Fetching messages", { userId, conversationId, unreadOnly, folder });

    // If specific conversation requested, fetch its messages
    if (conversationId) {
      const conversation = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1).then(r => r[0]);

      if (!conversation) {
        return notFoundResponse("Conversation");
      }

      const participants = conversation.participants as string[] | null;
      if (!participants || !participants.includes(userId)) {
        return forbiddenResponse("Not a participant in this conversation");
      }

      // Fetch messages for this conversation
      const messagesList = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          senderType: messages.senderType,
          content: messages.content,
          messageType: messages.messageType,
          attachments: messages.attachments,
          replyTo: messages.replyTo,
          isDeleted: messages.isDeleted,
          isEdited: messages.isEdited,
          editedAt: messages.editedAt,
          readBy: messages.readBy,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
          sender: {
            id: users.id,
            name: users.name,
            firstName: users.firstName,
            lastName: users.lastName,
            type: users.type,
            email: users.email,
            profileImage: users.profileImage,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt));

      // Mark messages as read by this user
      const unreadMessages = messagesList.filter((msg) => {
        const readBy = msg.readBy as Array<{ userId: string; readAt: number }> | null;
        return !readBy || !readBy.some((r) => r.userId === userId);
      });

      if (unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          const currentReadBy = (msg.readBy as Array<{ userId: string; readAt: number }>) || [];
          await db
            .update(messages)
            .set({
              readBy: [...currentReadBy, { userId, readAt: Date.now() }],
              updatedAt: new Date(),
            })
            .where(eq(messages.id, msg.id));
        }
      }

      return successResponse({
        conversation,
        messages: messagesList,
      });
    }

    // Fetch user's conversations
    const userConversations = await db
      .select({
        id: conversations.id,
        schoolId: conversations.schoolId,
        type: conversations.type,
        participants: conversations.participants,
        name: conversations.name,
        description: conversations.description,
        avatar: conversations.avatar,
        createdBy: conversations.createdBy,
        lastMessageAt: conversations.lastMessageAt,
        isArchived: conversations.isArchived,
        isActive: conversations.isActive,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(
        and(
          sql`${conversations.participants}::jsonb ? ${userId}`,
          eq(conversations.isActive, true)
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // Fetch last message and participant details for each conversation
    const enrichedConversations: ConversationWithParticipants[] = [];

    for (const conv of userConversations) {
      const participants = conv.participants as string[] | null;
      const otherParticipantIds = participants?.filter((id) => id !== userId) || [];

      // Get other participants' details
      const otherParticipantsData = otherParticipantIds.length > 0
        ? await db
          .select({
            id: users.id,
            name: users.name,
            firstName: users.firstName,
            lastName: users.lastName,
            type: users.type,
            email: users.email,
            profileImage: users.profileImage,
          })
          .from(users)
          .where(inArray(users.id, otherParticipantIds))
        : [];

      // Get last message
      const lastMessageData = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          senderType: messages.senderType,
          content: messages.content,
          messageType: messages.messageType,
          attachments: messages.attachments,
          replyTo: messages.replyTo,
          isDeleted: messages.isDeleted,
          isEdited: messages.isEdited,
          editedAt: messages.editedAt,
          readBy: messages.readBy,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
          sender: {
            id: users.id,
            name: users.name,
            firstName: users.firstName,
            lastName: users.lastName,
            type: users.type,
            email: users.email,
            profileImage: users.profileImage,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Count unread messages for this user
      const allMessages = await db
        .select({ id: messages.id, senderId: messages.senderId, readBy: messages.readBy })
        .from(messages)
        .where(eq(messages.conversationId, conv.id));

      const unreadCount = allMessages.filter((msg) => {
        const readBy = msg.readBy as Array<{ userId: string; readAt: number }> | null;
        return msg.senderId !== userId && (!readBy || !readBy.some((r) => r.userId === userId));
      }).length;

      enrichedConversations.push({
        ...conv,
        lastMessage: lastMessageData[0] || undefined,
        unreadCount,
        otherParticipants: otherParticipantsData,
      });
    }

    // Filter by folder
    let filteredConversations = enrichedConversations;
    if (folder === "sent") {
      filteredConversations = enrichedConversations.filter(
        (conv) => conv.lastMessage?.senderId === userId
      );
    } else if (unreadOnly) {
      filteredConversations = enrichedConversations.filter((conv) => (conv.unreadCount || 0) > 0);
    }

    return successResponse({
      conversations: filteredConversations,
      total: filteredConversations.length,
    });
  },
  ["parent", "teacher", "admin", "school-admin", "counselor"]
);

// ============================================================================
// POST - Send message or create conversation
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const body = await req.json() as SendMessageBody;

    // Validate required fields
    if (!body.content || body.content.trim() === "") {
      return badRequestResponse("Message content is required");
    }

    let conversationId = body.conversationId;
    const messageType = body.messageType || "text";

    // If no conversation provided, create a new one
    if (!conversationId) {
      if (!body.recipientId) {
        return badRequestResponse("Recipient or conversation ID is required");
      }

      // Verify recipient exists
      const recipient = await db.select().from(users).where(eq(users.id, body.recipientId)).limit(1).then(r => r[0]);

      if (!recipient) {
        return notFoundResponse("Recipient");
      }

      // Check if a conversation already exists between these users
      const existingConversations = await db
        .select()
        .from(conversations)
        .where(
          and(
            sql`${conversations.participants}::jsonb ? ${userId}`,
            sql`${conversations.participants}::jsonb ? ${body.recipientId}`,
            eq(conversations.type, "direct")
          )
        )
        .limit(1);

      if (existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation
        conversationId = `conv_${Date.now()}_${nanoid(10)}`;
        const now = new Date();

        await db.insert(conversations).values({
          id: conversationId,
          schoolId: user.schoolId || recipient.schoolId,
          type: "direct",
          participants: [userId, body.recipientId],
          createdBy: userId,
          lastMessageAt: now,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Verify user is a participant in the conversation
    const conversation = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1).then(r => r[0]);

    if (!conversation) {
      return notFoundResponse("Conversation");
    }

    const participants = conversation.participants as string[] | null;
    if (!participants || !participants.includes(userId)) {
      return forbiddenResponse("Not a participant in this conversation");
    }

    // Create message
    const messageId = `msg_${Date.now()}_${nanoid(10)}`;
    const now = new Date();

    const newMessage = {
      id: messageId,
      conversationId,
      senderId: userId,
      senderType: user.type as string,
      content: body.content.trim(),
      messageType,
      attachments: body.attachments || null,
      replyTo: body.replyTo || null,
      readBy: [{ userId, readAt: Date.now() }],
      isDeleted: false,
      isEdited: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(messages).values(newMessage);

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(conversations.id, conversationId));

    logger.info("Message sent", { messageId, conversationId, userId });

    return successResponse({
      message: newMessage,
      conversationId,
    });
  },
  ["parent", "teacher", "admin", "school-admin", "counselor"]
);

// ============================================================================
// PATCH - Mark messages as read/unread
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const body = await req.json() as MessageReadBody;

    if (!body.messageIds || !Array.isArray(body.messageIds) || body.messageIds.length === 0) {
      // If no specific message IDs, mark all messages in conversation
      if (body.conversationId) {
        const conversation = await db.select().from(conversations).where(eq(conversations.id, body.conversationId)).limit(1).then(r => r[0]);

        if (!conversation) {
          return notFoundResponse("Conversation");
        }

        const participants = conversation.participants as string[] | null;
        if (!participants || !participants.includes(userId)) {
          return forbiddenResponse("Not a participant in this conversation");
        }

        // Get all messages in conversation not sent by current user
        const messagesList = await db
          .select({ id: messages.id, readBy: messages.readBy })
          .from(messages)
          .where(and(
            eq(messages.conversationId, body.conversationId),
            sql`${messages.senderId} != ${userId}`
          ));

        for (const msg of messagesList) {
          const currentReadBy = (msg.readBy as Array<{ userId: string; readAt: number }>) || [];
          const alreadyRead = currentReadBy.some((r) => r.userId === userId);

          if (body.read && !alreadyRead) {
            await db
              .update(messages)
              .set({
                readBy: [...currentReadBy, { userId, readAt: Date.now() }],
                updatedAt: new Date(),
              })
              .where(eq(messages.id, msg.id));
          } else if (!body.read && alreadyRead) {
            await db
              .update(messages)
              .set({
                readBy: currentReadBy.filter((r) => r.userId !== userId),
                updatedAt: new Date(),
              })
              .where(eq(messages.id, msg.id));
          }
        }

        logger.info("Conversation messages marked", {
          conversationId: body.conversationId,
          userId,
          read: body.read,
        });

        return successResponse({ updated: messagesList.length });
      }

      return badRequestResponse("Message IDs or conversation ID required");
    }

    // Mark specific messages as read/unread
    let updatedCount = 0;

    for (const messageId of body.messageIds) {
      const msg = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1).then(r => r[0]);

      if (!msg) continue;

      const currentReadBy = (msg.readBy as Array<{ userId: string; readAt: number }>) || [];
      const alreadyRead = currentReadBy.some((r) => r.userId === userId);

      if (body.read && !alreadyRead) {
        await db
          .update(messages)
          .set({
            readBy: [...currentReadBy, { userId, readAt: Date.now() }],
            updatedAt: new Date(),
          })
          .where(eq(messages.id, messageId));
        updatedCount++;
      } else if (!body.read && alreadyRead) {
        await db
          .update(messages)
          .set({
            readBy: currentReadBy.filter((r) => r.userId !== userId),
            updatedAt: new Date(),
          })
          .where(eq(messages.id, messageId));
        updatedCount++;
      }
    }

    logger.info("Messages marked", { userId, count: updatedCount, read: body.read });

    return successResponse({ updated: updatedCount });
  },
  ["parent", "teacher", "admin", "school-admin", "counselor"]
);

// ============================================================================
// DELETE - Delete message or archive conversation
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get("messageId");
    const conversationId = searchParams.get("conversationId");

    if (messageId) {
      // Delete specific message (only if sender is current user or admin)
      const msg = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1).then(r => r[0]);

      if (!msg) {
        return notFoundResponse("Message");
      }

      if (msg.senderId !== userId) {
        return forbiddenResponse("Can only delete own messages");
      }

      await db
        .update(messages)
        .set({
          isDeleted: true,
          content: "[Message deleted]",
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId));

      logger.info("Message deleted", { messageId, userId });

      return successResponse({ deleted: messageId });
    }

    if (conversationId) {
      // Archive conversation
      const conversation = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1).then(r => r[0]);

      if (!conversation) {
        return notFoundResponse("Conversation");
      }

      const participants = conversation.participants as string[] | null;
      if (!participants || !participants.includes(userId)) {
        return forbiddenResponse("Not a participant in this conversation");
      }

      await db
        .update(conversations)
        .set({
          isArchived: true,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      logger.info("Conversation archived", { conversationId, userId });

      return successResponse({ archived: conversationId });
    }

    return badRequestResponse("Message ID or conversation ID required");
  },
  ["parent", "teacher", "admin", "school-admin", "counselor"]
);
