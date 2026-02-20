/**
 * PLATFORM ADMIN - SCHOOL ADMIN APPLICATIONS
 *
 * View and approve/reject school admin signup applications.
 * Part of the hierarchical ecosystem workflow.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { schoolAdminApplications, users, schools } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { SchoolAdminApplicationsClient } from "./school-admin-applications-client";
import { logger } from "@/lib/logger";

export default async function AdminSchoolAdminApplicationsPage() {
  const authResult = await requireAuth(['admin']);

  if ('error' in authResult) {
    logger.security("unauthorized_admin_applications_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { userId } = authResult;

  // Get all applications with user and school details
  const applications = await db
    .select({
      id: schoolAdminApplications.id,
      status: schoolAdminApplications.status,
      paymentStatus: schoolAdminApplications.paymentStatus,
      paymentAmount: schoolAdminApplications.paymentAmount,
      paymentDate: schoolAdminApplications.paymentDate,
      paymentMethod: schoolAdminApplications.paymentMethod,
      paymentReference: schoolAdminApplications.paymentReference,
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
    .orderBy(desc(schoolAdminApplications.appliedAt));

  // Calculate stats
  const pendingCount = applications.filter(a => a.status === "pending_approval").length;
  const approvedCount = applications.filter(a => a.status === "approved").length;
  const rejectedCount = applications.filter(a => a.status === "rejected").length;
  const pendingPaymentCount = applications.filter(a => a.paymentStatus === "pending").length;

  return (
    <SchoolAdminApplicationsClient
      applications={applications}
      pendingCount={pendingCount}
      approvedCount={approvedCount}
      rejectedCount={rejectedCount}
      pendingPaymentCount={pendingPaymentCount}
    />
  );
}
