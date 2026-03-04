/**
 * PARENT MESSAGES API
 *
 * GET /api/parent/messages - List all message threads for the parent
 * POST /api/parent/messages - Send a new message or start a new conversation
 *
 * Features:
 * - List all conversations with teachers
 * - Get messages in a specific conversation
 * - Send new messages
 * - Mark messages as read
 */

import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, parents, parentToStudent, classes, enrollments } from "@/lib/db/schema";
import { parentTeacherConversations, parentTeacherMessages } from "@/lib/db/parent-teacher-chat-schema";
import { eq, and, inArray, desc, or } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface MessageThread {
  id: string;
  conversationId: string;
  teacherId: string;
  teacherName: string;
  teacherImage: string | null;
  studentId: string;
  studentName: string;
  studentGrade: number | null;
  lastMessage: string;
  lastMessageAt: Date | null;
  unreadCount: number;
  subject: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "parent" | "teacher";
  senderName: string;
  content: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  readAt: Date | null;
  createdAt: Date;
  isEdited: boolean;
}

interface SendMessageInput {
  teacherId: string;
  studentId: string;
  content: string;
  subject?: string;
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

    const { userId, user } = auth;

    try {
      // Get parent record
      const [parentRecord] = await db
        .select()
        .from(parents)
        .where(eq(parents.userId, userId))
        .limit(1);

      if (!parentRecord) {
        logger.warn("No parent record found for user", { userId });
        return successResponse({ threads: [] });
      }

      // Get children linked to this parent
      const relationships = await db
        .select()
        .from(parentToStudent)
        .where(eq(parentToStudent.parentId, parentRecord.id));

      if (relationships.length === 0) {
        return successResponse({ threads: [] });
      }

      const studentIds = relationships.map((r) => r.studentId);

      // Get students' details
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          classGrade: users.classGrade,
        })
        .from(users)
        .where(and(eq(users.type, "student"), inArray(users.id, studentIds)));

      const studentMap = new Map(students.map((s) => [s.id, s]));

      // Get all conversations for this parent
      const conversations = await db
        .select()
        .from(parentTeacherConversations)
        .where(
          and(
            eq(parentTeacherConversations.parentId, parentRecord.id),
            eq(parentTeacherConversations.status, "active")
          )
        )
        .orderBy(desc(parentTeacherConversations.lastMessageAt));

      if (conversations.length === 0) {
        return successResponse({ threads: [] });
      }

      // Get teacher details for all conversations
      const teacherIds = [...new Set(conversations.map((c) => c.teacherId))];
      const teachers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        })
        .from(users)
        .where(inArray(users.id, teacherIds));

      const teacherMap = new Map(teachers.map((t) => [t.id, t]));

      // Build thread list
      const threads: MessageThread[] = conversations
        .filter((c) => studentMap.has(c.studentId) && teacherMap.has(c.teacherId))
        .map((conv) => {
          const student = studentMap.get(conv.studentId)!;
          const teacher = teacherMap.get(conv.teacherId)!;

          return {
            id: conv.id,
            conversationId: conv.id,
            teacherId: conv.teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            teacherImage: teacher.profileImage || null,
            studentId: conv.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            studentGrade: student.classGrade,
            lastMessage: conv.lastMessagePreview || "",
            lastMessageAt: conv.lastMessageAt,
            unreadCount: conv.parentUnreadCount,
            subject: conv.subject || null,
          };
        });

      return successResponse({ threads });
    } catch (error) {
      logger.apiError(error, { route: "/api/parent/messages", method: "GET" });
      return errorResponse("Failed to fetch messages", 500);
    }
  },
  ["parent"]
);

// ============================================================================
// POST - Send Message
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    try {
      const body: SendMessageInput = await request.json();
      const { teacherId, studentId, content, subject, attachmentUrl, attachmentType, attachmentName } = body;

      // Validate input
      if (!teacherId || !studentId || !content || content.trim() === "") {
        return badRequestResponse("Teacher ID, student ID, and message content are required");
      }

      // Get parent record
      const [parentRecord] = await db
        .select()
        .from(parents)
        .where(eq(parents.userId, userId))
        .limit(1);

      if (!parentRecord) {
        return notFoundResponse("Parent record");
      }

      // Verify the student is linked to this parent
      const [relationship] = await db
        .select()
        .from(parentToStudent)
        .where(
          and(
            eq(parentToStudent.parentId, parentRecord.id),
            eq(parentToStudent.studentId, studentId)
          )
        )
        .limit(1);

      if (!relationship) {
        return badRequestResponse("Student is not linked to your account");
      }

      // Verify teacher exists
      const [teacher] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, teacherId), eq(users.type, "teacher")))
        .limit(1);

      if (!teacher) {
        return notFoundResponse("Teacher");
      }

      // Check if conversation already exists
      const [existingConversation] = await db
        .select()
        .from(parentTeacherConversations)
        .where(
          and(
            eq(parentTeacherConversations.parentId, parentRecord.id),
            eq(parentTeacherConversations.teacherId, teacherId),
            eq(parentTeacherConversations.studentId, studentId),
            eq(parentTeacherConversations.status, "active")
          )
        )
        .limit(1);

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;

        // Update conversation metadata
        await db
          .update(parentTeacherConversations)
          .set({
            lastMessageAt: new Date(),
            lastMessagePreview: content.substring(0, 100),
            teacherUnreadCount: (existingConversation.teacherUnreadCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(parentTeacherConversations.id, conversationId));
      } else {
        // Create new conversation
        conversationId = `pt-convo-${nanoid()}`;
        const now = new Date();

        await db.insert(parentTeacherConversations).values({
          id: conversationId,
          parentId: parentRecord.id,
          teacherId: teacherId,
          studentId: studentId,
          schoolId: teacher.schoolId || user.schoolId || "",
          subject: subject || null,
          lastMessageAt: now,
          lastMessagePreview: content.substring(0, 100),
          parentUnreadCount: 0,
          teacherUnreadCount: 1,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create the message
      const messageId = `pt-msg-${nanoid()}`;
      const now = new Date();

      await db.insert(parentTeacherMessages).values({
        id: messageId,
        conversationId: conversationId,
        senderId: parentRecord.id,
        senderRole: "parent",
        content: content.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
        attachmentName: attachmentName || null,
        readAt: null,
        createdAt: now,
        updatedAt: now,
      });

      logger.info("Parent sent message to teacher", {
        parentId: parentRecord.id,
        teacherId,
        conversationId,
        messageId,
      });

      return successResponse({
        conversationId,
        messageId,
        message: "Message sent successfully",
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/parent/messages", method: "POST" });
      return errorResponse("Failed to send message", 500);
    }
  },
  ["parent"]
);
