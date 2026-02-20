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
