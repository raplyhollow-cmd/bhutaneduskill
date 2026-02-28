/**
 * Student Scholarship Applications API
 * Submit and track scholarship applications
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { rubScholarshipApplications, rubScholarships, users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/scholarship-applications
 * Get student's scholarship applications
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const applicationYear = searchParams.get("applicationYear");
    const targetStudentId = searchParams.get("studentId");

    // Determine which student's applications to fetch
    let studentId = userId;

    if (user?.type === "parent" && targetStudentId) {
      const [student] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, targetStudentId),
            eq(users.parentId, userId)
          )
        )
        .limit(1);

      if (student) {
        studentId = targetStudentId;
      }
    } else if (["admin", "school-admin"].includes(user?.type || "") && targetStudentId) {
      studentId = targetStudentId;
    }

    // Build conditions
    type QueryCondition = ReturnType<typeof eq>;
    const conditions: QueryCondition[] = [eq(rubScholarshipApplications.studentId, studentId)];

    if (status) {
      conditions.push(eq(rubScholarshipApplications.status, status));
    }

    if (applicationYear) {
      conditions.push(eq(rubScholarshipApplications.applicationYear, parseInt(applicationYear)));
    }

    // Fetch applications with scholarship details
    const applications = await db
      .select({
        id: rubScholarshipApplications.id,
        applicationNumber: rubScholarshipApplications.applicationNumber,
        applicationYear: rubScholarshipApplications.applicationYear,
        academicYear: rubScholarshipApplications.academicYear,
        status: rubScholarshipApplications.status,
        studentId: rubScholarshipApplications.studentId,
        studentName: rubScholarshipApplications.studentName,
        cidNumber: rubScholarshipApplications.cidNumber,
        annualFamilyIncome: rubScholarshipApplications.annualFamilyIncome,
        approvedAmount: rubScholarshipApplications.approvedAmount,
        submittedDate: rubScholarshipApplications.submittedDate,
        approvedDate: rubScholarshipApplications.approvedDate,
        scholarshipId: rubScholarshipApplications.scholarshipId,
      })
      .from(rubScholarshipApplications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rubScholarshipApplications.submittedDate));

    // Fetch scholarship details for each application
    const scholarshipIds = [...new Set(applications.map((a) => a.scholarshipId))];
    const scholarships = await db
      .select()
      .from(rubScholarships)
      .where(sql`${rubScholarships.id} = ANY(${scholarshipIds})`);

    const scholarshipMap = new Map(scholarships.map((s) => [s.id, s]));

    const applicationsWithScholarship = applications.map((app) => ({
      ...app,
      scholarship: scholarshipMap.get(app.scholarshipId),
    }));

    return {
      success: true,
      data: { applications: applicationsWithScholarship },
    };
  },
  ["student", "parent", "admin", "school-admin"]
);

/**
 * POST /api/student/scholarship-applications
 * Submit new scholarship application
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;

    const body = await req.json();
    const {
      scholarshipId,
      annualFamilyIncome,
      familyMembers,
      earningMembers,
      financialHardship,
      documents,
    } = body;

    // Validate required fields
    if (!scholarshipId) {
      return { error: "Scholarship ID is required", status: 400 };
    }

    // Get scholarship details
    const [scholarship] = await db
      .select()
      .from(rubScholarships)
      .where(eq(rubScholarships.id, scholarshipId))
      .limit(1);

    if (!scholarship) {
      return { error: "Scholarship not found", status: 404 };
    }

    if (!scholarship.isActive) {
      return { error: "This scholarship is currently not accepting applications", status: 400 };
    }

    // Get student details
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!student) {
      return { error: "Student not found", status: 404 };
    }

    // Check for existing application
    const [existing] = await db
      .select()
      .from(rubScholarshipApplications)
      .where(
        and(
          eq(rubScholarshipApplications.studentId, userId),
          eq(rubScholarshipApplications.scholarshipId, scholarshipId),
          eq(rubScholarshipApplications.applicationYear, new Date().getFullYear())
        )
      )
      .limit(1);

    if (existing) {
      return { error: "You have already applied for this scholarship this year", status: 409 };
    }

    // Generate application number
    const applicationYear = new Date().getFullYear();
    const applicationNumber = `SCH${applicationYear}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create application
    const applicationId = `sch_app_${nanoid()}`;
    const now = new Date();

    await db.insert(rubScholarshipApplications).values({
      id: applicationId,
      schoolId: student.schoolId || "",
      studentId: userId,
      scholarshipId,
      applicationNumber,
      applicationYear,
      academicYear: `${applicationYear}-${applicationYear + 1}`,
      studentName: student.name,
      cidNumber: student.cidNumber || "",
      annualFamilyIncome,
      familyMembers,
      earningMembers,
      financialHardship,
      documents: documents || [],
      status: "pending",
      submittedDate: now.toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    logger.info("Scholarship application created", {
      applicationId,
      applicationNumber,
      userId,
      scholarshipId,
    });

    const [application] = await db
      .select()
      .from(rubScholarshipApplications)
      .where(eq(rubScholarshipApplications.id, applicationId))
      .limit(1);

    return {
      success: true,
      data: { ...application, scholarship },
    };
  },
  ["student", "school-admin"]
);

/**
 * PATCH /api/student/scholarship-applications
 * Update application (withdraw, add documents)
 */
export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { applicationId, action, documents } = body;

    if (!applicationId) {
      return { error: "Application ID is required", status: 400 };
    }

    // Get application
    const [application] = await db
      .select()
      .from(rubScholarshipApplications)
      .where(eq(rubScholarshipApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return { error: "Application not found", status: 404 };
    }

    // Verify ownership (or admin access)
    if (application.studentId !== userId && userId !== "admin") {
      return { error: "Access denied", status: 403 };
    }

    const updateData: {
      status?: string;
      documents?: Array<{ documentType: string; documentUrl: string }>;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (action === "withdraw") {
      updateData.status = "withdrawn";
    } else if (action === "add_documents" && documents) {
      const existingDocs = (application.documents || []) as Array<{ documentType: string; documentUrl: string }>;
      updateData.documents = [...existingDocs, ...(documents as Array<{ documentType: string; documentUrl: string }>)];
    }

    await db
      .update(rubScholarshipApplications)
      .set(updateData)
      .where(eq(rubScholarshipApplications.id, applicationId));

    return {
      success: true,
      message: "Application updated",
    };
  },
  ["student", "school-admin", "admin"]
);
