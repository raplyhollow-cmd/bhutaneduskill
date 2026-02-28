/**
 * BCSE Registration API
 * School admins can register students for BCSE examinations
 */

import { NextRequest } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse, conflictResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { bcseRegistrations, users, bcseSubjectMapping, bcseSubjectCombinations } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

interface BCSESubject {
  subjectCode: string;
  subjectName: string;
  isCompulsory?: boolean;
  examDate?: string | null;
}

/**
 * GET /api/school-admin/bcse-registrations
 * Get BCSE registrations for the school
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

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
      return notFoundResponse("School not found");
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

    return successResponse({ registrations, schoolId: user.schoolId });
  },
  ["school-admin", "admin"]
);

/**
 * POST /api/school-admin/bcse-registrations
 * Register a student for BCSE examination
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

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
      return badRequestResponse("Student ID is required");
    }

    if (!examType || !["BCSE_10", "BCSE_12"].includes(examType)) {
      return badRequestResponse("Exam type must be BCSE_10 or BCSE_12");
    }

    if (!examYear) {
      return badRequestResponse("Exam year is required");
    }

    if (!academicYear) {
      return badRequestResponse("Academic year is required");
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return badRequestResponse("At least one subject is required");
    }

    // Get school ID
    const [requester] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!requester?.schoolId) {
      return notFoundResponse("School not found");
    }

    // Get student details
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      return notFoundResponse("Student not found");
    }

    if (student.schoolId !== requester.schoolId) {
      return errorResponse("Student does not belong to your school", 403);
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
      return conflictResponse("Student is already registered for this exam");
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
      subjects: subjects.map((s: BCSESubject) => ({
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

    return successResponse(registration);
  },
  ["school-admin", "admin"]
);
