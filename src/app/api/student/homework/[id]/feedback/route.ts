/**
 * STUDENT HOMEWORK FEEDBACK API
 *
 * GET /api/student/homework/[id]/feedback
 * Returns feedback for a specific homework submission
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { homeworkSubmissions, homework } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, notFoundResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await context.params;

    // Get the submission for this homework by this student
    const [submission] = await db
      .select({
        id: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        studentId: homeworkSubmissions.studentId,
        content: homeworkSubmissions.content,
        fileUrl: (homeworkSubmissions as any).fileUrl,
        fileName: (homeworkSubmissions as any).fileName,
        grade: (homeworkSubmissions as any).grade,
        maxGrade: (homeworkSubmissions as any).maxGrade,
        feedback: homeworkSubmissions.feedback,
        gradedAt: homeworkSubmissions.gradedAt,
        gradedBy: (homeworkSubmissions as any).gradedBy,
        status: homeworkSubmissions.status,
        submittedAt: homeworkSubmissions.submittedAt,
      })
      .from(homeworkSubmissions as any)
      .where(
        and(
          eq(homeworkSubmissions.homeworkId, id),
          eq(homeworkSubmissions.studentId, userId)
        )
      )
      .limit(1);

    if (!submission) {
      return notFoundResponse("Homework submission not found");
    }

    // Get homework details
    const [homeworkDetails] = await db
      .select({
        id: homework.id,
        title: homework.title,
        description: homework.description,
        dueDate: homework.dueDate,
        maxGrade: (homework as any).maxGrade,
      })
      .from(homework as any)
      .where(eq(homework.id, id))
      .limit(1);

    return successResponse({
      submission,
      homework: homeworkDetails,
    });
  },
  ['student']
);
