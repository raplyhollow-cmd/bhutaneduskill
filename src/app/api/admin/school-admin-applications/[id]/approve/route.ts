import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schoolAdminApplications, users, schools, userRoles, roles } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";

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

    // Check schools.approve permission
    const permCheck = await requirePermission(userId, "schools.approve");
    if (permCheck) return permCheck;

    const params = await context.params;
    const applicationId = params.id;

    // Get the application
    const applications = await db
      .select()
      .from(schoolAdminApplications)
      .where(eq(schoolAdminApplications.id, applicationId))
      .limit(1);

    if (applications.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = applications[0];

    if (application.status !== "pending_approval") {
      return NextResponse.json({ error: "Application already processed" }, { status: 400 });
    }

    if (application.paymentStatus !== "paid") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    // Update application status
    await db
      .update(schoolAdminApplications)
      .set({
        status: "approved",
        reviewedBy: userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schoolAdminApplications.id, applicationId));

    // Assign school-admin role to the user
    // First get the role ID
    const roleData = await db
      .select()
      .from(roles)
      .where(eq(roles.slug, "school-admin"))
      .limit(1);

    if (roleData.length > 0) {
      // Check if user already has this role
      const existingRole = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, application.userId),
            eq(userRoles.roleId, roleData[0].id)
          )
        )
        .limit(1);

      if (existingRole.length === 0) {
        await db.insert(userRoles).values({
          id: `ur_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId: application.userId,
          roleId: roleData[0].id,
          assignedBy: userId,
          createdAt: new Date(),
        });
      }
    }

    // Update user's onboarding status
    await db
      .update(users)
      .set({
        onboardingComplete: true,
        onboardingStatus: "complete",
      })
      .where(eq(users.id, application.userId));

    logger.info("School admin application approved", {
      applicationId,
      userId: application.userId,
      schoolId: application.schoolId,
      reviewedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "School admin application approved successfully",
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/school-admin-applications/[id]/approve",
      method: "POST",
    });
    return NextResponse.json({ error: "Failed to approve application" }, { status: 500 });
  }
}

// POST /api/admin/school-admin-applications/[id]/reject - Reject school admin application
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

    // Check schools.approve permission
    const permCheck = await requirePermission(userId, "schools.approve");
    if (permCheck) return permCheck;

    const params = await context.params;
    const applicationId = params.id;
    const body = await request.json();
    const { rejectionReason } = body;

    // Get the application
    const applications = await db
      .select()
      .from(schoolAdminApplications)
      .where(eq(schoolAdminApplications.id, applicationId))
      .limit(1);

    if (applications.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = applications[0];

    if (application.status !== "pending_approval") {
      return NextResponse.json({ error: "Application already processed" }, { status: 400 });
    }

    // Update application status
    await db
      .update(schoolAdminApplications)
      .set({
        status: "rejected",
        reviewedBy: userId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason || null,
        updatedAt: new Date(),
      })
      .where(eq(schoolAdminApplications.id, applicationId));

    logger.info("School admin application rejected", {
      applicationId,
      userId: application.userId,
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
