/**
 * RUB APPLICATIONS API
 *
 * Handles student applications to Royal University of Bhutan colleges
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { rubApplications, rubColleges, rubPrograms, users } from "@/lib/db/schema";
import { eq, and, desc, sql, asc } from "drizzle-orm";

// ============================================================================
// GET /api/rub/applications
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "my-applications";

    // Get current user details
    const [currentUser] = await db
      .select({
        id: users.id,
        type: users.type,
        role: users.role,
        schoolId: users.schoolId,
        name: users.name,
        phone: users.phone,
        email: users.email,
        address: users.address,
        dateOfBirth: users.dateOfBirth,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!currentUser) {
      logger.error("User not found in database", { userId, route: "/api/rub/applications" });
      return { error: "User not found", status: 404 };
    }

    // Students see their own applications; admins/school-admins see all from their school
    const isAdmin = user.type === "admin";
    const isSchoolAdmin = user.type === "school-admin" || user.type === "counselor";
    const canViewAll = isAdmin || isSchoolAdmin;

    // Action: Get student's applications
    if (action === "my-applications") {
      const status = searchParams.get("status");
      const academicYear = searchParams.get("academicYear");

      const whereConditions: ReturnType<typeof eq>[] = [];

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

      return { data: applications };
    }

    // Action: Get available RUB colleges and programs
    if (action === "college-programs") {
      const collegeId = searchParams.get("collegeId");
      const programId = searchParams.get("programId");

      // Return all active programs with colleges
      const allPrograms = await db
        .select({
          id: rubPrograms.id,
          collegeId: rubPrograms.collegeId,
          name: rubPrograms.name,
          code: rubPrograms.code,
          duration: rubPrograms.duration,
          totalSeats: rubPrograms.totalSeats,
          minPercentage: rubPrograms.minPercentage,
          description: rubPrograms.description,
          isActive: rubPrograms.isActive,
          college: {
            id: rubColleges.id,
            name: rubColleges.name,
            code: rubColleges.code,
            location: rubColleges.location,
          },
        })
        .from(rubPrograms)
        .leftJoin(rubColleges, eq(rubPrograms.collegeId, rubColleges.id))
        .where(eq(rubPrograms.isActive, true))
        .orderBy(rubPrograms.name);

      return { data: allPrograms };
    }

    return { error: "Invalid action", status: 400 };
  },
  ['student', 'admin', 'school-admin', 'counselor']
);

// ============================================================================
// POST /api/rub/applications
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    // Get current user details
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!currentUser[0]) {
      logger.error("User not found in database", { userId, route: "/api/rub/applications" });
      return { error: "User not found", status: 404 };
    }

    if (!currentUser[0].schoolId) {
      return { error: "You must be linked to a school to submit an application", status: 400 };
    }

    const body = await req.json();

    // Validate required fields
    const { preferences, studentDetails, parentDetails, academicDetails, documents } = body;

    if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
      return { error: "At least one program preference is required", status: 400 };
    }

    if (!studentDetails?.cidNumber) {
      return { error: "CID number is required", status: 400 };
    }

    if (!academicDetails?.examType || !academicDetails?.examYear) {
      return { error: "Exam details are required", status: 400 };
    }

    // Check for existing draft/submitted application for this academic year
    const academicYear = body.academicYear || new Date().getFullYear().toString();
    const existingApplication = await db
      .select()
      .from(rubApplications)
      .where(and(
        eq(rubApplications.studentId, currentUser[0].id),
        eq(rubApplications.academicYear, academicYear)
      ))
      .limit(1);

    if (existingApplication[0] && existingApplication[0].status !== "draft") {
      return { error: "You already have a submitted application for this academic year", status: 400 };
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
      schoolId: currentUser[0].schoolId,
      studentId: currentUser[0].id,
      applicationNumber: existingApplication[0]?.applicationNumber || applicationNumber,
      applicationYear,
      academicYear,
      preferences: preferences || [],
      studentName: currentUser[0].name,
      cidNumber: studentDetails.cidNumber,
      dateOfBirth: studentDetails.dateOfBirth || currentUser[0].dateOfBirth,
      gender: studentDetails.gender,
      bloodGroup: studentDetails.bloodGroup,
      photo: studentDetails.photo,
      phone: studentDetails.phone || currentUser[0].phone,
      email: studentDetails.email || currentUser[0].email,
      presentAddress: studentDetails.presentAddress || currentUser[0].address,
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
    if (existingApplication[0]) {
      // Update existing draft
      const [updated] = await db
        .update(rubApplications)
        .set(applicationData)
        .where(eq(rubApplications.id, existingApplication[0].id))
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

    return { data: application };
  },
  ['student']
);
