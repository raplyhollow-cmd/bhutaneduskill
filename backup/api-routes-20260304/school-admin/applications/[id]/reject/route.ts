/**
 * SCHOOL ADMIN APPLICATION REJECT API
 *
 * POST /api/school-admin/applications/[id]/reject - Reject student/teacher application
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/lib/api/response-helpers";

// POST /api/school-admin/applications/[id]/reject - Reject student/teacher application
export const POST = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;

    const params = await context.params;
    const applicantId = params.id;
    const body = await request.json();
    const { type, reason } = body;

    // Check permission
    const permission = type === 'student' ? 'students.approve' : 'teachers.approve';
    const permCheck = await requirePermission(userId, permission);
    if (permCheck) return permCheck;

    // Get the applicant
    const applicants = await db
      .select()
      .from(users)
      .where(eq(users.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return notFoundResponse("Applicant");
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return badRequestResponse(`Applicant is not a ${type}`);
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return forbiddenResponse("Access denied");
    }

    // Delete the user (effectively rejecting them)
    await db.delete(users).where(eq(users.id, applicantId));

    logger.info(`${type} application rejected`, {
      applicantId,
      schoolId: applicant.schoolId,
      rejectedBy: userId,
      reason,
    });

    return successResponse({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application rejected`,
    });
  },
  ['school-admin', 'admin']
);
