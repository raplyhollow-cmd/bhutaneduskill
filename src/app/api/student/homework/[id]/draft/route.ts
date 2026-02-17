import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homeworkSubmissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/student/homework/[id]/draft - Save or create draft
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check homework.read permission (for saving draft)
    const permCheck = await requirePermission(userId, "homework.read");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { answers, attachments, textAnswers } = body;

    // Check for existing submission
    const existingSubmission = await db.query.homeworkSubmissions.findFirst({
      where: and(
        eq(homeworkSubmissions.homeworkId, id),
        eq(homeworkSubmissions.studentId, currentUser.id)
      ),
    });

    const now = new Date();

    if (existingSubmission) {
      // Update existing draft
      if (existingSubmission.status !== "draft") {
        return NextResponse.json({ error: "Cannot update submitted homework" }, { status: 400 });
      }

      const [updated] = await db.update(homeworkSubmissions)
        .set({
          answers: (answers || {}) as any,
          attachments: (attachments || []) as any,
          textAnswers: textAnswers as any,
          updatedAt: now,
        } as any)
        .where(eq(homeworkSubmissions.id, existingSubmission.id))
        .returning();

      return NextResponse.json({ submission: updated });
    } else {
      // Create new draft
      const [created] = await db.insert(homeworkSubmissions)
        .values({
          id: `sub_${Date.now()}`,
          homeworkId: id,
          studentId: currentUser.id,
          answers: (answers || {}) as any,
          attachments: (attachments || []) as any,
          textAnswers: textAnswers as any,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        } as any)
        .returning();

      return NextResponse.json({ submission: created }, { status: 201 });
    }
  } catch (error) {
    logger.error("Draft save error:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
