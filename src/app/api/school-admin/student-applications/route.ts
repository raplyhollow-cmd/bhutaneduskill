import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { studentApplications, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { alias } from "drizzle-orm/pg-core";

// Create alias for users table to join approver info
const approvers = alias(users, "approvers");

/**
 * GET /api/school-admin/student-applications
 * Fetch student applications for the school admin's school
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    // Get school admin's school ID
    const [admin] = await db
      .select({
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!admin?.schoolId) {
      return { error: "School not found", status: 404 };
    }

    // Get status filter from query params
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Build conditions
    const conditions = [eq(studentApplications.schoolId, admin.schoolId)];
    if (statusFilter && statusFilter !== "all") {
      conditions.push(eq(studentApplications.status, statusFilter));
    }

    // Fetch applications with student details and reviewer info
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
        reviewedBy: studentApplications.reviewedBy,
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
        reviewer: {
          id: approvers.id,
          name: approvers.name,
          firstName: approvers.firstName,
          lastName: approvers.lastName,
          email: approvers.email,
          type: approvers.type,
        },
      })
      .from(studentApplications)
      .innerJoin(users, eq(studentApplications.studentId, users.id))
      .leftJoin(approvers, eq(studentApplications.reviewedBy, approvers.id))
      .where(and(...conditions))
      .orderBy(desc(studentApplications.submittedAt));

    logger.info("Fetched student applications", {
      schoolId: admin.schoolId,
      count: applications.length,
    });

    return { data: applications };
  },
  ["school-admin"]
);
