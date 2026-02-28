/**
 * STUDENT HOMEWORK FEEDBACK API
 * Fetch graded homework submission with detailed question-by-question feedback
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions, subjects, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import type { HomeworkContent } from "@/types";

interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface HomeworkQuestion {
  id: string;
  type: string;
  question: string;
  points: number;
  options?: QuestionOption[];
  correctAnswer: string | string[] | boolean | Record<string, unknown>;
  explanation?: string;
}

interface QuestionFeedback {
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback?: string;
  confidence?: number;
  reasoning?: string;
}

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Calculate grade based on percentage
 */
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "D";
}

/**
 * Format student answer based on question type
 */
function formatStudentAnswer(answer: unknown, questionType: string): string | undefined {
  if (answer === undefined || answer === null) return undefined;

  switch (questionType) {
    case "multiple_choice":
    case "true_false":
      return String(answer);
    case "match_following":
      return JSON.stringify(answer);
    default:
      return String(answer);
  }
}

/**
 * Format correct answer based on question type
 */
function formatCorrectAnswer(answer: unknown, questionType: string): string | undefined {
  if (answer === undefined || answer === null) return undefined;

  switch (questionType) {
    case "multiple_choice":
      return Array.isArray(answer) ? answer.join(", ") : String(answer);
    case "true_false":
      return answer === true ? "True" : answer === false ? "False" : String(answer);
    case "match_following":
      return JSON.stringify(answer);
    default:
      return String(answer);
  }
}

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/student/homework/[id]/feedback
export const GET = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;

    const { id: homeworkId } = await context!.params;

    // Fetch homework with submission and subject
    const submissionData = await db
      .select({
        // Homework fields
        homeworkId: homework.id,
        homeworkTitle: homework.title,
        homeworkDescription: homework.description,
        dueDate: homework.dueDate,
        totalPoints: homework.totalPoints,
        passingScore: homework.passingScore,
        questions: homework.questions,

        // Subject
        subjectId: homework.subjectId,
        subjectName: subjects.name,

        // Submission fields
        submissionId: homeworkSubmissions.id,
        submittedAt: homeworkSubmissions.submittedAt,
        gradedAt: homeworkSubmissions.gradedAt,
        score: homeworkSubmissions.score,
        feedback: homeworkSubmissions.feedback,
        status: homeworkSubmissions.status,
        isLate: homeworkSubmissions.isLate,
        content: homeworkSubmissions.content,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .leftJoin(subjects, eq(homework.subjectId, subjects.id))
      .where(
        and(
          eq(homeworkSubmissions.homeworkId, homeworkId),
          eq(homeworkSubmissions.studentId, userId)
        )
      )
      .limit(1);

    if (!submissionData || submissionData.length === 0) {
      return NextResponse.json(
        { error: "Homework submission not found" },
        { status: 404 }
      );
    }

    const homeworkRecord = submissionData[0];

    // Check if graded
    if (homeworkRecord.status !== "graded") {
      return NextResponse.json(
        { error: "Homework has not been graded yet", isGraded: false },
        { status: 400 }
      );
    }

    // Parse content for answers and feedback
    const content = homeworkRecord.content as unknown as HomeworkContent;

    // Parse questions
    const questions = (homeworkRecord.questions as unknown as HomeworkQuestion[]) || [];

    // Merge questions with feedback
    const questionsWithFeedback = questions.map((q: HomeworkQuestion) => {
      const feedback = (content as { questionFeedback?: QuestionFeedback[] }).questionFeedback?.find((f: QuestionFeedback) => f.questionId === q.id);
      const studentAnswer = content.answers?.[q.id];

      return {
        id: q.id,
        type: q.type,
        question: q.question,
        points: q.points,
        earnedPoints: feedback?.score || 0,
        studentAnswer: formatStudentAnswer(studentAnswer, q.type),
        correctAnswer: formatCorrectAnswer(q.correctAnswer, q.type),
        explanation: q.explanation,
        teacherFeedback: feedback?.feedback,
        options: q.options,
      };
    });

    // Calculate percentage and grade
    const earnedPoints = homeworkRecord.score || 0;
    const totalPoints = homeworkRecord.totalPoints || 1;
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const grade = calculateGrade(percentage);

    // Get time spent from integrity metadata
    const metadata = content.integrityMetadata as { timeSpent?: number } | undefined;
    const timeSpent = metadata?.timeSpent || 0;

    // Fetch teacher name if gradedBy exists
    let teacherName: string | undefined;
    const gradedById = content.gradedBy as string | undefined;
    if (gradedById) {
      const teachers = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, gradedById))
        .limit(1);
      teacherName = teachers[0]?.name;
    }

    const data = {
      // Homework info
      id: homeworkRecord.homeworkId,
      title: homeworkRecord.homeworkTitle,
      description: homeworkRecord.homeworkDescription,
      subject: homeworkRecord.subjectName || "N/A",
      dueDate: homeworkRecord.dueDate,
      totalPoints: homeworkRecord.totalPoints,

      // Submission info
      submittedDate: homeworkRecord.submittedAt?.toISOString() || "",
      gradedDate: homeworkRecord.gradedAt?.toISOString() || "",
      earnedPoints,
      percentage,
      grade,
      status: homeworkRecord.status,
      isLate: homeworkRecord.isLate || false,
      timeSpent,

      // Teacher info
      teacherName: teacherName || "Teacher",
      overallFeedback: homeworkRecord.feedback || "",

      // Questions with feedback
      questions: questionsWithFeedback,
    };

    logger.info("Homework feedback fetched", {
      homeworkId,
      userId,
      grade,
      percentage,
    });

    return successResponse(data);
  },
  ["student"]
);
