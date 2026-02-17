/**
 * Messages API - Communication between parents, teachers, and admins
 *
 * Supports:
 * - GET: Fetch conversations and messages
 * - POST: Send new messages or create conversations
 * - PATCH: Mark messages as read/unread
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { conversations, messages, users, schools } from "@/lib/db/schema";
import { eq, and, or, desc, asc, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

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

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["parent", "teacher", "admin", "school-admin", "counselor"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const folder = searchParams.get("folder") || "inbox"; // inbox, sent, archived
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    logger.info("Fetching messages", { userId, conversationId, unreadOnly, folder });

    // If specific conversation requested, fetch its messages
    if (conversationId) {
      // Verify user is a participant
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found", status: 404 } satisfies ApiErrorResponse,
          { status: 404 }
        );
      }

      const participants = conversation.participants as string[] | null;
      if (!participants || !participants.includes(userId)) {
        return NextResponse.json(
          { error: "Forbidden: Not a participant", status: 403 } satisfies ApiErrorResponse,
          { status: 403 }
        );
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

      return NextResponse.json({
        data: {
          conversation,
          messages: messagesList,
        },
      } satisfies ApiSuccess<{ conversation: typeof conversation; messages: typeof messagesList }>);
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

    return NextResponse.json({
      data: {
        conversations: filteredConversations,
        total: filteredConversations.length,
      },
    } satisfies ApiSuccess<{ conversations: typeof filteredConversations; total: number }>);

  } catch (error) {
    logger.apiError(error, { route: "/api/communication/messages", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch messages", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Send message or create conversation
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["parent", "teacher", "admin", "school-admin", "counselor"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const body = await req.json() as SendMessageBody;

    // Validate required fields
    if (!body.content || body.content.trim() === "") {
      return NextResponse.json(
        { error: "Message content is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    let conversationId = body.conversationId;
    const messageType = body.messageType || "text";

    // If no conversation provided, create a new one
    if (!conversationId) {
      if (!body.recipientId) {
        return NextResponse.json(
          { error: "Recipient or conversation ID is required", status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }

      // Verify recipient exists
      const recipient = await db.query.users.findFirst({
        where: eq(users.id, body.recipientId),
      });

      if (!recipient) {
        return NextResponse.json(
          { error: "Recipient not found", status: 404 } satisfies ApiErrorResponse,
          { status: 404 }
        );
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
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const participants = conversation.participants as string[] | null;
    if (!participants || !participants.includes(userId)) {
      return NextResponse.json(
        { error: "Forbidden: Not a participant", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    // Create message
    const messageId = `msg_${Date.now()}_${nanoid(10)}`;
    const now = new Date();

    const newMessage = {
      id: messageId,
      conversationId,
      senderId: userId,
      senderType: user.type,
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

    return NextResponse.json({
      data: {
        message: newMessage,
        conversationId,
      },
    } satisfies ApiSuccess<{ message: typeof newMessage; conversationId: string }>);

  } catch (error) {
    logger.apiError(error, { route: "/api/communication/messages", method: "POST" });
    return NextResponse.json(
      { error: "Failed to send message", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Mark messages as read/unread
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(["parent", "teacher", "admin", "school-admin", "counselor"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json() as MessageReadBody;

    if (!body.messageIds || !Array.isArray(body.messageIds) || body.messageIds.length === 0) {
      // If no specific message IDs, mark all messages in conversation
      if (body.conversationId) {
        const conversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, body.conversationId),
        });

        if (!conversation) {
          return NextResponse.json(
            { error: "Conversation not found", status: 404 } satisfies ApiErrorResponse,
            { status: 404 }
          );
        }

        const participants = conversation.participants as string[] | null;
        if (!participants || !participants.includes(userId)) {
          return NextResponse.json(
            { error: "Forbidden: Not a participant", status: 403 } satisfies ApiErrorResponse,
            { status: 403 }
          );
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

        return NextResponse.json({
          data: { updated: messagesList.length },
        } satisfies ApiSuccess<{ updated: number }>);
      }

      return NextResponse.json(
        { error: "Message IDs or conversation ID required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Mark specific messages as read/unread
    let updatedCount = 0;

    for (const messageId of body.messageIds) {
      const msg = await db.query.messages.findFirst({
        where: eq(messages.id, messageId),
      });

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

    return NextResponse.json({
      data: { updated: updatedCount },
    } satisfies ApiSuccess<{ updated: number }>);

  } catch (error) {
    logger.apiError(error, { route: "/api/communication/messages", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update message status", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete message or conversation
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(["parent", "teacher", "admin", "school-admin", "counselor"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get("messageId");
    const conversationId = searchParams.get("conversationId");

    if (messageId) {
      // Delete specific message (only if sender is current user or admin)
      const msg = await db.query.messages.findFirst({
        where: eq(messages.id, messageId),
      });

      if (!msg) {
        return NextResponse.json(
          { error: "Message not found", status: 404 } satisfies ApiErrorResponse,
          { status: 404 }
        );
      }

      if (msg.senderId !== userId) {
        return NextResponse.json(
          { error: "Forbidden: Can only delete own messages", status: 403 } satisfies ApiErrorResponse,
          { status: 403 }
        );
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

      return NextResponse.json({
        data: { deleted: messageId },
      } satisfies ApiSuccess<{ deleted: string }>);
    }

    if (conversationId) {
      // Archive conversation
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found", status: 404 } satisfies ApiErrorResponse,
          { status: 404 }
        );
      }

      const participants = conversation.participants as string[] | null;
      if (!participants || !participants.includes(userId)) {
        return NextResponse.json(
          { error: "Forbidden: Not a participant", status: 403 } satisfies ApiErrorResponse,
          { status: 403 }
        );
      }

      await db
        .update(conversations)
        .set({
          isArchived: true,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      logger.info("Conversation archived", { conversationId, userId });

      return NextResponse.json({
        data: { archived: conversationId },
      } satisfies ApiSuccess<{ archived: string }>);
    }

    return NextResponse.json(
      { error: "Message ID or conversation ID required", status: 400 } satisfies ApiErrorResponse,
      { status: 400 }
    );

  } catch (error) {
    logger.apiError(error, { route: "/api/communication/messages", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
