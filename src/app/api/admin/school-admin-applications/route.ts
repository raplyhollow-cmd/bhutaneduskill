import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schoolAdminApplications, users, schools } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, desc, and } from "drizzle-orm";

// GET /api/admin/school-admin-applications - List all school admin applications
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending_approval, approved, rejected
    const paymentStatus = searchParams.get("paymentStatus"); // pending, paid, failed

    // Build where conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(schoolAdminApplications.status, status));
    }
    if (paymentStatus) {
      conditions.push(eq(schoolAdminApplications.paymentStatus, paymentStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get applications with user and school details
    const applications = await db
      .select({
        id: schoolAdminApplications.id,
        status: schoolAdminApplications.status,
        paymentStatus: schoolAdminApplications.paymentStatus,
        paymentAmount: schoolAdminApplications.paymentAmount,
        paymentDate: schoolAdminApplications.paymentDate,
        paymentMethod: schoolAdminApplications.paymentMethod,
        paymentReference: schoolAdminApplications.paymentReference,
        paymentVerifiedAt: schoolAdminApplications.paymentVerifiedAt,
        bankReferenceNumber: schoolAdminApplications.bankReferenceNumber,
        appliedAt: schoolAdminApplications.appliedAt,
        reviewedAt: schoolAdminApplications.reviewedAt,
        rejectionReason: schoolAdminApplications.rejectionReason,
        notes: schoolAdminApplications.notes,
        // User details
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        // School details
        schoolId: schools.id,
        schoolName: schools.name,
        schoolCode: schools.code,
      })
      .from(schoolAdminApplications)
      .innerJoin(users, eq(schoolAdminApplications.userId, users.id))
      .innerJoin(schools, eq(schoolAdminApplications.schoolId, schools.id))
      .where(whereClause)
      .orderBy(desc(schoolAdminApplications.appliedAt));

    logger.info("School admin applications listed", { userId, count: applications.length });

    return NextResponse.json({ applications });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/school-admin-applications", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

// PATCH /api/admin/school-admin-applications/[id] - Update application (e.g., verify payment)
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

    const permCheck = await requirePermission(userId, "schools.approve");
    if (permCheck) return permCheck;

    const params = await context.params;
    const applicationId = params.id;
    const body = await request.json();

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

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
    if (body.paymentAmount !== undefined) updateData.paymentAmount = body.paymentAmount;
    if (body.paymentDate) updateData.paymentDate = body.paymentDate;
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
    if (body.paymentReference) updateData.paymentReference = body.paymentReference;

    // Update application
    await db
      .update(schoolAdminApplications)
      .set(updateData)
      .where(eq(schoolAdminApplications.id, applicationId));

    logger.info("School admin application updated", {
      applicationId,
      userId,
      updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Application updated successfully",
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/school-admin-applications/[id]",
      method: "PATCH",
    });
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
