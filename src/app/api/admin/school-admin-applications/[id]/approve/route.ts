import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { neon } from "@neondatabase/serverless";

// POST /api/admin/school-admin-applications/[id]/approve - Approve school admin application
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const params = await context.params;
    const applicationId = params.id;

    const sql = neon(process.env.DATABASE_URL!);

    // Check if application exists and get details
    const applications = await sql`
      SELECT id, user_id, school_id, status
      FROM school_admin_applications
      WHERE id = ${applicationId}
      LIMIT 1
    `;

    if (applications.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = applications[0];

    if (application.status !== "pending_approval") {
      return NextResponse.json({ error: "Application already processed" }, { status: 400 });
    }

    // Update application status using raw SQL
    await sql`
      UPDATE school_admin_applications
      SET status = 'approved',
          reviewed_by = ${userId},
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${applicationId}
    `;

    // Assign school-admin role to the user
    // Get the role ID
    const roleResult = await sql`
      SELECT id FROM roles WHERE slug = 'school-admin' LIMIT 1
    `;

    if (roleResult.length > 0) {
      const roleId = roleResult[0].id;

      // Check if user already has this role
      const existingRole = await sql`
        SELECT id FROM user_roles
        WHERE user_id = ${application.user_id} AND role_id = ${roleId}
        LIMIT 1
      `;

      if (existingRole.length === 0) {
        // Insert the role
        await sql`
          INSERT INTO user_roles (id, user_id, role_id, assigned_by, created_at)
          VALUES (
            ${`ur_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`},
            ${application.user_id},
            ${roleId},
            ${userId},
            NOW()
          )
        `;
      }

      // Update user's onboarding status using raw SQL
      await sql`
        UPDATE users
        SET onboarding_complete = true,
            onboarding_status = 'complete',
            updated_at = NOW()
        WHERE id = ${application.user_id}
      `;
    }

    logger.info("School admin application approved", {
      applicationId,
      userId: application.user_id,
      schoolId: application.school_id,
      reviewedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "School admin application approved successfully",
    });
  } catch (error) {
    console.error("Approve error details:", error);
    logger.apiError(error, {
      route: "/api/admin/school-admin-applications/[id]/approve",
      method: "POST",
    });
    return NextResponse.json({
      error: "Failed to approve application",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PATCH /api/admin/school-admin-applications/[id]/reject - Reject school admin application
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const params = await context.params;
    const applicationId = params.id;
    const body = await request.json();
    const { rejectionReason } = body;

    const sql = neon(process.env.DATABASE_URL!);

    // Check if application exists
    const applications = await sql`
      SELECT id, user_id, status
      FROM school_admin_applications
      WHERE id = ${applicationId}
      LIMIT 1
    `;

    if (applications.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = applications[0];

    if (application.status !== "pending_approval") {
      return NextResponse.json({ error: "Application already processed" }, { status: 400 });
    }

    // Update application status
    await sql`
      UPDATE school_admin_applications
      SET status = 'rejected',
          reviewed_by = ${userId},
          reviewed_at = NOW(),
          rejection_reason = ${rejectionReason || null},
          updated_at = NOW()
      WHERE id = ${applicationId}
    `;

    logger.info("School admin application rejected", {
      applicationId,
      userId: application.user_id,
      rejectionReason,
      reviewedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "School admin application rejected",
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/school-admin-applications/[id]/approve",
      method: "PATCH",
    });
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
  }
}
