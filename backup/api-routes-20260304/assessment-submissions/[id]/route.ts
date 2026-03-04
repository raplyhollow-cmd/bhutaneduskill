/**
 * Assessment Submissions API
 *
 * GET /api/assessment-submissions/[id] - Get single submission
 * PATCH /api/assessment-submissions/[id] - Update submission
 * DELETE /api/assessment-submissions/[id] - Delete submission
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { assessmentSubmissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/assessment-submissions/[id] - Get single submission
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const submissionResult = await db
      .select()
      .from(assessmentSubmissions)
      .where(eq(assessmentSubmissions.id, id))
      .limit(1);
    const submission = submissionResult[0];

    if (!submission) {
      return notFoundResponse("Submission");
    }

    return successResponse({ submission });
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

// ============================================================================
// PATCH /api/assessment-submissions/[id] - Update submission
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await req.json();
    const { status, completedAt, timeSpent } = body;

    const updateData: {
      status: string;
      completedAt: Date;
      timeSpent?: number;
    } = {
      status,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    };

    if (timeSpent !== undefined) {
      updateData.timeSpent = timeSpent;
    }

    const [updatedSubmission] = await db
      .update(assessmentSubmissions)
      .set(updateData)
      .where(eq(assessmentSubmissions.id, id))
      .returning();

    logger.info("Assessment submission updated", { submissionId: id });

    return successResponse({ submission: updatedSubmission });
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

// ============================================================================
// DELETE /api/assessment-submissions/[id] - Delete submission
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    await db.delete(assessmentSubmissions).where(eq(assessmentSubmissions.id, id));

    logger.info("Assessment submission deleted", { submissionId: id });

    return successResponse({ success: true });
  },
  ['admin']
);
