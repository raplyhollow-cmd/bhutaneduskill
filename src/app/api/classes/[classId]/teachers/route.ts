/**
 * CLASS TEACHERS API
 *
 * GET /api/classes/[classId]/teachers - Get all teachers assigned to a class
 * POST /api/classes/[classId]/teachers - Assign a teacher to a class
 * DELETE /api/classes/[classId]/teachers - Remove a teacher assignment from a class
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 * FIXED: Removed db.query usage (disabled in neon-http driver)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { teacherAssignments, users, classes, subjects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, createdResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/classes/[classId]/teachers - Get all teachers assigned to a class
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

    // Get all teacher assignments for this class with teacher and subject details using manual joins
    const assignmentRecords = await db
      .select({
        // Assignment fields
        id: teacherAssignments.id,
        teacherId: teacherAssignments.teacherId,
        classId: teacherAssignments.classId,
        subjectId: teacherAssignments.subjectId,
        academicYear: teacherAssignments.academicYear,
        role: teacherAssignments.role,
        isPrimary: teacherAssignments.isPrimary,
        isActive: teacherAssignments.isActive,
        createdAt: teacherAssignments.createdAt,
        updatedAt: teacherAssignments.updatedAt,
        // Teacher fields
        teacherUserId: users.id,
        teacherName: users.name,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
        teacherEmail: users.email,
        teacherEmployeeId: users.employeeId,
        teacherType: users.type,
        // Subject fields
        subjectIdRef: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(teacherAssignments)
      .leftJoin(users, eq(teacherAssignments.teacherId, users.id))
      .leftJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
      .where(and(
        eq(teacherAssignments.classId, classId),
        eq(teacherAssignments.isActive, true)
      ))
      .orderBy(desc(teacherAssignments.createdAt));

    // Transform the response to include teacher and subject details
    interface AssignmentWithDetails {
      id: string;
      teacherId: string;
      classId: string;
      subjectId: string | null;
      academicYear: string;
      role: string;
      isPrimary: boolean;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      teacher: {
        id: string;
        name: string;
        firstName: string;
        lastName: string;
        email: string;
        employeeId: string | null;
        type: string;
      } | null;
      subject: {
        id: string;
        name: string;
        code: string;
      } | null;
    }

    // Type for the raw assignment record from the database query
    type RawAssignmentRecord = {
      id: string;
      teacherId: string;
      classId: string;
      subjectId: string | null;
      academicYear: string;
      role: string;
      isPrimary: boolean;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      teacherUserId: string;
      teacherName: string | null;
      teacherFirstName: string | null;
      teacherLastName: string | null;
      teacherEmail: string | null;
      teacherEmployeeId: string | null;
      teacherType: string;
      subjectIdRef: string;
      subjectName: string | null;
      subjectCode: string | null;
    };

    const assignmentsWithDetails = assignmentRecords.map((assignment: RawAssignmentRecord): AssignmentWithDetails => ({
      id: assignment.id,
      teacherId: assignment.teacherId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      academicYear: assignment.academicYear,
      role: assignment.role,
      isPrimary: assignment.isPrimary,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      teacher: assignment.teacherUserId ? {
        id: assignment.teacherUserId,
        name: assignment.teacherName || '',
        firstName: assignment.teacherFirstName || '',
        lastName: assignment.teacherLastName || '',
        email: assignment.teacherEmail || '',
        employeeId: assignment.teacherEmployeeId,
        type: assignment.teacherType,
      } : null,
      subject: assignment.subjectIdRef ? {
        id: assignment.subjectIdRef,
        name: assignment.subjectName || '',
        code: assignment.subjectCode || '',
      } : null,
    }));

    return successResponse({ assignments: assignmentsWithDetails });
  },
  ['school-admin', 'admin', 'teacher']
);

// ============================================================================
// POST /api/classes/[classId]/teachers - Assign a teacher to a class
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;
    const body = await request.json();
    const { classId, teacherId, subjectId, role, isPrimary } = body;

    // Validate required fields
    if (!classId || !teacherId) {
      return badRequestResponse("classId and teacherId are required");
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

    // Verify the teacher exists
    const teacherRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, teacherId))
      .limit(1);

    if (teacherRecord.length === 0) {
      return errorResponse("Teacher not found", 404);
    }

    // Verify the subject exists if provided
    if (subjectId) {
      const subjectRecord = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, subjectId))
        .limit(1);

      if (subjectRecord.length === 0) {
        return errorResponse("Subject not found", 404);
      }
    }

    // Determine role based on isPrimary flag if not explicitly provided
    let assignmentRole = role || 'subject_teacher';
    if (isPrimary && !role) {
      assignmentRole = 'homeroom';
    }

    // Create the teacher assignment
    const assignmentId = `ta_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const [newAssignment] = await db.insert(teacherAssignments).values({
      id: assignmentId,
      teacherId,
      classId,
      subjectId: subjectId || null,
      academicYear: classRecord[0].academicYear || new Date().getFullYear().toString(),
      role: assignmentRole,
      isPrimary: isPrimary ?? false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return createdResponse({ assignment: newAssignment });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// DELETE /api/classes/[classId]/teachers - Remove a teacher assignment from a class
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const teacherId = searchParams.get("teacherId");
    const subjectId = searchParams.get("subjectId");

    if (!classId || !teacherId) {
      return badRequestResponse("classId and teacherId query parameters are required");
    }

    // Build the where conditions
    const conditions = [
      eq(teacherAssignments.classId, classId),
      eq(teacherAssignments.teacherId, teacherId),
    ];

    // If subjectId is provided, include it in the conditions
    if (subjectId) {
      conditions.push(eq(teacherAssignments.subjectId, subjectId));
    }

    // Find the assignment record
    const assignmentRecord = await db
      .select()
      .from(teacherAssignments)
      .where(and(...conditions))
      .limit(1);

    if (assignmentRecord.length === 0) {
      return errorResponse("Teacher assignment not found", 404);
    }

    // Delete the assignment
    await db
      .delete(teacherAssignments)
      .where(eq(teacherAssignments.id, assignmentRecord[0].id));

    return successResponse({
      message: "Teacher removed from class successfully",
      assignment: assignmentRecord[0]
    });
  },
  ['school-admin', 'admin']
);