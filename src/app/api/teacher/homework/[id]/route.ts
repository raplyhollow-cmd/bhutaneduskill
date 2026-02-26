import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute, successResponse, errorResponse } from "@/lib/api/route-handler";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Homework record with teacher ownership
 */
interface HomeworkWithTeacher {
  id: string;
  teacherId: string;
  title: string;
  [key: string]: unknown;
}

/**
 * Homework statistics
 */
interface HomeworkStats {
  total: number;
  submitted: number;
  graded: number;
  pending: number;
}

// GET /api/teacher/homework/[id] - Get homework details
export const GET = createApiRoute(
  async (request, auth, context?: Params) => {
    const { user } = auth;
    const resolvedParams = await context!.params;
    const id = resolvedParams.id;

    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, id),
      with: {
        class: true,
        subject: true,
      },
    });

    if (!homeworkData) {
      return errorResponse("Homework not found", 404);
    }

    // Verify ownership
    if ((homeworkData as HomeworkWithTeacher).teacherId !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    // Get submission stats
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.homeworkId, id),
    });

    const stats: HomeworkStats = {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === "submitted").length,
      graded: submissions.filter(s => s.status === "graded").length,
      pending: submissions.filter(s => s.status === "draft").length,
    };

    return successResponse({ homework: homeworkData, stats });
  },
  ['teacher', 'admin']
);

// PATCH /api/teacher/homework/[id] - Update homework
export const PATCH = createApiRoute(
  async (request, auth, context?: Params) => {
    const { user } = auth;
    const resolvedParams = await context!.params;
    const id = resolvedParams.id;
    const body = await request.json();

    const { title, description, instructions, questions, attachments, externalLinks, dueDate, lateSubmissionDeadline, maxPoints, passingPoints, timeLimit, attemptsAllowed, showAnswersAfter } = body;

    // Verify ownership
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!existingHomework) {
      return errorResponse("Homework not found", 404);
    }

    if ((existingHomework as any).teacherId !== user.id) {
      return errorResponse("Forbidden", 403);
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

    return successResponse({ homework: updatedHomework });
  },
  ['teacher', 'admin']
);

// DELETE /api/teacher/homework/[id] - Delete homework
export const DELETE = createApiRoute(
  async (request, auth, context?: Params) => {
    const { user } = auth;
    const resolvedParams = await context!.params;
    const id = resolvedParams.id;

    // Verify ownership
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!existingHomework) {
      return errorResponse("Homework not found", 404);
    }

    if ((existingHomework as HomeworkWithTeacher).teacherId !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    // Check if there are submissions
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.homeworkId, id),
    });

    if (submissions.length > 0) {
      return errorResponse("Cannot delete homework with submissions", 400);
    }

    await db.delete(homework).where(eq(homework.id, id));
    return successResponse({ success: true });
  },
  ['teacher', 'admin']
);

// POST /api/teacher/homework/[id] - Publish homework
export const POST = createApiRoute(
  async (request, auth, context?: Params) => {
    const { user } = auth;
    const resolvedParams = await context!.params;
    const id = resolvedParams.id;
    const body = await request.json();

    const { action } = body;

    // Verify ownership
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, id),
    });

    if (!existingHomework) {
      return errorResponse("Homework not found", 404);
    }

    if ((existingHomework as HomeworkWithTeacher).teacherId !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    if (action === "publish") {
      const [publishedHomework] = await db.update(homework)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(eq(homework.id, id))
        .returning();
      return successResponse({ homework: publishedHomework });
    }

    if (action === "unpublish") {
      const [unpublishedHomework] = await db.update(homework)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(eq(homework.id, id))
        .returning();
      return successResponse({ homework: unpublishedHomework });
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
      return successResponse({ homework: duplicatedHomework });
    }

    return errorResponse("Invalid action", 400);
  },
  ['teacher', 'admin']
);