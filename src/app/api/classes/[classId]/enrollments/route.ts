/**
 * CLASS ENROLLMENTS API
 *
 * GET /api/classes/[classId]/enrollments - Get all students enrolled in a class
 * POST /api/classes/[classId]/enrollments - Add students to a class
 * DELETE /api/classes/[classId]/enrollments - Remove a student from a class
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 * FIXED: Removed db.query usage (disabled in neon-http driver)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { enrollments, users, classes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, createdResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/classes/[classId]/enrollments - Get all students enrolled in a class
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return badRequestResponse("classId is required");
    }

    // Verify the class exists
    const classRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (classRecord.length === 0) {
      return errorResponse("Class not found", 404);
    }

    // Teachers can only view enrollments for their own classes
    if (user.type === 'teacher' && classRecord[0].teacherId !== userId) {
      return errorResponse("Forbidden", 403);
    }

    // Get all enrollments for this class
    const enrollmentRecords = await db
      .select()
      .from(enrollments)
      .where(and(
        eq(enrollments.classId, classId),
        eq(enrollments.status, 'active')
      ))
      .with({
        student: true,
      })
      .orderBy(desc(enrollments.createdAt));

    // Transform the response to include student details
    interface EnrollmentWithStudent {
      id: string;
      studentId: string;
      classId: string;
      academicYear: string;
      enrollmentDate: string;
      status: string;
      rollNumber: string | null;
      section: string | null;
      createdAt: Date;
      updatedAt: Date;
      student: {
        id: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        clerkUserId: string;
        type: string;
      } | null;
    }
    const enrollmentsWithStudents = enrollmentRecords.map((enrollment): EnrollmentWithStudent => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      classId: enrollment.classId,
      academicYear: enrollment.academicYear,
      enrollmentDate: enrollment.enrollmentDate,
      status: enrollment.status,
      rollNumber: enrollment.rollNumber,
      section: enrollment.section,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
      student: enrollment.student ? {
        id: enrollment.student.id,
        name: enrollment.student.name,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        clerkUserId: enrollment.student.clerkUserId,
        type: enrollment.student.type,
      } : null,
    }));

    return successResponse({ enrollments: enrollmentsWithStudents });
  },
  ['school-admin', 'admin', 'teacher']
);

// ============================================================================
// POST /api/classes/[classId]/enrollments - Add students to a class
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;
    const body = await request.json();
    const { classId, studentIds, academicYear, rollNumbers, section } = body;

    // Validate required fields
    if (!classId) {
      return badRequestResponse("classId is required");
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return badRequestResponse("studentIds is required and must be a non-empty array");
    }

    if (!academicYear) {
      return badRequestResponse("academicYear is required");
    }

    // Verify the class exists
    const classRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (classRecord.length === 0) {
      return errorResponse("Class not found", 404);
    }

    // Create enrollment records for each student
    const enrollmentPromises = studentIds.map(async (studentId: string) => {
      const enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date().toISOString();

      return db.insert(enrollments).values({
        id: enrollmentId,
        studentId,
        classId,
        academicYear,
        enrollmentDate: now,
        status: 'active',
        rollNumber: rollNumbers?.[studentId] || null,
        section: section || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
    });

    const results = await Promise.all(enrollmentPromises);
    const newEnrollments = results.flat();

    return createdResponse({ enrollments: newEnrollments });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// DELETE /api/classes/[classId]/enrollments - Remove a student from a class
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    if (!classId || !studentId) {
      return badRequestResponse("classId and studentId query parameters are required");
    }

    // Find the enrollment record
    const enrollmentRecord = await db
      .select()
      .from(enrollments)
      .where(and(
        eq(enrollments.classId, classId),
        eq(enrollments.studentId, studentId)
      ))
      .limit(1);

    if (enrollmentRecord.length === 0) {
      return errorResponse("Enrollment not found", 404);
    }

    // Delete the enrollment
    await db
      .delete(enrollments)
      .where(eq(enrollments.id, enrollmentRecord[0].id));

    return successResponse({
      message: "Student removed from class successfully",
      enrollment: enrollmentRecord[0]
    });
  },
  ['school-admin', 'admin']
);