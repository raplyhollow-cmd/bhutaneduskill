import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homeworkSubmissions, type homeworkSubmissions as HomeworkSubmissionsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import type { HomeworkContent } from "@/types";

// Type for homework submission insert
type HomeworkSubmissionInsert = typeof HomeworkSubmissionsTable.$inferInsert;

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Draft submission data
 */
interface DraftSubmissionValues {
  id: string;
  homeworkId: string;
  studentId: string;
  submittedAt: Date;
  content: HomeworkContent;
  gradedAt: Date;
  score: number;
  feedback: string;
  status: string;
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// POST /api/student/homework/[id]/draft - Save or create draft
export const POST = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { id } = await context!.params;

    const { user: currentUser, userId } = auth;

    const body = await request.json();
    const { answers, attachments, textAnswers } = body;

    // Check for existing submission
    const existingSubmissions = await db
      .select()
      .from(homeworkSubmissions)
      .where(and(
        eq(homeworkSubmissions.homeworkId, id),
        eq(homeworkSubmissions.studentId, currentUser.id)
      ))
      .limit(1);

    const existingSubmission = existingSubmissions[0];

    const now = new Date();

    if (existingSubmission) {
      // Update existing draft
      if (existingSubmission.status !== "draft") {
        return NextResponse.json({ error: "Cannot update submitted homework" }, { status: 400 });
      }

      // Build content from existing with updates
      const existingContent = existingSubmission.content as HomeworkContent || {};
      const updateContent: HomeworkContent = {
        ...existingContent,
        answers: answers || existingContent.answers || {},
        attachments: attachments || existingContent.attachments || [],
        textAnswers: textAnswers || existingContent.textAnswers || {},
      };

      const [updated] = await db.update(homeworkSubmissions)
        .set({ content: updateContent, updatedAt: now })
        .where(eq(homeworkSubmissions.id, existingSubmission.id))
        .returning();

      return NextResponse.json({ submission: updated });
    } else {
      // Create new draft
      const createData: DraftSubmissionValues = {
        id: `sub_${Date.now()}`,
        homeworkId: id,
        studentId: currentUser.id,
        submittedAt: now,
        content: {
          answers: (answers || {}) as Record<string, unknown>,
          attachments: (attachments || []) as unknown[],
          textAnswers: (textAnswers || {}) as Record<string, string>,
        } as unknown as HomeworkContent,
        gradedAt: now,
        score: 0,
        feedback: "",
        status: "draft",
        isLate: false,
        createdAt: now,
        updatedAt: now,
      };

      const [created] = await db.insert(homeworkSubmissions)
        .values(createData satisfies HomeworkSubmissionInsert)
        .returning();

      return NextResponse.json({ submission: created }, { status: 201 });
    }
  },
  ['student']
);
