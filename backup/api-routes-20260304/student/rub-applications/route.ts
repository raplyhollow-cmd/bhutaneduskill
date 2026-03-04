/**
 * Student RUB Applications API
 * Submit and track RUB college applications
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { rubApplications, users, bcseResults, rubColleges, rubPrograms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface ProgramPreference {
  collegeId: string;
  programId: string;
}

interface PreferenceWithName extends ProgramPreference {
  collegeName: string;
  programName: string;
  priority: number;
}

interface CreateRubApplicationRequest {
  preferences: ProgramPreference[];
  examType: string;
  examYear: string;
  scholarshipApplied?: boolean;
  scholarshipType?: string;
  category?: string;
}

interface UpdateRubApplicationRequest {
  applicationId: string;
  action: "withdraw" | "update_preferences";
  preferences?: ProgramPreference[];
}

/**
 * GET /api/student/rub-applications
 * Get student's RUB applications
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
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
    } else if (["counselor", "admin", "school-admin"].includes(user?.type || "") && targetStudentId) {
      studentId = targetStudentId;
    }

    // Build conditions
    const conditions = [eq(rubApplications.studentId, studentId)];

    if (status) {
      conditions.push(eq(rubApplications.status, status));
    }

    if (applicationYear) {
      conditions.push(eq(rubApplications.applicationYear, parseInt(applicationYear)));
    }

    // Fetch applications
    const applications = await db
      .select()
      .from(rubApplications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rubApplications.createdAt));

    logger.info("Fetched RUB applications", {
      userId,
      studentId,
      count: applications.length,
    });

    return successResponse({ applications });
  },
  ['student', 'parent', 'counselor', 'admin', 'school-admin']
);

/**
 * POST /api/student/rub-applications
 * Submit new RUB college application
 */
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const body = await request.json() as CreateRubApplicationRequest;
    const {
      preferences,
      examType,
      examYear,
      scholarshipApplied = false,
      scholarshipType,
      category = "general",
    } = body;

    // Validate preferences
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return badRequestResponse("At least one program preference is required");
    }

    if (preferences.length > 10) {
      return badRequestResponse("Maximum 10 preferences allowed");
    }

    // Validate each preference
    for (const pref of preferences) {
      if (!pref.collegeId || !pref.programId) {
        return badRequestResponse("Each preference must include collegeId and programId");
      }
    }

    // Get student details
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!student) {
      return notFoundResponse("Student");
    }

    // Get BCSE result if provided
    let bcseResult = null;
    if (examType && examYear) {
      const [result] = await db
        .select()
        .from(bcseResults)
        .where(
          and(
            eq(bcseResults.studentId, userId),
            eq(bcseResults.examType, examType),
            eq(bcseResults.examYear, parseInt(examYear))
          )
        )
        .limit(1);

      bcseResult = result;
    }

    if (!bcseResult) {
      return badRequestResponse("BCSE results not found. Please ensure your exam results are imported.");
    }

    // Fetch college and program names
    const collegeIds = [...new Set(preferences.map((p) => p.collegeId))];
    const programIds = [...new Set(preferences.map((p) => p.programId))];

    const [colleges, programs] = await Promise.all([
      db.select().from(rubColleges).where(sql`${rubColleges.id} = ANY(${collegeIds})`),
      db.select().from(rubPrograms).where(sql`${rubPrograms.id} = ANY(${programIds})`),
    ]);

    const collegeMap = new Map(colleges.map((c) => [c.id, c]));
    const programMap = new Map(programs.map((p) => [p.id, p]));

    // Build preferences with names
    const preferencesWithNames: PreferenceWithName[] = preferences.map((pref, index: number) => {
      const college = collegeMap.get(pref.collegeId);
      const program = programMap.get(pref.programId);

      if (!college || !program) {
        throw new Error(`Invalid college or program at preference ${index + 1}`);
      }

      return {
        collegeId: pref.collegeId,
        collegeName: college.name,
        programId: pref.programId,
        programName: program.name,
        priority: index + 1,
      };
    });

    // Generate application number
    const applicationYear = new Date().getFullYear();
    const applicationNumber = `RUB${applicationYear}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create application
    const applicationId = `rub_app_${nanoid()}`;
    const now = new Date();

    await db.insert(rubApplications).values({
      id: applicationId,
      schoolId: student.schoolId || "",
      studentId: userId,
      applicationNumber,
      applicationYear,
      academicYear: `${applicationYear}-${applicationYear + 1}`,
      preferences: preferencesWithNames,
      studentName: student.name,
      cidNumber: student.cidNumber || "",
      dateOfBirth: student.dateOfBirth || "",
      gender: student.gender || "other",
      bloodGroup: student.bloodGroup || null,
      photo: student.profileImage || null,
      phone: student.phone || "",
      email: student.email || "",
      presentAddress: student.address || "",
      permanentAddress: student.permanentAddress || "",
      dzongkhag: student.dzongkhag || null,
      gewog: student.gewog || null,
      village: student.village || null,
      fatherName: student.fatherName || null,
      fatherOccupation: student.fatherOccupation || null,
      fatherPhone: student.fatherPhone || null,
      fatherCID: student.fatherCID || null,
      motherName: student.motherName || null,
      motherOccupation: student.motherOccupation || null,
      motherPhone: student.motherPhone || null,
      motherCID: student.motherCID || null,
      guardianName: student.guardianName || null,
      guardianPhone: student.guardianPhone || null,
      guardianCID: student.guardianCID || null,
      examType,
      examYear: parseInt(examYear),
      indexNumber: bcseResult.indexNumber,
      schoolAttended: student.schoolName || "",
      percentage: bcseResult.percentage,
      division: bcseResult.division,
      subjectMarks: bcseResult.subjectResults || [],
      documents: [],
      category,
      hasDisability: student.hasDisability || false,
      disabilityType: student.disabilityType || null,
      disabilityCertificate: null,
      scholarshipApplied,
      scholarshipType: scholarshipType || null,
      scholarshipDocuments: [],
      status: "submitted",
      submittedDate: now.toISOString(),
      lastModifiedDate: now.toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    logger.info("RUB application created", {
      applicationId,
      applicationNumber,
      userId,
      preferencesCount: preferences.length,
    });

    // Fetch and return the created application
    const [application] = await db
      .select()
      .from(rubApplications)
      .where(eq(rubApplications.id, applicationId))
      .limit(1);

    return successResponse(application);
  },
  ['student', 'admin', 'school-admin']
);

/**
 * PATCH /api/student/rub-applications
 * Update application (withdraw, change preferences, etc.)
 */
export const PATCH = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const body = await request.json() as UpdateRubApplicationRequest;
    const { applicationId, action, preferences } = body;

    if (!applicationId) {
      return badRequestResponse("Application ID is required");
    }

    // Get application
    const [application] = await db
      .select()
      .from(rubApplications)
      .where(eq(rubApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return notFoundResponse("Application");
    }

    // Verify ownership
    if (application.studentId !== userId) {
      return errorResponse("Access denied", 403);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (action === "withdraw") {
      updateData.status = "declined";
    } else if (action === "update_preferences" && preferences) {
      // Only allow updating preferences if not yet processed
      if (!["submitted", "under_review"].includes(application.status)) {
        return badRequestResponse("Cannot update preferences. Application already processed.");
      }

      // Re-fetch college/program names
      const collegeIds = [...new Set(preferences.map((p) => p.collegeId))];
      const programIds = [...new Set(preferences.map((p) => p.programId))];

      const [colleges, rubProgs] = await Promise.all([
        db.select().from(rubColleges).where(sql`${rubColleges.id} = ANY(${collegeIds})`),
        db.select().from(rubPrograms).where(sql`${rubPrograms.id} = ANY(${programIds})`),
      ]);

      const collegeMap = new Map(colleges.map((c) => [c.id, c]));
      const programMap = new Map(rubProgs.map((p) => [p.id, p]));

      updateData.preferences = preferences.map((pref, index: number) => {
        const college = collegeMap.get(pref.collegeId);
        const program = programMap.get(pref.programId);

        return {
          collegeId: pref.collegeId,
          collegeName: college?.name || "",
          programId: pref.programId,
          programName: program?.name || "",
          priority: index + 1,
        };
      });
    }

    await db
      .update(rubApplications)
      .set(updateData)
      .where(eq(rubApplications.id, applicationId));

    return successResponse({ message: "Application updated" });
  },
  ['student', 'admin']
);
