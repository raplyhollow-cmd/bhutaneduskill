/**
 * Student RUB Applications API
 * Submit and track RUB college applications
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { rubApplications, users, bcseResults, rubColleges, rubPrograms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/student/rub-applications
 * Get student's RUB applications
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "parent", "counselor", "admin", "school_admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

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
    } else if (["counselor", "admin", "school_admin"].includes(user?.type || "") && targetStudentId) {
      studentId = targetStudentId;
    }

    // Build conditions
    const conditions: any[] = [eq(rubApplications.studentId, studentId)];

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

    return NextResponse.json({
      success: true,
      data: { applications },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/student/rub-applications", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch applications",
    }, { status: 500 });
  }
}

/**
 * POST /api/student/rub-applications
 * Submit new RUB college application
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "admin", "school_admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await req.json();
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
      return NextResponse.json({
        error: "At least one program preference is required",
      }, { status: 400 });
    }

    if (preferences.length > 10) {
      return NextResponse.json({
        error: "Maximum 10 preferences allowed",
      }, { status: 400 });
    }

    // Validate each preference
    for (const pref of preferences) {
      if (!pref.collegeId || !pref.programId) {
        return NextResponse.json({
          error: "Each preference must include collegeId and programId",
        }, { status: 400 });
      }
    }

    // Get student details
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
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
      return NextResponse.json({
        error: "BCSE results not found. Please ensure your exam results are imported.",
      }, { status: 400 });
    }

    // Fetch college and program names
    const collegeIds = [...new Set(preferences.map((p: any) => p.collegeId))];
    const programIds = [...new Set(preferences.map((p: any) => p.programId))];

    const [colleges, programs] = await Promise.all([
      db.select().from(rubColleges).where(sql`${rubColleges.id} = ANY(${collegeIds})`),
      db.select().from(rubPrograms).where(sql`${rubPrograms.id} = ANY(${programIds})`),
    ]);

    const collegeMap = new Map(colleges.map((c) => [c.id, c]));
    const programMap = new Map(programs.map((p) => [p.id, p]));

    // Build preferences with names
    const preferencesWithNames = preferences.map((pref: any, index: number) => {
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

    return NextResponse.json({
      success: true,
      data: application,
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/student/rub-applications", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to create application",
    }, { status: 500 });
  }
}

/**
 * PATCH /api/student/rub-applications
 * Update application (withdraw, change preferences, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { applicationId, action, preferences } = body;

    if (!applicationId) {
      return NextResponse.json({
        error: "Application ID is required",
      }, { status: 400 });
    }

    // Get application
    const [application] = await db
      .select()
      .from(rubApplications)
      .where(eq(rubApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json({
        error: "Application not found",
      }, { status: 404 });
    }

    // Verify ownership
    if (application.studentId !== userId) {
      return NextResponse.json({
        error: "Access denied",
      }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (action === "withdraw") {
      updateData.status = "declined";
    } else if (action === "update_preferences" && preferences) {
      // Only allow updating preferences if not yet processed
      if (!["submitted", "under_review"].includes(application.status)) {
        return NextResponse.json({
          error: "Cannot update preferences. Application already processed.",
        }, { status: 400 });
      }

      // Re-fetch college/program names
      const collegeIds = [...new Set(preferences.map((p: any) => p.collegeId))];
      const programIds = [...new Set(preferences.map((p: any) => p.programId))];

      const [colleges, rubProgs] = await Promise.all([
        db.select().from(rubColleges).where(sql`${rubColleges.id} = ANY(${collegeIds})`),
        db.select().from(rubPrograms).where(sql`${rubPrograms.id} = ANY(${programIds})`),
      ]);

      const collegeMap = new Map(colleges.map((c) => [c.id, c]));
      const programMap = new Map(rubProgs.map((p) => [p.id, p]));

      updateData.preferences = preferences.map((pref: any, index: number) => {
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

    return NextResponse.json({
      success: true,
      message: "Application updated",
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/student/rub-applications", method: "PATCH" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to update application",
    }, { status: 500 });
  }
}
