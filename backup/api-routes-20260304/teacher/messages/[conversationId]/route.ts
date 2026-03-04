/**
 * TEACHER MESSAGES - CONVERSATION DETAIL API
 *
 * GET /api/teacher/messages/[conversationId] - Get messages in a conversation
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, parents } from "@/lib/db/schema";
import { parentTeacherConversations, parentTeacherMessages } from "@/lib/db/parent-teacher-chat-schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// GET - Get Messages in Conversation
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth, context?: { params?: Promise<{ conversationId: string }> }) => {
    const { userId } = auth;
    const params = await context?.params;
    const conversationId = params?.conversationId;

    if (!conversationId) {
      return errorResponse("Conversation ID required", 400);
    }

    try {
      // Verify conversation belongs to this teacher
      const [conversation] = await db
        .select()
        .from(parentTeacherConversations)
        .where(
          and(
            eq(parentTeacherConversations.id, conversationId),
            eq(parentTeacherConversations.teacherId, userId)
          )
        )
        .limit(1);

      if (!conversation) {
        return notFoundResponse("Conversation");
      }

      // Get all messages in this conversation
      const messages = await db
        .select()
        .from(parentTeacherMessages)
        .where(eq(parentTeacherMessages.conversationId, conversationId))
        .orderBy(desc(parentTeacherMessages.createdAt));

      // Get all user IDs involved
      const userIds = [conversation.parentId, conversation.teacherId, ...messages.map((m) => m.senderId)];
      const uniqueUserIds = [...new Set(userIds)];

      // Fetch user details
      const userMap = new Map();
      for (const uid of uniqueUserIds) {
        const [userData] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImage: users.profileImage,
          })
          .from(users)
          .where(eq(users.id, uid))
          .limit(1);
        if (userData) {
          userMap.set(uid, userData);
        }
      }

      // Format messages with sender names
      const formattedMessages = messages.map((msg) => {
        const sender = userMap.get(msg.senderId);
        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : "Unknown";

        return {
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          senderName,
          senderImage: sender?.profileImage || null,
          content: msg.content,
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          attachmentName: msg.attachmentName,
          readAt: msg.readAt,
          createdAt: msg.createdAt,
          isEdited: msg.isEdited,
          isFromMe: msg.senderId === userId,
        };
      });

      // Mark unread messages as read
      const unreadMessages = messages.filter(
        (m) => m.senderId !== userId && !m.readAt
      );

      if (unreadMessages.length > 0) {
        // Update messages as read
        for (const msg of unreadMessages) {
          await db
            .update(parentTeacherMessages)
            .set({ readAt: new Date() })
            .where(eq(parentTeacherMessages.id, msg.id));
        }

        // Reset teacher unread count
        await db
          .update(parentTeacherConversations)
          .set({
            teacherUnreadCount: 0,
            updatedAt: new Date(),
          })
          .where(eq(parentTeacherConversations.id, conversationId));
      }

      return successResponse({
        conversation: {
          id: conversation.id,
          parentId: conversation.parentId,
          studentId: conversation.studentId,
          subject: conversation.subject,
          unreadCount: conversation.teacherUnreadCount,
        },
        messages: formattedMessages.reverse(), // Show oldest first
      });
    } catch (error) {
      logger.apiError(error, { route: `/api/teacher/messages/${conversationId}`, method: "GET" });
      return errorResponse("Failed to fetch conversation", 500);
    }
  },
  ["teacher"]
);
