import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions, users, homework as homeworkTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { gradeHomework } from "@/lib/auto-grading";

interface Params {
  params: { id: string };
}

// GET /api/student/homework/[id] - Get homework details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, params.id),
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
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Get existing submission if any
    const submission = await db.query.homeworkSubmissions.findFirst({
      where: and(
        eq(homeworkSubmissions.homeworkId, params.id),
        eq(homeworkSubmissions.studentId, currentUser.id)
      ),
    });

    return NextResponse.json({
      homework: homeworkData,
      submission,
    });
  } catch (error) {
    console.error("Homework fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch homework" }, { status: 500 });
  }
}

// POST /api/student/homework/[id] - Submit homework
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, attachments, textAnswers, integrityMetadata } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get homework details
    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, params.id),
    });

    if (!homeworkData) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if (!homeworkData.isPublished) {
      return NextResponse.json({ error: "Homework is not published" }, { status: 400 });
    }

    // Check for existing submission
    const existingSubmission = await db.query.homeworkSubmissions.findFirst({
      where: and(
        eq(homeworkSubmissions.homeworkId, params.id),
        eq(homeworkSubmissions.studentId, currentUser.id)
      ),
    });

    if (existingSubmission && existingSubmission.status !== "draft") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    const now = new Date();
    const dueDate = new Date(homeworkData.dueDate);
    const isLate = now > dueDate;

    // Auto-grade if questions exist
    let gradingResult = null;
    if (homeworkData.questions && homeworkData.questions.length > 0) {
      gradingResult = gradeHomework(
        homeworkData.questions,
        answers || [],
        integrityMetadata
      );
    }

    // Prepare submission data
    const submissionData: any = {
      homeworkId: params.id,
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
        submissionData.gradedBy = homeworkData.teacherId;
        submissionData.gradedAt = now;
        submissionData.feedback = "Auto-graded";
        submissionData.questionFeedback = gradingResult.results;
      }
    }

    if (existingSubmission) {
      // Update existing draft
      const [updated] = await db.update(homeworkSubmissions)
        .set(submissionData)
        .where(eq(homeworkSubmissions.id, existingSubmission.id))
        .returning();

      return NextResponse.json({ submission: updated });
    } else {
      // Create new submission
      const [created] = await db.insert(homeworkSubmissions)
        .values({
          id: `sub_${Date.now()}`,
          ...submissionData,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return NextResponse.json({ submission: created, gradingResult }, { status: 201 });
    }
  } catch (error) {
    console.error("Homework submission error:", error);
    return NextResponse.json({ error: "Failed to submit homework" }, { status: 500 });
  }
}

// PUT /api/student/homework/[id] - Update draft
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, attachments, textAnswers } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find existing draft submission
    const existingSubmission = await db.query.homeworkSubmissions.findFirst({
      where: and(
        eq(homeworkSubmissions.homeworkId, params.id),
        eq(homeworkSubmissions.studentId, currentUser.id)
      ),
    });

    if (!existingSubmission) {
      return NextResponse.json({ error: "No draft found" }, { status: 404 });
    }

    if (existingSubmission.status !== "draft") {
      return NextResponse.json({ error: "Cannot update submitted homework" }, { status: 400 });
    }

    const [updated] = await db.update(homeworkSubmissions)
      .set({
        answers: answers || existingSubmission.answers,
        attachments: attachments || existingSubmission.attachments,
        textAnswers: textAnswers || existingSubmission.textAnswers,
        updatedAt: new Date(),
      })
      .where(eq(homeworkSubmissions.id, existingSubmission.id))
      .returning();

    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error("Draft update error:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}
