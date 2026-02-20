import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { studentApplications, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * GET /api/school-admin/student-applications
 * Fetch student applications for the school admin's school
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Get school admin's school ID
    const admin = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        schoolId: true,
      },
    });

    if (!admin?.schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get status filter from query params
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Build conditions
    const conditions = [eq(studentApplications.schoolId, admin.schoolId)];
    if (statusFilter && statusFilter !== "all") {
      conditions.push(eq(studentApplications.status, statusFilter));
    }

    // Fetch applications with student details
    const applications = await db
      .select({
        id: studentApplications.id,
        studentId: studentApplications.studentId,
        schoolId: studentApplications.schoolId,
        status: studentApplications.status,
        requestedGrade: studentApplications.requestedGrade,
        requestedSection: studentApplications.requestedSection,
        guardianName: studentApplications.guardianName,
        guardianPhone: studentApplications.guardianPhone,
        guardianEmail: studentApplications.guardianEmail,
        previousSchool: studentApplications.previousSchool,
        specialNeeds: studentApplications.specialNeeds,
        submittedAt: studentApplications.submittedAt,
        reviewedAt: studentApplications.reviewedAt,
        rejectionReason: studentApplications.rejectionReason,
        notes: studentApplications.notes,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          name: users.name,
          email: users.email,
          phone: users.phone,
          gender: users.gender,
          dateOfBirth: users.dateOfBirth,
          profileImage: users.profileImage,
        },
      })
      .from(studentApplications)
      .innerJoin(users, eq(studentApplications.studentId, users.id))
      .where(and(...conditions))
      .orderBy(desc(studentApplications.submittedAt));

    logger.info("Fetched student applications", {
      schoolId: admin.schoolId,
      count: applications.length,
    });

    return NextResponse.json({ applications });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/student-applications", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
