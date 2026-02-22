import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schoolAdminApplications } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/school-admin-applications/[id]/verify-payment
 *
 * Verifies payment for a school admin application.
 * Platform admins must verify payment (check bank reference number) before approving applications.
 */
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
    const body = await request.json();
    const { bankReferenceNumber, paymentAmount, paymentDate } = body;

    // Validate required fields
    if (!bankReferenceNumber || !paymentAmount) {
      return NextResponse.json(
        { error: "Bank reference number and payment amount are required" },
        { status: 400 }
      );
    }

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

    // Check if already verified
    if (application.paymentStatus === "paid" && application.paymentVerifiedAt) {
      return NextResponse.json(
        { error: "Payment has already been verified" },
        { status: 400 }
      );
    }

    // Update application with payment verification details
    await db
      .update(schoolAdminApplications)
      .set({
        paymentStatus: "paid",
        bankReferenceNumber,
        paymentAmount: String(paymentAmount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentVerifiedBy: userId,
        paymentVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schoolAdminApplications.id, applicationId));

    logger.info("School admin application payment verified", {
      applicationId,
      userId: application.userId,
      schoolId: application.schoolId,
      verifiedBy: userId,
      bankReferenceNumber,
      paymentAmount,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        paymentStatus: "paid",
        bankReferenceNumber,
        paymentAmount,
        paymentVerifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/school-admin-applications/[id]/verify-payment",
      method: "POST",
    });
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/school-admin-applications/[id]/verify-payment
 *
 * Revokes payment verification (e.g., if verification was done in error).
 */
export async function DELETE(
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

    // Cannot revoke verification if already approved
    if (application.status === "approved") {
      return NextResponse.json(
        { error: "Cannot revoke payment verification for approved application" },
        { status: 400 }
      );
    }

    // Revoke payment verification
    await db
      .update(schoolAdminApplications)
      .set({
        paymentStatus: "pending",
        bankReferenceNumber: null,
        paymentVerifiedBy: null,
        paymentVerifiedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schoolAdminApplications.id, applicationId));

    logger.info("School admin application payment verification revoked", {
      applicationId,
      revokedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verification revoked",
    });
  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/school-admin-applications/[id]/verify-payment",
      method: "DELETE",
    });
    return NextResponse.json({ error: "Failed to revoke payment verification" }, { status: 500 });
  }
}
