/**
 * BCSE Registration API
 * School admins can register students for BCSE examinations
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { bcseRegistrations, users, bcseSubjectMapping, bcseSubjectCombinations } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/school-admin/bcse-registrations
 * Get BCSE registrations for the school
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType") as "BCSE_10" | "BCSE_12" | null;
    const examYear = searchParams.get("examYear");
    const status = searchParams.get("status");
    const academicYear = searchParams.get("academicYear");

    // Get school ID from user
    const [user] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Build query conditions
    const conditions = [eq(bcseRegistrations.schoolId, user.schoolId)];

    if (examType) {
      conditions.push(eq(bcseRegistrations.examType, examType));
    }

    if (examYear) {
      conditions.push(eq(bcseRegistrations.examYear, parseInt(examYear, 10)));
    }

    if (status) {
      conditions.push(eq(bcseRegistrations.registrationStatus, status));
    }

    if (academicYear) {
      conditions.push(eq(bcseRegistrations.academicYear, academicYear));
    }

    // Fetch registrations
    const registrations = await db
      .select()
      .from(bcseRegistrations)
      .where(and(...conditions))
      .orderBy(desc(bcseRegistrations.createdAt));

    logger.info("Fetched BCSE registrations", {
      userId,
      schoolId: user.schoolId,
      examType,
      count: registrations.length,
    });

    return NextResponse.json({
      success: true,
      data: { registrations, schoolId: user.schoolId },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/bcse-registrations", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch registrations",
    }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/bcse-registrations
 * Register a student for BCSE examination
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const {
      studentId,
      examType,
      examYear,
      academicYear,
      subjects,
      bcseRegistrationNumber,
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    if (!examType || !["BCSE_10", "BCSE_12"].includes(examType)) {
      return NextResponse.json({ error: "Exam type must be BCSE_10 or BCSE_12" }, { status: 400 });
    }

    if (!examYear) {
      return NextResponse.json({ error: "Exam year is required" }, { status: 400 });
    }

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year is required" }, { status: 400 });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ error: "At least one subject is required" }, { status: 400 });
    }

    // Get school ID
    const [requester] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!requester?.schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get student details
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.schoolId !== requester.schoolId) {
      return NextResponse.json({ error: "Student does not belong to your school" }, { status: 403 });
    }

    // Check for existing registration
    const [existing] = await db
      .select()
      .from(bcseRegistrations)
      .where(
        and(
          eq(bcseRegistrations.studentId, studentId),
          eq(bcseRegistrations.examType, examType),
          eq(bcseRegistrations.examYear, parseInt(examYear, 10))
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({
        error: "Student is already registered for this exam",
        data: existing,
      }, { status: 409 });
    }

    // Create registration
    const registrationId = `bcse_reg_${nanoid()}`;
    const now = new Date();

    await db.insert(bcseRegistrations).values({
      id: registrationId,
      schoolId: requester.schoolId,
      studentId,
      examType,
      academicYear,
      examYear: parseInt(examYear, 10),
      bcseRegistrationNumber: bcseRegistrationNumber || null,
      subjects: subjects.map((s: any) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        isCompulsory: s.isCompulsory || false,
        examDate: s.examDate || null,
      })),
      studentName: student.name,
      cidNumber: student.cidNumber || "",
      dateOfBirth: student.dateOfBirth || "",
      gender: student.gender || "other",
      bloodGroup: student.bloodGroup || null,
      photo: student.profileImage || null,
      fatherName: student.fatherName || null,
      fatherCID: student.fatherCID || null,
      fatherOccupation: student.fatherOccupation || null,
      fatherPhone: student.fatherPhone || null,
      motherName: student.motherName || null,
      motherCID: student.motherCID || null,
      motherOccupation: student.motherOccupation || null,
      motherPhone: student.motherPhone || null,
      guardianName: student.guardianName || null,
      guardianCID: student.guardianCID || null,
      guardianPhone: student.guardianPhone || null,
      permanentAddress: student.permanentAddress || null,
      currentAddress: student.address || null,
      dzongkhag: student.dzongkhag || null,
      gewog: student.gewog || null,
      village: student.village || null,
      hasSpecialNeeds: student.hasDisability || false,
      specialNeedsType: student.disabilityType || null,
      specialNeedsDetails: null,
      requiresSpecialArrangements: student.requiresSpecialArrangements || false,
      specialArrangements: null,
      registrationFee: 1500, // Standard fee (in Ngultrum)
      feeStatus: "unpaid",
      documents: [],
      registrationStatus: "submitted",
      submittedDate: now.toISOString(),
      createdAt: now,
      updatedAt: now,
    });

    logger.info("BCSE registration created", {
      userId,
      registrationId,
      studentId,
      examType,
      examYear,
    });

    // Fetch and return the created registration
    const [registration] = await db
      .select()
      .from(bcseRegistrations)
      .where(eq(bcseRegistrations.id, registrationId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: registration,
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/bcse-registrations", method: "POST" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to create registration",
    }, { status: 500 });
  }
}
