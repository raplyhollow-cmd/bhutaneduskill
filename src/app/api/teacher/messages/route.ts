/**
 * TEACHER MESSAGES API
 *
 * GET /api/teacher/messages - List all message threads for the teacher
 * POST /api/teacher/messages - Send a reply to a parent
 *
 * Features:
 * - List all conversations with parents
 * - Get messages in a specific conversation
 * - Send replies
 * - Mark messages as read
 */

import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, parents, parentToStudent } from "@/lib/db/schema";
import { parentTeacherConversations, parentTeacherMessages } from "@/lib/db/parent-teacher-chat-schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface MessageThread {
  id: string;
  conversationId: string;
  parentId: string;
  parentName: string;
  parentImage: string | null;
  studentId: string;
  studentName: string;
  studentGrade: number | null;
  lastMessage: string;
  lastMessageAt: Date | null;
  unreadCount: number;
  subject: string | null;
}

interface SendMessageInput {
  conversationId: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
}

// ============================================================================
// GET - List Message Threads
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      // Get all conversations for this teacher
      const conversations = await db
        .select()
        .from(parentTeacherConversations)
        .where(
          and(
            eq(parentTeacherConversations.teacherId, userId),
            eq(parentTeacherConversations.status, "active")
          )
        )
        .orderBy(desc(parentTeacherConversations.lastMessageAt));

      if (conversations.length === 0) {
        return successResponse({ threads: [] });
      }

      // Get all unique parent and student IDs
      const parentIds = [...new Set(conversations.map((c) => c.parentId))];
      const studentIds = [...new Set(conversations.map((c) => c.studentId))];

      // Get parent details (linked to users)
      const [parentRecords] = await Promise.all([
        db.select().from(parents).where(inArray(parents.id, parentIds)),
      ]);

      const parentUserIds = parentRecords.map((p) => p.userId);

      // Get user details for parents and students
      const usersData = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          classGrade: users.classGrade,
        })
        .from(users)
        .where(inArray(users.id, [...parentUserIds, ...studentIds]));

      // Create maps for quick lookup
      const userMap = new Map(usersData.map((u) => [u.id, u]));
      const parentUserMap = new Map(parentRecords.map((p) => [p.id, p.userId]));

      // Build thread list
      const threads: MessageThread[] = conversations.map((conv) => {
        const parentUserId = parentUserMap.get(conv.parentId);
        const parentUser = parentUserId ? userMap.get(parentUserId) : null;
        const studentUser = userMap.get(conv.studentId);

        return {
          id: conv.id,
          conversationId: conv.id,
          parentId: conv.parentId,
          parentName: parentUser
            ? `${parentUser.firstName} ${parentUser.lastName}`
            : "Unknown Parent",
          parentImage: parentUser?.profileImage || null,
          studentId: conv.studentId,
          studentName: studentUser
            ? `${studentUser.firstName} ${studentUser.lastName}`
            : "Unknown Student",
          studentGrade: studentUser?.classGrade || null,
          lastMessage: conv.lastMessagePreview || "",
          lastMessageAt: conv.lastMessageAt,
          unreadCount: conv.teacherUnreadCount,
          subject: conv.subject || null,
        };
      });

      return successResponse({ threads });
    } catch (error) {
      logger.apiError(error, { route: "/api/teacher/messages", method: "GET" });
      return errorResponse("Failed to fetch messages", 500);
    }
  },
  ["teacher"]
);

// ============================================================================
// POST - Send Reply
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const body: SendMessageInput = await request.json();
      const { conversationId, content, attachmentUrl, attachmentType, attachmentName } = body;

      // Validate input
      if (!conversationId || !content || content.trim() === "") {
        return badRequestResponse("Conversation ID and message content are required");
      }

      // Verify conversation exists and belongs to this teacher
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

      // Create the message
      const messageId = `pt-msg-${nanoid()}`;
      const now = new Date();

      await db.insert(parentTeacherMessages).values({
        id: messageId,
        conversationId: conversationId,
        senderId: userId,
        senderRole: "teacher",
        content: content.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
        attachmentName: attachmentName || null,
        readAt: null,
        createdAt: now,
        updatedAt: now,
      });

      // Update conversation metadata
      await db
        .update(parentTeacherConversations)
        .set({
          lastMessageAt: now,
          lastMessagePreview: content.substring(0, 100),
          parentUnreadCount: (conversation.parentUnreadCount || 0) + 1,
          teacherUnreadCount: 0, // Reset teacher's unread since they just sent
          updatedAt: now,
        })
        .where(eq(parentTeacherConversations.id, conversationId));

      logger.info("Teacher sent message to parent", {
        teacherId: userId,
        parentId: conversation.parentId,
        conversationId,
        messageId,
      });

      return successResponse({
        conversationId,
        messageId,
        message: "Reply sent successfully",
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/teacher/messages", method: "POST" });
      return errorResponse("Failed to send reply", 500);
    }
  },
  ["teacher"]
);
