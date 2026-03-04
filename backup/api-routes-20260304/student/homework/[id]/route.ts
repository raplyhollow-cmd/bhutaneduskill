import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { gradeHomework, type Question } from "@/lib/auto-grading";
import { requirePermission } from "@/lib/rbac";
import type { HomeworkQuestionWithAnswer, StudentHomeworkData, DraftAnswer, HomeworkContent } from "@/types";

/**
 * Gradable question for auto-grading
 */
interface GradableQuestion {
  id: string;
  type: string;
  question: string;
  options?: unknown[] | string[];
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
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  title: string;
  description?: string;
  subject?: string;
  isPublished?: boolean;
  dueDate: Date | string;
  questions?: GradableQuestion[] | unknown[];
  maxScore?: number;
  allowLateSubmission?: boolean;
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Homework submission record from database
 */
interface HomeworkSubmissionRecord {
  id: string;
  homeworkId: string;
  studentId: string;
  status: string;
  content?: HomeworkContent;
  score?: number | null;
  feedback?: string | null;
  submittedAt?: Date | string | null;
  gradedAt?: Date | string | null;
  isLate?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: unknown;
}

/**
 * Submission data structure (matches DB schema)
 */
interface SubmissionDataDB {
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
  [key: string]: unknown;
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

      // Use db.select() instead of db.query
      const homeworkRecords = await db
        .select()
        .from(homework)
        .where(eq(homework.id, id))
        .limit(1);

      if (!homeworkRecords || homeworkRecords.length === 0) {
        return errorResponse("Homework not found", 404);
      }

      const homeworkData = homeworkRecords[0] as HomeworkWithTeacher;

      if (!homeworkData) {
        return errorResponse("Homework not found", 404);
      }

      // Get existing submission if any
      const submissionRecords = await db
        .select()
        .from(homeworkSubmissions)
        .where(and(
          eq(homeworkSubmissions.homeworkId, id),
          eq(homeworkSubmissions.studentId, currentUser.id)
        ))
        .limit(1);

      const submission = submissionRecords[0];

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
      const hwData = await db
        .select()
        .from(homework)
        .where(eq(homework.id, id))
        .limit(1);

      if (!hwData || hwData.length === 0) {
        return errorResponse("Homework not found", 404);
      }

      const hwRecord = hwData[0] as HomeworkWithTeacher;

      if (!hwRecord.isPublished) {
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
      const dueDate = new Date(hwRecord.dueDate);
      const isLate = now > dueDate;

      // Auto-grade if questions exist (filter out unsupported question types)
      let gradingResult: GradingResult | null = null;
      if (hwRecord.questions && hwRecord.questions.length > 0) {
        // Only grade questions with supported types
        const supportedTypes = ["multiple_choice", "true_false", "fill_blank", "short_answer", "essay", "numeric", "math_expression", "match_following"];
        const gradableQuestions = hwRecord.questions
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
          // Convert GradableQuestion[] to Question[] for gradeHomework
          const questionsForGrading: Question[] = gradableQuestions.map(q => ({
            id: q.id,
            type: q.type as Question["type"],
            question: q.question,
            options: q.options as string[] | undefined,
            correctAnswer: q.correctAnswer as string | string[] | number,
            points: q.points,
            tolerance: q.tolerance,
            keywords: q.keywords,
            explanation: q.explanation,
          }));

          gradingResult = gradeHomework(
            questionsForGrading,
            answers || [],
            integrityMetadata
          ) as GradingResult;
        }
      }

      // Prepare submission data
      // Prepare submission content
      const content: HomeworkContent = {
        answers: answers || {},
        attachments: attachments || [],
        textAnswers: textAnswers || {},
        integrityMetadata,
      };

      // Add grading results to content if available
      if (gradingResult) {
        (content as Record<string, unknown>).questionFeedback = gradingResult.results;
        (content as Record<string, unknown>).gradingResult = gradingResult;
      }

      const submissionData: SubmissionDataDB = {
        homeworkId: id,
        studentId: currentUser.id,
        submittedAt: now,
        content,
        gradedAt: now,
        score: gradingResult?.totalScore || 0,
        feedback: gradingResult && !gradingResult.needsReview ? "Auto-graded" : "",
        status: gradingResult && !gradingResult.needsReview ? "graded" : "submitted",
        isLate,
        createdAt: now,
        updatedAt: now,
      };

      if (existingSubmission.length > 0) {
        // Update existing draft
        const [updated] = await db
          .update(homeworkSubmissions)
          .set(submissionData as Record<string, unknown>)
          .where(eq(homeworkSubmissions.id, existingSubmission[0].id))
          .returning();

        return successResponse({ submission: updated });
      } else {
        // Create new submission
        const [created] = await db
          .insert(homeworkSubmissions)
          .values({
            id: `sub_${Date.now()}`,
            homeworkId: submissionData.homeworkId,
            studentId: submissionData.studentId,
            submittedAt: submissionData.submittedAt,
            content: submissionData.content,
            gradedAt: submissionData.gradedAt,
            score: submissionData.score,
            feedback: submissionData.feedback,
            status: submissionData.status,
            isLate: submissionData.isLate,
            createdAt: submissionData.createdAt,
            updatedAt: submissionData.updatedAt,
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

      const submission = existingSubmission[0] as HomeworkSubmissionRecord;

      if (submission.status !== "draft") {
        return errorResponse("Cannot update submitted homework", 400);
      }

      const existingContent = (submission.content as HomeworkContent) || {};
      const updatedContent: HomeworkContent = {
        ...existingContent,
        answers: answers || existingContent.answers || {},
        attachments: attachments || existingContent.attachments || [],
        textAnswers: textAnswers || existingContent.textAnswers || {},
      };

      const updatedData = {
        content: updatedContent,
        updatedAt: new Date(),
      };

      const [updated] = await db
        .update(homeworkSubmissions)
        .set(updatedData as Record<string, unknown>)
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
