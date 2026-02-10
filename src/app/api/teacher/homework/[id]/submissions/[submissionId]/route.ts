import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { gradeHomework, AutoGradingEngine } from "@/lib/auto-grading";

interface Params {
  params: Promise<{ id: string; submissionId: string }>;
}

// GET /api/teacher/homework/[id]/submissions/[submissionId] - Get submission details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify homework ownership
    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!homeworkData || homeworkData.teacherId !== currentUser.id) {
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
    console.error("Submission fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

// PUT /api/teacher/homework/[id]/submissions/[submissionId] - Grade submission
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { score, maxScore, feedback, questionFeedback, autoGrade } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify homework ownership
    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!homeworkData || homeworkData.teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submission = await db.query.homeworkSubmissions.findFirst({
      where: eq(homeworkSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status: "graded",
      gradedBy: currentUser.id,
      gradedAt: new Date(),
      updatedAt: new Date(),
    };

    if (autoGrade && homeworkData.questions) {
      // Auto-grade using the auto-grading engine
      const gradingResult = gradeHomework(
        homeworkData.questions,
        submission.answers || [],
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
    console.error("Grading error:", error);
    return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 });
  }
}
