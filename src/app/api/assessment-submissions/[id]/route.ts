import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { assessmentSubmissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/assessment-submissions/[id] - Update submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { status, /* startedAt, */ completedAt, timeSpent } = body;

    const [updatedSubmission] = await db
      .update(assessmentSubmissions)
      .set({ status, completedAt: new Date(), timeSpent } as any)
      .where(eq(assessmentSubmissions.id, id))
      .returning();

    return NextResponse.json({ submission: updatedSubmission });
  } catch (error) {
    logger.apiError(error, { route: "/api/assessment-submissions/[id]", method: "PATCH" });
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

// GET /api/assessment-submissions/[id] - Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { id } = await params;

    const submission = await db.query.assessmentSubmissions.findFirst({
      where: eq(assessmentSubmissions.id, id),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    logger.apiError(error, { route: "/api/assessment-submissions/[id]", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

// DELETE /api/assessment-submissions/[id] - Delete submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { id } = await params;

    await db.delete(assessmentSubmissions).where(eq(assessmentSubmissions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/api/assessment-submissions/[id]", method: "DELETE" });
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
