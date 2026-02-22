/**
 * PLATFORM ADMIN - SCHOOL ADMIN APPLICATIONS
 *
 * View and approve/reject school admin signup applications.
 * Part of the hierarchical ecosystem workflow.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { neon } from "@neondatabase/serverless";
import { SchoolAdminApplicationsClient } from "./school-admin-applications-client";
import { logger } from "@/lib/logger";

export default async function AdminSchoolAdminApplicationsPage() {
  const authResult = await requireAuth(['admin']);

  if ('error' in authResult) {
    logger.security("unauthorized_admin_applications_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { userId } = authResult;

  // Get all applications with user and school details using raw SQL
  let applications: any[] = [];
  try {
    const sql = neon(process.env.DATABASE_URL!);
    applications = await sql`
      SELECT
        saa.id,
        saa.status,
        saa.payment_status as "paymentStatus",
        saa.payment_amount as "paymentAmount",
        saa.payment_date as "paymentDate",
        saa.payment_method as "paymentMethod",
        saa.payment_reference as "paymentReference",
        saa.applied_at as "appliedAt",
        saa.reviewed_at as "reviewedAt",
        saa.reviewed_by as "reviewedBy",
        saa.rejection_reason as "rejectionReason",
        saa.notes,
        saa.user_id as "userId",
        u.name as "userName",
        u.email as "userEmail",
        u.phone as "userPhone",
        saa.school_id as "schoolId",
        s.name as "schoolName",
        s.code as "schoolCode"
      FROM school_admin_applications saa
      LEFT JOIN users u ON saa.user_id = u.id
      LEFT JOIN schools s ON saa.school_id = s.id
      ORDER BY saa.applied_at DESC
    `;
  } catch (error: any) {
    logger.error("Failed to fetch school admin applications", {
      error: error?.message || String(error),
      stack: error?.stack
    });
    applications = [];
  }

  // Calculate stats
  const pendingCount = applications.filter((a: any) => a.status === "pending_approval").length;
  const approvedCount = applications.filter((a: any) => a.status === "approved").length;
  const rejectedCount = applications.filter((a: any) => a.status === "rejected").length;
  const pendingPaymentCount = applications.filter((a: any) => a.paymentStatus === "pending").length;

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
