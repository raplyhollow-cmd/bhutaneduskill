import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { schoolAdminApplications } from "@/lib/db/schema";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/school-admin-applications/[id]/verify-payment
 *
 * Verifies payment for a school admin application.
 * Platform admins must verify payment (check bank reference number) before approving applications.
 */
export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    // Check schools.approve permission
    const permCheck = await requirePermission(userId, "schools.approve");
    if (permCheck) return permCheck;

    const params = await context?.params || Promise.resolve({ id: "" });
    const applicationId = (await params).id;
    const body = await req.json();
    const { bankReferenceNumber, paymentAmount, paymentDate } = body;

    // Validate required fields
    if (!bankReferenceNumber || !paymentAmount) {
      return { error: "Bank reference number and payment amount are required", status: 400 };
    }

    // Get the application
    const applications = await db
      .select()
      .from(schoolAdminApplications)
      .where(eq(schoolAdminApplications.id, applicationId))
      .limit(1);

    if (applications.length === 0) {
      return { error: "Application not found", status: 404 };
    }

    const application = applications[0];

    // Check if already verified
    if (application.paymentStatus === "paid" && application.paymentVerifiedAt) {
      return { error: "Payment has already been verified", status: 400 };
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

    return {
      success: true,
      message: "Payment verified successfully",
      data: {
        paymentStatus: "paid",
        bankReferenceNumber,
        paymentAmount,
        paymentVerifiedAt: new Date().toISOString(),
      },
    };
  },
  ["admin"]
);

/**
 * DELETE /api/admin/school-admin-applications/[id]/verify-payment
 *
 * Revokes payment verification (e.g., if verification was done in error).
 */
export const DELETE = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    // Check schools.approve permission
    const permCheck = await requirePermission(userId, "schools.approve");
    if (permCheck) return permCheck;

    const params = await context?.params || Promise.resolve({ id: "" });
    const applicationId = (await params).id;

    // Get the application
    const applications = await db
      .select()
      .from(schoolAdminApplications)
      .where(eq(schoolAdminApplications.id, applicationId))
      .limit(1);

    if (applications.length === 0) {
      return { error: "Application not found", status: 404 };
    }

    const application = applications[0];

    // Cannot revoke verification if already approved
    if (application.status === "approved") {
      return { error: "Cannot revoke payment verification for approved application", status: 400 };
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

    return {
      success: true,
      message: "Payment verification revoked",
    };
  },
  ["admin"]
);
