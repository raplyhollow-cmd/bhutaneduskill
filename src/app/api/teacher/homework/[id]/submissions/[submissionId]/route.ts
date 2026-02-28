import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { gradeHomework } from "@/lib/auto-grading";
import { createApiRoute } from "@/lib/api/route-handler";

interface Params {
  params: Promise<{ id: string; submissionId: string }>;
}

// GET /api/teacher/homework/[id]/submissions/[submissionId] - Get submission details
export const GET = createApiRoute<{ id: string; submissionId: string }>(
  async (request, { userId, user: currentUser }, context) => {
    const params = await context!.params;
    const id = params.id;
    const submissionId = params.submissionId;

    // Check homework.read permission (for viewing submission details)
    const permCheck = await requirePermission(userId, "homework.read");
    if (permCheck) return permCheck;

    // Verify homework ownership
    const [homeworkData] = await db
      .select()
      .from(homework)
      .where(eq(homework.id, id))
      .limit(1);

    if (!homeworkData || (homeworkData as { teacherId?: string }).teacherId !== currentUser.id) {
      return {
        error: "Forbidden",
        status: 403
      };
    }

    const [submission] = await db
      .select({
        id: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        studentId: homeworkSubmissions.studentId,
        content: homeworkSubmissions.content,
        score: homeworkSubmissions.score,
        feedback: homeworkSubmissions.feedback,
        status: homeworkSubmissions.status,
        submittedAt: homeworkSubmissions.submittedAt,
        gradedAt: homeworkSubmissions.gradedAt,
        isLate: homeworkSubmissions.isLate,
        createdAt: homeworkSubmissions.createdAt,
        updatedAt: homeworkSubmissions.updatedAt,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          name: users.name,
        },
      })
      .from(homeworkSubmissions)
      .leftJoin(users, eq(homeworkSubmissions.studentId, users.id))
      .where(eq(homeworkSubmissions.id, submissionId))
      .limit(1);

    if (!submission[0]) {
      return {
        error: "Submission not found",
        status: 404
      };
    }

    return { submission: submission[0] };
  },
  ['teacher', 'admin']
);

// PUT /api/teacher/homework/[id]/submissions/[submissionId] - Grade submission
export const PUT = createApiRoute<{ id: string; submissionId: string }>(
  async (request, { userId, user: currentUser }, context) => {
    const params = await context!.params;
    const id = params.id;
    const submissionId = params.submissionId;

    // Check homework.update permission (for grading submissions)
    const permCheck = await requirePermission(userId, "homework.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { score, maxScore, feedback, questionFeedback, autoGrade } = body;

    // Verify homework ownership
    const [homeworkData] = await db
      .select()
      .from(homework)
      .where(eq(homework.id, id))
      .limit(1);

    if (!homeworkData || (homeworkData as { teacherId?: string }).teacherId !== currentUser.id) {
      return {
        error: "Forbidden",
        status: 403
      };
    }

    const [submission] = await db
      .select()
      .from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.id, submissionId))
      .limit(1);

    if (!submission[0]) {
      return {
        error: "Submission not found",
        status: 404
      };
    }

    // Prepare update data
    const updateData: {
      status: string;
      gradedAt: Date;
      updatedAt: Date;
      score?: number;
      feedback?: string;
    } = {
      status: "graded",
      gradedAt: new Date(),
      updatedAt: new Date(),
    };

    if (autoGrade && homeworkData.questions) {
      // Auto-grade using auto-grading engine
      const supportedTypes = ["multiple_choice", "true_false", "fill_blank", "short_answer", "essay", "numeric", "math_expression", "match_following"];
      const gradableQuestions = (homeworkData.questions as unknown as Array<{
        id: string;
        type: string;
        question: string;
        options?: string[];
        correctAnswer?: string | string[];
        points?: number;
        tolerance?: number;
        keywords?: string[];
        explanation?: string;
      }>)
        .filter((q) => supportedTypes.includes(q.type))
        .map((q) => ({
          id: q.id,
          type: q.type as "multiple_choice" | "true_false" | "fill_blank" | "short_answer" | "essay" | "numeric" | "math_expression" | "match_following",
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          tolerance: q.tolerance,
          keywords: q.keywords,
          explanation: q.explanation,
        }));

      const submissionContent = (submission[0] as { content?: unknown }).content;
      const gradingResult = gradeHomework(
        gradableQuestions.length > 0 ? gradableQuestions : [],
        Array.isArray(submissionContent) ? submissionContent as Array<{ questionId: string; answer: string | string[] }> : [],
        undefined
      );

      updateData.score = gradingResult.totalScore;
    } else {
      // Manual grading
      if (score !== undefined) updateData.score = score;
      if (feedback !== undefined) updateData.feedback = feedback;
    }

    const [updated] = await db.update(homeworkSubmissions)
      .set(updateData)
      .where(eq(homeworkSubmissions.id, submissionId))
      .returning();

    return { submission: updated };
  },
  ['teacher', 'admin']
);
