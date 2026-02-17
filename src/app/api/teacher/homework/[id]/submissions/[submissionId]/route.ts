import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { gradeHomework, AutoGradingEngine } from "@/lib/auto-grading";

interface Params {
  params: Promise<{ id: string; submissionId: string }>;
}

// GET /api/teacher/homework/[id]/submissions/[submissionId] - Get submission details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id, submissionId } = await params;

    const authResult = await requireAuth(['teacher', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.read permission (for viewing submission details)
    const permCheck = await requirePermission(userId, "homework.read");
    if (permCheck) return permCheck;

    // Verify homework ownership
    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!homeworkData || (homeworkData as { teacherId?: string }).teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submission = await db.query.homeworkSubmissions.findFirst({
      where: eq(homeworkSubmissions.id, submissionId),
      with: {
        student: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    logger.error("Submission fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

// PUT /api/teacher/homework/[id]/submissions/[submissionId] - Grade submission
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id, submissionId } = await params;

    const authResult = await requireAuth(['teacher', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.update permission (for grading submissions)
    const permCheck = await requirePermission(userId, "homework.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { score, maxScore, feedback, questionFeedback, autoGrade } = body;

    // Verify homework ownership
    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!homeworkData || (homeworkData as { teacherId?: string }).teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submission = await db.query.homeworkSubmissions.findFirst({
      where: eq(homeworkSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      status: string;
      gradedBy: string;
      gradedAt: Date;
      updatedAt: Date;
      score?: number;
      maxScore?: number;
      percentage?: number;
      feedback?: string;
      questionFeedback?: unknown;
    } = {
      status: "graded",
      gradedBy: currentUser.id,
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
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          tolerance: q.tolerance,
          keywords: q.keywords,
          explanation: q.explanation,
        }));

      const submissionAnswers = (submission as { answers?: unknown }).answers;
      const gradingResult = gradeHomework(
        gradableQuestions.length > 0 ? (gradableQuestions as any) : [],
        Array.isArray(submissionAnswers) ? submissionAnswers : [],
        undefined
      );

      updateData.score = gradingResult.totalScore;
      updateData.maxScore = gradingResult.maxScore;
      updateData.percentage = gradingResult.percentage;
      updateData.questionFeedback = gradingResult.results;
    } else {
      // Manual grading
      if (score !== undefined) updateData.score = score;
      if (maxScore !== undefined) updateData.maxScore = maxScore;
      if (score !== undefined && maxScore !== undefined) {
        updateData.percentage = Math.round((score / maxScore) * 100);
      }
      if (feedback !== undefined) updateData.feedback = feedback;
      if (questionFeedback !== undefined) updateData.questionFeedback = questionFeedback;
    }

    const [updated] = await db.update(homeworkSubmissions)
      .set(updateData)
      .where(eq(homeworkSubmissions.id, submissionId))
      .returning();

    return NextResponse.json({ submission: updated });
  } catch (error) {
    logger.error("Grading error:", error);
    return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 });
  }
}
