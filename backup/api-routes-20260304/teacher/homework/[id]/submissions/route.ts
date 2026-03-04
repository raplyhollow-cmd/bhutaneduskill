/**
 * TEACHER HOMEWORK SUBMISSIONS API
 *
 * GET /api/teacher/homework/[id]/submissions - Get all submissions for a homework
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from "@/lib/api/response-helpers";

// Types for homework and submission records
type HomeworkRecord = typeof homework.$inferSelect;
type SubmissionContent = {
  answers?: Array<{ questionId: string; answer: string | string[] }>;
  text?: string;
  files?: string[];
  attachments?: string[];
};

// ============================================================================
// GET /api/teacher/homework/[id]/submissions - Get all submissions
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { user: currentUser, userId } = auth;
    const { id: homeworkId } = await context!.params;

    // Check homework.read permission (for viewing submissions)
    const permCheck = await requirePermission(userId, "homework.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // submitted, graded, all

    try {
      // Verify homework ownership using db.select()
      const homeworkResult = await db
        .select()
        .from(homework)
        .where(eq(homework.id, homeworkId))
        .limit(1);

      const homeworkData = homeworkResult[0] as HomeworkRecord | undefined;

      if (!homeworkData) {
        return notFoundResponse("Homework");
      }

      // Note: Since homework table doesn't have teacherId, we check through subject/class
      // For now, just verify the user is a teacher
      if (currentUser.type !== 'teacher' && currentUser.type !== 'admin') {
        return forbiddenResponse("Only teachers can view submissions");
      }

      // Get submissions using db.select() with join for student info
      const submissionsResult = await db
        .select({
          id: homeworkSubmissions.id,
          homeworkId: homeworkSubmissions.homeworkId,
          studentId: homeworkSubmissions.studentId,
          status: homeworkSubmissions.status,
          submittedAt: homeworkSubmissions.submittedAt,
          gradedAt: homeworkSubmissions.gradedAt,
          score: homeworkSubmissions.score,
          feedback: homeworkSubmissions.feedback,
          content: homeworkSubmissions.content,
          // Student info
          studentId2: users.id,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          studentEmail: users.email,
        })
        .from(homeworkSubmissions)
        .innerJoin(users, eq(homeworkSubmissions.studentId, users.id))
        .where(eq(homeworkSubmissions.homeworkId, homeworkId))
        .orderBy(desc(homeworkSubmissions.submittedAt));

      // Format submissions
      const submissions = submissionsResult.map(s => {
        const content = s.content as SubmissionContent | null;
        return {
          id: s.id,
          homeworkId: s.homeworkId,
          studentId: s.studentId,
          status: s.status,
          submittedAt: s.submittedAt,
          gradedAt: s.gradedAt,
          score: s.score,
          feedback: s.feedback,
          answers: content?.answers,
          attachments: content?.attachments,
          student: {
            id: s.studentId2,
            firstName: s.studentFirstName,
            lastName: s.studentLastName,
            email: s.studentEmail,
          },
        };
      });

      // Filter by status if needed
      const filteredSubmissions = status && status !== "all"
        ? submissions.filter(s => s.status === status)
        : submissions;

      return successResponse({ submissions: filteredSubmissions });
    } catch (error) {
      logger.error("Submissions fetch error:", error);
      return errorResponse("Failed to fetch submissions", 500);
    }
  },
  ['teacher', 'admin']
);
