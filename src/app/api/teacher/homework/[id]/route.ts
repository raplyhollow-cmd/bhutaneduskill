import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { homework, users, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/homework/[id] - Get homework details
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

    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, id),
      with: {
        class: true,
        subject: true,
      },
    });

    if (!homeworkData) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Verify ownership
    if ((homeworkData as any).teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get submission stats
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.homeworkId, id),
    });

    const stats = {
      total: 0,
      submitted: submissions.filter(s => s.status === "submitted").length,
      graded: submissions.filter(s => s.status === "graded").length,
      pending: submissions.filter(s => s.status === "submitted").length,
    };

    return NextResponse.json({ homework: homeworkData, stats });
  } catch (error) {
    console.error("Homework fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch homework" }, { status: 500 });
  }
}

// PUT /api/teacher/homework/[id] - Update homework
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, instructions, questions, attachments, externalLinks, dueDate, lateSubmissionDeadline, maxPoints, passingPoints, timeLimit, attemptsAllowed, showAnswersAfter } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify ownership
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!existingHomework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if ((existingHomework as any).teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedHomework] = await db.update(homework)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(questions !== undefined && { questions }),
        ...(attachments !== undefined && { attachments }),
        ...(externalLinks !== undefined && { externalLinks }),
        ...(dueDate !== undefined && { dueDate }),
        ...(lateSubmissionDeadline !== undefined && { lateSubmissionDeadline }),
        ...(maxPoints !== undefined && { maxPoints }),
        ...(passingPoints !== undefined && { passingPoints }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(attemptsAllowed !== undefined && { attemptsAllowed }),
        ...(showAnswersAfter !== undefined && { showAnswersAfter }),
        updatedAt: new Date(),
      })
      .where(eq(homework.id, id))
      .returning();

    return NextResponse.json({ homework: updatedHomework });
  } catch (error) {
    console.error("Homework update error:", error);
    return NextResponse.json({ error: "Failed to update homework" }, { status: 500 });
  }
}

// DELETE /api/teacher/homework/[id] - Delete homework
export async function DELETE(request: NextRequest, { params }: Params) {
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

    // Verify ownership
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!existingHomework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if ((existingHomework as any).teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if there are submissions
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.homeworkId, id),
    });

    if (submissions.length > 0) {
      return NextResponse.json({ error: "Cannot delete homework with submissions" }, { status: 400 });
    }

    await db.delete(homework).where(eq(homework.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Homework delete error:", error);
    return NextResponse.json({ error: "Failed to delete homework" }, { status: 500 });
  }
}

// POST /api/teacher/homework/[id] - Publish homework
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify ownership
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!existingHomework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if ((existingHomework as any).teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "publish") {
      const [publishedHomework] = await db.update(homework)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(eq(homework.id, id))
        .returning();

      return NextResponse.json({ homework: publishedHomework });
    }

    if (action === "unpublish") {
      const [unpublishedHomework] = await db.update(homework)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(eq(homework.id, id))
        .returning();

      return NextResponse.json({ homework: unpublishedHomework });
    }

    if (action === "duplicate") {
      const [duplicatedHomework] = await db.insert(homework)
        .values({
          ...existingHomework,
          id: `hw_${Date.now()}`,
          title: `${existingHomework.title} (Copy)`,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({ homework: duplicatedHomework }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Homework action error:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
