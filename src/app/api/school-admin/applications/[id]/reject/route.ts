import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

// POST /api/school-admin/applications/[id]/reject - Reject student/teacher application
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

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
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const applicant = applicants[0];

    // Verify type matches
    if (applicant.type !== type) {
      return NextResponse.json({ error: `Applicant is not a ${type}` }, { status: 400 });
    }

    // Check school access (unless platform admin)
    if (user.type !== 'admin' && applicant.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the user (effectively rejecting them)
    await db.delete(users).where(eq(users.id, applicantId));

    logger.info(`${type} application rejected`, {
      applicantId,
      schoolId: applicant.schoolId,
      rejectedBy: userId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'student' ? 'Student' : 'Teacher'} application rejected`,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/applications/[id]/reject", method: "POST" });
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
  }
}
