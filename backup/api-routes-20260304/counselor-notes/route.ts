/**
 * COUNSELOR NOTES API
 *
 * GET /api/counselor-notes - Get counselor notes with student and school info
 * POST /api/counselor-notes - Create counselor note
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { counselorNotes, users, schools } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import type { SQL } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

type WhereCondition = SQL | undefined;

interface CounselorNoteWithDetails {
  id: string;
  counselorId: string;
  studentId: string;
  note: string;
  title?: string;
  noteType?: string;
  tags?: string[];
  isConfidential?: boolean;
  isPrivate?: boolean;
  createdAt: Date;
  updatedAt: Date;
  studentName?: string;
  grade?: number | null;
  school?: string | null;
  category?: string;
  isSensitive?: boolean;
}

// GET /api/counselor-notes - Get counselor notes with student and school info
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser } = auth;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const counselorId = searchParams.get("counselorId");

    const conditions: WhereCondition[] = [];
    if (counselorId) {
      conditions.push(eq(counselorNotes.counselorId, counselorId));
    }
    if (studentId) {
      conditions.push(eq(counselorNotes.studentId, studentId));
    }

    // Counselors can only see their own notes (unless admin)
    if (currentUser.type === "counselor") {
      conditions.push(eq(counselorNotes.counselorId, currentUser.id as string));
    }

    let notes: CounselorNoteWithDetails[];
    if (conditions.length > 0) {
      // Use select with joins to get student and school info
      const notesData = await db
        .select({
          note: counselorNotes,
          student: {
            id: users.id,
            name: users.name,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            classGrade: users.classGrade,
            schoolId: users.schoolId,
          },
          school: {
            id: schools.id,
            name: schools.name,
          },
        })
        .from(counselorNotes)
        .leftJoin(users, eq(counselorNotes.studentId, users.id))
        .leftJoin(schools, eq(users.schoolId, schools.id))
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(counselorNotes.createdAt));

      // Format the response to include studentName and school
      notes = notesData.map((item) => ({
        ...item.note,
        studentName: item.student?.name || `${item.student?.firstName || ""} ${item.student?.lastName || ""}`.trim() || "Unknown",
        grade: item.student?.classGrade || null,
        school: item.school?.name || null,
        category: item.note.noteType || "general", // Map noteType to category
        tags: item.note.tags || [],
        isSensitive: item.note.isConfidential || false,
      }));
    } else {
      notes = [];
    }

    return successResponse({ notes });
  },
  ['admin', 'counselor']
);

// POST /api/counselor-notes - Create counselor note
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser } = auth;
    const body = await request.json();
    const { studentId, note, isPrivate, title, noteType = "session", category, tags } = body;

    // Validate required fields
    if (!studentId || !note) {
      return badRequestResponse("Missing required fields: studentId and note are required");
    }

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    const noteId = `note_${nanoid(12)}`;

    const [newNote] = await db
      .insert(counselorNotes)
      .values({
        id: noteId,
        counselorId: currentUser.id as string,
        studentId: studentId as string,
        noteType: category || noteType, // "session" | "observation" | "intervention" | "follow_up" | "academic" | "behavioral" | "personal" | "career"
        title: title || `Counseling Note - ${now.toLocaleDateString()}`,
        note,
        content: note, // Both note and content are stored
        isPrivate: !!isPrivate,
        isConfidential: false,
        sessionDate: todayDate,
        tags: tags || [],
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info("Counselor note created", {
      noteId,
      counselorId: currentUser.id,
      studentId,
      noteType: category || noteType,
    });

    return createdResponse({ note: newNote });
  },
  ['counselor']
);
