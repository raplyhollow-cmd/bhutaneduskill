import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { homeworkSubmissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Draft submission data
 */
interface DraftSubmissionValues {
  id: string;
  homeworkId: string;
  studentId: string;
  answers: Record<string, unknown>;
  attachments: unknown[];
  textAnswers: Record<string, string>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/student/homework/[id]/draft - Save or create draft
export const POST = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { id } = await context!.params;

    const { user: currentUser, userId } = auth;

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

      const updateData = {
        answers: (answers || {}) as Record<string, unknown>,
        attachments: (attachments || []) as unknown[],
        textAnswers: (textAnswers || {}) as Record<string, string>,
        updatedAt: now,
      };

      const [updated] = await db.update(homeworkSubmissions)
        .set(updateData)
        .where(eq(homeworkSubmissions.id, existingSubmission.id))
        .returning();

      return NextResponse.json({ submission: updated });
    } else {
      // Create new draft
      const createData: DraftSubmissionValues = {
        id: `sub_${Date.now()}`,
        homeworkId: id,
        studentId: currentUser.id,
        answers: (answers || {}) as Record<string, unknown>,
        attachments: (attachments || []) as unknown[],
        textAnswers: (textAnswers || {}) as Record<string, string>,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };

      const [created] = await db.insert(homeworkSubmissions)
        .values(createData)
        .returning();

      return NextResponse.json({ submission: created }, { status: 201 });
    }
  },
  ['student']
);
