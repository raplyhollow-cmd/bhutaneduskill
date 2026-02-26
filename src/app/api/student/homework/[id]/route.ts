import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { gradeHomework } from "@/lib/auto-grading";
import type { HomeworkQuestionWithAnswer, StudentHomeworkData, DraftAnswer } from "@/types";

/**
 * Gradable question for auto-grading
 */
interface GradableQuestion {
  id: string;
  type: string;
  question: string;
  options: unknown[];
  correctAnswer: unknown;
  points: number;
  tolerance?: number;
  keywords?: string[];
  explanation?: string;
}

/**
 * Grading result from auto-grading system
 */
interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  needsReview: boolean;
  results?: unknown[];
}

/**
 * Homework with teacher information
 */
interface HomeworkWithTeacher {
  id: string;
  teacherId: string;
  title: string;
  isPublished: boolean;
  dueDate: Date | string;
  questions?: GradableQuestion[];
  [key: string]: unknown;
}

/**
 * Submission data structure
 */
interface SubmissionData {
  homeworkId: string;
  studentId: string;
  answers: Record<string, unknown>;
  attachments: unknown[];
  textAnswers: Record<string, string>;
  isLate: boolean;
  submittedAt: Date;
  status: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  gradedBy?: string;
  gradedAt?: Date;
  feedback?: string;
  questionFeedback?: unknown[];
}

// GET /api/student/homework/[id] - Get homework details
export const GET = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context!.params;
      const { user: currentUser, userId } = auth;

      // Check homework.read permission
      const permCheck = await requirePermission(userId, "homework.read");
      if (permCheck) return permCheck;

      const homeworkData = await db.query.homework.findFirst({
        where: eq(homework.id, id),
        with: {
          class: true,
          subject: true,
          teacher: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!homeworkData) {
        return errorResponse("Homework not found", 404);
      }

      // Get existing submission if any
      const submission = await db.query.homeworkSubmissions.findFirst({
        where: and(
          eq(homeworkSubmissions.homeworkId, id),
          eq(homeworkSubmissions.studentId, currentUser.id)
        ),
      });

      return successResponse({
        homework: homeworkData,
        submission,
      });
    } catch (error) {
      logger.error("Homework retrieval error:", error);
      return errorResponse("Failed to retrieve homework", 500);
    }
  },
  ['student']
);

// POST /api/student/homework/[id] - Submit homework
export const POST = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context!.params;
      const { user: currentUser, userId } = auth;

      // Check homework.submit permission (students can submit their homework)
      // Note: We use homework.read permission for submission as it's part of the homework workflow
      const permCheck = await requirePermission(userId, "homework.read");
      if (permCheck) return permCheck;

      const body = await request.json();
      const { answers, attachments, textAnswers, integrityMetadata } = body;

      // Get homework details using db.select() instead of db.query
      const homeworkData = await db
        .select()
        .from(homework)
        .where(eq(homework.id, id))
        .limit(1) as HomeworkWithTeacher[] | null;

      if (!homeworkData || homeworkData.length === 0) {
        return errorResponse("Homework not found", 404);
      }

      const homework = homeworkData[0];

      if (!homework.isPublished) {
        return errorResponse("Homework is not published", 400);
      }

      // Check for existing submission
      const existingSubmission = await db
        .select()
        .from(homeworkSubmissions)
        .where(and(
          eq(homeworkSubmissions.homeworkId, id),
          eq(homeworkSubmissions.studentId, currentUser.id)
        ))
        .limit(1);

      if (existingSubmission.length > 0 && existingSubmission[0].status !== "draft") {
        return errorResponse("Already submitted", 400);
      }

      const now = new Date();
      const dueDate = new Date(homework.dueDate);
      const isLate = now > dueDate;

      // Auto-grade if questions exist (filter out unsupported question types)
      let gradingResult: GradingResult | null = null;
      if (homework.questions && homework.questions.length > 0) {
        // Only grade questions with supported types
        const supportedTypes = ["multiple_choice", "true_false", "fill_blank", "short_answer", "essay", "numeric", "math_expression", "match_following"];
        const gradableQuestions = homework.questions
          .filter((q: { type: string }) => supportedTypes.includes(q.type))
          .map((q: GradableQuestion) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            tolerance: q.tolerance,
            keywords: q.keywords,
            explanation: q.explanation,
          }));

        if (gradableQuestions.length > 0) {
          gradingResult = gradeHomework(
            gradableQuestions,
            answers || [],
            integrityMetadata
          ) as GradingResult;
        }
      }

      // Prepare submission data
      const submissionData: SubmissionData = {
        homeworkId: id,
        studentId: currentUser.id,
        answers: answers || {},
        attachments: attachments || [],
        textAnswers,
        isLate,
        submittedAt: now,
        status: "submitted",
      };

      // Add grading results if available
      if (gradingResult) {
        submissionData.score = gradingResult.totalScore;
        submissionData.maxScore = gradingResult.maxScore;
        submissionData.percentage = gradingResult.percentage;

        // If no manual review needed, auto-grade
        if (!gradingResult.needsReview) {
          submissionData.status = "graded";
          submissionData.gradedBy = homework.teacherId;
          submissionData.gradedAt = now;
          submissionData.feedback = "Auto-graded";
          submissionData.questionFeedback = gradingResult.results;
        }
      }

      if (existingSubmission.length > 0) {
        // Update existing draft
        const [updated] = await db
          .update(homeworkSubmissions)
          .set(submissionData)
          .where(eq(homeworkSubmissions.id, existingSubmission[0].id))
          .returning();

        return successResponse({ submission: updated });
      } else {
        // Create new submission
        const [created] = await db
          .insert(homeworkSubmissions)
          .values({
            id: `sub_${Date.now()}`,
            ...submissionData,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        return successResponse({ submission: created, gradingResult }, 201);
      }
    } catch (error) {
      logger.error("Homework submission error:", error);
      return errorResponse("Failed to submit homework", 500);
    }
  },
  ['student']
);

// PUT /api/student/homework/[id] - Update draft
export const PUT = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context!.params;
      const { user: currentUser, userId } = auth;

      // Check homework.read permission (for updating draft)
      const permCheck = await requirePermission(userId, "homework.read");
      if (permCheck) return permCheck;

      const body = await request.json();
      const { answers, attachments, textAnswers } = body;

      // Find existing draft submission using db.select()
      const existingSubmission = await db
        .select()
        .from(homeworkSubmissions)
        .where(and(
          eq(homeworkSubmissions.homeworkId, id),
          eq(homeworkSubmissions.studentId, currentUser.id)
        ))
        .limit(1);

      if (existingSubmission.length === 0) {
        return errorResponse("No draft found", 404);
      }

      const submission = existingSubmission[0];

      if (submission.status !== "draft") {
        return errorResponse("Cannot update submitted homework", 400);
      }

      const updatedData = {
        answers: answers || (submission.answers as Record<string, unknown>),
        attachments: attachments || (submission.attachments as unknown[]),
        textAnswers: textAnswers || (submission.textAnswers as Record<string, string>),
        updatedAt: new Date(),
      };

      const [updated] = await db
        .update(homeworkSubmissions)
        .set(updatedData)
        .where(eq(homeworkSubmissions.id, submission.id))
        .returning();

      return successResponse({ submission: updated });
    } catch (error) {
      logger.error("Draft update error:", error);
      return errorResponse("Failed to update draft", 500);
    }
  },
  ['student']
);
