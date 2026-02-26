/**
 * SCHOOL ADMIN SUBJECT TEACHERS API
 *
 * GET /api/school-admin/subjects/[id]/teachers - Get all teachers assigned to this subject
 * POST /api/school-admin/subjects/[id]/teachers - Assign a teacher to a subject
 * DELETE /api/school-admin/subjects/[id]/teachers - Remove teacher assignment from subject
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subjects, users, classes, teacherAssignments } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, createdResponse } from "@/lib/api/response-helpers";

/**
 * Helper function to get current academic year
 */
function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Academic year runs from September to August
  return now.getMonth() >= 8
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
}

// ============================================================================
// POST /api/school-admin/subjects/[id]/teachers
// ============================================================================

/**
 * Assign a teacher to a subject (creates teacher_assignment record)
 * Body: { teacherId, role?, isPrimary?, classId?, academicYear? }
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;
    const { id: subjectId } = await context.params;
    const body = await request.json();

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    const { teacherId, role = "subject_expert", isPrimary = false, classId, academicYear } = body;

    if (!teacherId) {
      return badRequestResponse("Teacher ID is required");
    }

    // Verify subject exists and belongs to school using db.select()
    const subjectResult = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, user.schoolId)))
      .limit(1);

    const subject = subjectResult[0];

    if (!subject) {
      return notFoundResponse("Subject");
    }

    // Verify teacher exists and is a teacher using db.select()
    const teacherResult = await db
      .select()
      .from(users)
      .where(eq(users.id, teacherId))
      .limit(1);

    const teacher = teacherResult[0];

    if (!teacher || teacher.type !== "teacher") {
      return notFoundResponse("Teacher");
    }

    // Check if assignment already exists using db.select()
    const existingResult = await db
      .select()
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.subjectId, subjectId),
          classId ? eq(teacherAssignments.classId, classId) : sql`${teacherAssignments.classId} IS NULL`,
          eq(teacherAssignments.academicYear, academicYear || getCurrentAcademicYear())
        )
      )
      .limit(1);

    const existing = existingResult[0];

    if (existing) {
      return badRequestResponse("Teacher is already assigned to this subject");
    }

    // Get current academic year if not provided
    const now = new Date();
    const currentYear = now.getFullYear();
    const effectiveAcademicYear = academicYear || (
      now.getMonth() >= 8
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`
    );

    // Generate assignment ID
    const nanoidModule = await import("nanoid");
    const nanoid = nanoidModule.nanoid;
    const assignmentId = `ta-${nanoid()}`;

    // Create teacher assignment
    const assignmentResult = await db
      .insert(teacherAssignments)
      .values({
        id: assignmentId,
        teacherId,
        subjectId,
        classId: classId || null,
        role,
        isPrimary,
        academicYear: effectiveAcademicYear,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const assignment = assignmentResult[0];

    logger.info("Teacher assigned to subject", {
      subjectId,
      teacherId,
      role,
    });

    return createdResponse({ assignment });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// GET /api/school-admin/subjects/[id]/teachers
// ============================================================================

/**
 * Get all teachers assigned to this subject
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { user } = auth;
    const { id: subjectId } = await context.params;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    // Verify subject exists using db.select()
    const subjectResult = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, user.schoolId)))
      .limit(1);

    const subject = subjectResult[0];

    if (!subject) {
      return notFoundResponse("Subject");
    }

    // Get assigned teachers using db.select()
    const assignments = await db
      .select({
        id: teacherAssignments.id,
        teacherId: teacherAssignments.teacherId,
        role: teacherAssignments.role,
        isPrimary: teacherAssignments.isPrimary,
        classId: teacherAssignments.classId,
        academicYear: teacherAssignments.academicYear,
        teacherId2: users.id,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
        teacherEmail: users.email,
        teacherEmployeeId: users.employeeId,
        classId2: classes.id,
        className: classes.name,
        classGrade: classes.grade,
        classSection: classes.section,
      })
      .from(teacherAssignments)
      .innerJoin(users, eq(teacherAssignments.teacherId, users.id))
      .leftJoin(classes, eq(teacherAssignments.classId, classes.id))
      .where(
        and(
          eq(teacherAssignments.subjectId, subjectId),
          eq(teacherAssignments.isActive, true)
        )
      )
      .orderBy(desc(teacherAssignments.isPrimary));

    // Format assignments
    const formattedAssignments = assignments.map(a => ({
      id: a.id,
      teacherId: a.teacherId,
      role: a.role,
      isPrimary: a.isPrimary,
      classId: a.classId,
      academicYear: a.academicYear,
      teacher: {
        id: a.teacherId2,
        firstName: a.teacherFirstName,
        lastName: a.teacherLastName,
        email: a.teacherEmail,
        employeeId: a.teacherEmployeeId,
      },
      class: a.classId2 ? {
        id: a.classId2,
        name: a.className,
        grade: a.classGrade,
        section: a.classSection,
      } : null,
    }));

    return successResponse({ assignments: formattedAssignments });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// DELETE /api/school-admin/subjects/[id]/teachers
// ============================================================================

/**
 * Remove teacher assignment from subject
 * Body: { teacherId, classId? }
 */
export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { user } = auth;
    const { id: subjectId } = await context.params;
    const body = await request.json();

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    const { teacherId, classId } = body;

    if (!teacherId) {
      return badRequestResponse("Teacher ID is required");
    }

    // Verify subject exists using db.select()
    const subjectResult = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, user.schoolId)))
      .limit(1);

    const subject = subjectResult[0];

    if (!subject) {
      return notFoundResponse("Subject");
    }

    // Delete the assignment (soft delete by setting isActive to false)
    await db
      .update(teacherAssignments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.subjectId, subjectId),
          classId ? eq(teacherAssignments.classId, classId) : sql`${teacherAssignments.classId} IS NULL`
        )
      );

    logger.info("Teacher unassigned from subject", {
      subjectId,
      teacherId,
    });

    return successResponse({ message: "Teacher unassigned successfully" });
  },
  ['school-admin', 'admin']
);
