/**
 * RUB COLLEGE APPLICATIONS API
 *
 * Handles student applications to Royal University of Bhutan colleges
 * - GET: List applications (student's own or all for admins)
 * - POST: Submit a new application
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { rubApplications, rubColleges, rubPrograms, rubScholarships, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/rub/applications
 *
 * Query parameters:
 * - action: "my-applications" (default) | "college-programs" | "statistics"
 * - collegeId: Filter programs by college (for college-programs action)
 * - programId: Get specific program (for college-programs action)
 * - status: Filter applications by status
 * - academicYear: Filter applications by academic year
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "admin", "school-admin", "counselor"]);

    // Handle auth errors
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "my-applications";

    // Get current user details
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true, name: true, phone: true, email: true, address: true, dateOfBirth: true },
    });

    if (!currentUser) {
      logger.error("User not found in database", { userId, route: "/api/rub/applications" });
      return NextResponse.json(
        { error: "User not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Students see their own applications; admins/school-admins see all from their school
    const isAdmin = user.type === "admin";
    const isSchoolAdmin = user.type === "school-admin" || user.type === "counselor";
    const canViewAll = isAdmin || isSchoolAdmin;

    // Action: Get student's applications
    if (action === "my-applications") {
      const status = searchParams.get("status");
      const academicYear = searchParams.get("academicYear");

      const whereConditions: Array<ReturnType<typeof eq>> = [];

      if (!canViewAll) {
        whereConditions.push(eq(rubApplications.studentId, currentUser.id));
      } else if (currentUser.schoolId) {
        whereConditions.push(eq(rubApplications.schoolId, currentUser.schoolId));
      }

      if (status) {
        whereConditions.push(eq(rubApplications.status, status));
      }

      if (academicYear) {
        whereConditions.push(eq(rubApplications.academicYear, academicYear));
      }

      const applications = await db
        .select({
          id: rubApplications.id,
          applicationNumber: rubApplications.applicationNumber,
          applicationYear: rubApplications.applicationYear,
          academicYear: rubApplications.academicYear,
          status: rubApplications.status,
          submittedDate: rubApplications.submittedDate,
          studentName: rubApplications.studentName,
          preferences: rubApplications.preferences,
          percentage: rubApplications.percentage,
          division: rubApplications.division,
          admittedCollegeName: rubApplications.admittedCollegeName,
          admittedProgramName: rubApplications.admittedProgramName,
          admissionDate: rubApplications.admissionDate,
          meritRank: rubApplications.meritRank,
          scholarshipApplied: rubApplications.scholarshipApplied,
          scholarshipType: rubApplications.scholarshipType,
          createdAt: rubApplications.createdAt,
          updatedAt: rubApplications.updatedAt,
        })
        .from(rubApplications)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(rubApplications.createdAt));

      logger.info("RUB applications fetched", {
        route: "/api/rub/applications",
        userId,
        action,
        count: applications.length,
      });

      return NextResponse.json({
        data: applications,
      } satisfies ApiSuccess<typeof applications>);
    }

    // Action: Get available RUB colleges and programs
    if (action === "college-programs") {
      const collegeId = searchParams.get("collegeId");
      const programId = searchParams.get("programId");

      // Get specific program
      if (programId) {
        const program = await db.query.rubPrograms.findFirst({
          where: and(
            eq(rubPrograms.id, programId),
            eq(rubPrograms.isActive, true)
          ),
          with: {
            college: true,
          },
        });

        if (!program) {
          return NextResponse.json(
            { error: "Program not found", status: 404 } satisfies ApiErrorResponse,
            { status: 404 }
          );
        }

        return NextResponse.json({
          data: {
            college: program.college,
            program: program,
          },
        } satisfies ApiSuccess<{ college: typeof program.college; program: typeof program }>);
      }

      // Get programs for a specific college
      if (collegeId) {
        const collegePrograms = await db.query.rubPrograms.findMany({
          where: and(
            eq(rubPrograms.collegeId, collegeId),
            eq(rubPrograms.isActive, true)
          ),
          with: {
            college: true,
          },
          orderBy: [rubPrograms.name],
        });

        return NextResponse.json({
          data: collegePrograms,
        } satisfies ApiSuccess<typeof collegePrograms>);
      }

      // Return all active programs with colleges
      const allPrograms = await db.query.rubPrograms.findMany({
        where: eq(rubPrograms.isActive, true),
        with: {
          college: true,
        },
        orderBy: [rubPrograms.name],
      });

      return NextResponse.json({
        data: allPrograms,
      } satisfies ApiSuccess<typeof allPrograms>);
    }

    // Action: Get application statistics (admin/school-admin only)
    if (action === "statistics") {
      if (!canViewAll) {
        return NextResponse.json(
          { error: "Forbidden", status: 403 } satisfies ApiErrorResponse,
          { status: 403 }
        );
      }

      const academicYear = searchParams.get("academicYear") || new Date().getFullYear().toString();

      const stats = await db
        .select({
          total: sql<number>`COUNT(*)`,
          draft: sql<number>`SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END)`,
          submitted: sql<number>`SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END)`,
          underReview: sql<number>`SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END)`,
          selected: sql<number>`SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END)`,
          rejected: sql<number>`SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)`,
          admitted: sql<number>`SUM(CASE WHEN status = 'admitted' THEN 1 ELSE 0 END)`,
        })
        .from(rubApplications)
        .where(
          currentUser.schoolId
            ? and(
                eq(rubApplications.schoolId, currentUser.schoolId),
                eq(rubApplications.academicYear, academicYear)
              )
            : eq(rubApplications.academicYear, academicYear)
        );

      logger.info("RUB statistics fetched", {
        route: "/api/rub/applications",
        userId,
        academicYear,
      });

      return NextResponse.json({
        data: stats[0],
      } satisfies ApiSuccess<typeof stats[0]>);
    }

    return NextResponse.json(
      { error: "Invalid action", status: 400 } satisfies ApiErrorResponse,
      { status: 400 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/api/rub/applications", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch applications", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/rub/applications
 *
 * Create a new RUB college application
 *
 * Body:
 * - preferences: Array of college/program preferences (1-10)
 * - studentDetails: Personal information
 * - parentDetails: Parent/guardian information
 * - academicDetails: Exam results and marks
 * - documents: Uploaded document URLs
 * - scholarshipInfo: Scholarship application details (optional)
 * - submit: Boolean to submit application (vs draft)
 * - academicYear: Academic year for application
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student"]);

    // Handle auth errors
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Get current user details
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, schoolId: true, name: true, firstName: true, lastName: true, grade: true, phone: true, email: true, address: true, dateOfBirth: true },
    });

    if (!currentUser) {
      logger.error("User not found in database", { userId, route: "/api/rub/applications" });
      return NextResponse.json(
        { error: "User not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    if (!currentUser.schoolId) {
      return NextResponse.json(
        { error: "You must be linked to a school to submit an application", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate required fields
    const { preferences, studentDetails, parentDetails, academicDetails, documents } = body;

    if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
      return NextResponse.json(
        { error: "At least one program preference is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (!studentDetails?.cidNumber) {
      return NextResponse.json(
        { error: "CID number is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (!academicDetails?.examType || !academicDetails?.examYear) {
      return NextResponse.json(
        { error: "Exam details are required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check for existing draft/submitted application for this academic year
    const academicYear = body.academicYear || new Date().getFullYear().toString();
    const existingApplication = await db.query.rubApplications.findFirst({
      where: and(
        eq(rubApplications.studentId, currentUser.id),
        eq(rubApplications.academicYear, academicYear)
      ),
    });

    if (existingApplication && existingApplication.status !== "draft") {
      return NextResponse.json(
        { error: "You already have a submitted application for this academic year", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Generate application number
    const applicationYear = new Date().getFullYear();
    const applicationCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(rubApplications)
      .where(eq(rubApplications.applicationYear, applicationYear));
    const sequenceNumber = (applicationCount[0]?.count || 0) + 1;
    const applicationNumber = `RUB${applicationYear}${String(sequenceNumber).padStart(5, "0")}`;

    // Create or update application
    const applicationData = {
      schoolId: currentUser.schoolId,
      studentId: currentUser.id,
      applicationNumber: existingApplication?.applicationNumber || applicationNumber,
      applicationYear,
      academicYear,
      preferences: preferences || [],
      studentName: currentUser.name,
      cidNumber: studentDetails.cidNumber,
      dateOfBirth: studentDetails.dateOfBirth || currentUser.dateOfBirth,
      gender: studentDetails.gender,
      bloodGroup: studentDetails.bloodGroup,
      photo: studentDetails.photo,
      phone: studentDetails.phone || currentUser.phone,
      email: studentDetails.email || currentUser.email,
      presentAddress: studentDetails.presentAddress || currentUser.address,
      permanentAddress: studentDetails.permanentAddress,
      dzongkhag: studentDetails.dzongkhag,
      gewog: studentDetails.gewog,
      village: studentDetails.village,
      fatherName: parentDetails?.fatherName,
      fatherOccupation: parentDetails?.fatherOccupation,
      fatherPhone: parentDetails?.fatherPhone,
      fatherCID: parentDetails?.fatherCID,
      motherName: parentDetails?.motherName,
      motherOccupation: parentDetails?.motherOccupation,
      motherPhone: parentDetails?.motherPhone,
      motherCID: parentDetails?.motherCID,
      guardianName: parentDetails?.guardianName,
      guardianPhone: parentDetails?.guardianPhone,
      guardianCID: parentDetails?.guardianCID,
      examType: academicDetails.examType,
      examYear: academicDetails.examYear,
      indexNumber: academicDetails.indexNumber,
      schoolAttended: academicDetails.schoolAttended,
      percentage: academicDetails.percentage,
      division: academicDetails.division,
      subjectMarks: academicDetails.subjectMarks || [],
      documents: documents || [],
      category: studentDetails?.category,
      hasDisability: studentDetails?.hasDisability || false,
      disabilityType: studentDetails?.disabilityType,
      disabilityCertificate: studentDetails?.disabilityCertificate,
      scholarshipApplied: body.scholarshipInfo?.applied || false,
      scholarshipType: body.scholarshipInfo?.type,
      scholarshipDocuments: body.scholarshipInfo?.documents || [],
      status: body.submit === true ? "submitted" : "draft",
      submittedDate: body.submit === true ? new Date().toISOString() : null,
      lastModifiedDate: new Date().toISOString(),
      updatedAt: new Date(),
    };

    let application;
    if (existingApplication) {
      // Update existing draft
      const [updated] = await db
        .update(rubApplications)
        .set(applicationData)
        .where(eq(rubApplications.id, existingApplication.id))
        .returning();
      application = updated;
    } else {
      // Create new application
      const [created] = await db
        .insert(rubApplications)
        .values({
          id: `rub_app_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          ...applicationData,
          createdAt: new Date(),
        })
        .returning();
      application = created;
    }

    logger.info("RUB application created/updated", {
      route: "/api/rub/applications",
      userId,
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
    });

    return NextResponse.json({
      data: application,
    } satisfies ApiSuccess<typeof application>);
  } catch (error) {
    logger.apiError(error, { route: "/api/rub/applications", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create application", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
