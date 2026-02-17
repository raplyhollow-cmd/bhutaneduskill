import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/homework/[id] - Get homework details
export async function GET(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['teacher', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.read permission
    const permCheck = await requirePermission(userId, "homework.read");
    if (permCheck) return permCheck;

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
    logger.error(error, { route: "/api/teacher/homework/[id]", method: "GET", id });
    return NextResponse.json({ error: "Failed to fetch homework" }, { status: 500 });
  }
}

// PUT /api/teacher/homework/[id] - Update homework
export async function PUT(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['teacher', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.update permission
    const permCheck = await requirePermission(userId, "homework.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { title, description, instructions, questions, attachments, externalLinks, dueDate, lateSubmissionDeadline, maxPoints, passingPoints, timeLimit, attemptsAllowed, showAnswersAfter } = body;

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
    logger.error(error, { route: "/api/teacher/homework/[id]", method: "PUT", id });
    return NextResponse.json({ error: "Failed to update homework" }, { status: 500 });
  }
}

// DELETE /api/teacher/homework/[id] - Delete homework
export async function DELETE(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['teacher', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.delete permission
    const permCheck = await requirePermission(userId, "homework.delete");
    if (permCheck) return permCheck;

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
    logger.error(error, { route: "/api/teacher/homework/[id]", method: "DELETE", id });
    return NextResponse.json({ error: "Failed to delete homework" }, { status: 500 });
  }
}

// POST /api/teacher/homework/[id] - Publish homework
export async function POST(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const authResult = await requireAuth(['teacher', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.update permission (for publish/unpublish actions)
    const permCheck = await requirePermission(userId, "homework.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { action } = body;

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
    logger.error(error, { route: "/api/teacher/homework/[id]", method: "POST", id });
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
