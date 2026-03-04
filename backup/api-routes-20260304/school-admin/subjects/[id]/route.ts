/**
 * SCHOOL ADMIN SUBJECT DETAIL API
 *
 * GET /api/school-admin/subjects/[id] - Fetch subject detail with assigned teachers
 * PATCH /api/school-admin/subjects/[id] - Update subject details
 * DELETE /api/school-admin/subjects/[id] - Soft delete a subject
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subjects, users, classes, teacherAssignments } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/school-admin/subjects/[id]
// ============================================================================

/**
 * Fetch subject detail with:
 * - Subject information
 * - Assigned teachers for this subject
 * - Classes that have this subject
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;
    const { id: subjectId } = await context.params;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    // Get subject details using db.select()
    const subjectResult = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, user.schoolId)))
      .limit(1);

    const subject = subjectResult[0];

    if (!subject) {
      return notFoundResponse("Subject");
    }

    // Get teachers assigned to this subject with their classes
    const assignedTeachers = await db
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

    // Group teachers by teacherId and collect their assigned classes
    const teacherMap = new Map<string, any>();
    assignedTeachers.forEach(t => {
      if (!teacherMap.has(t.teacherId)) {
        teacherMap.set(t.teacherId, {
          id: t.id,
          teacherId: t.teacherId,
          role: t.role,
          isPrimary: t.isPrimary,
          academicYear: t.academicYear,
          teacher: {
            id: t.teacherId2,
            firstName: t.teacherFirstName,
            lastName: t.teacherLastName,
            email: t.teacherEmail,
            employeeId: t.teacherEmployeeId,
          },
          assignedClasses: [],
        });
      }
      // Add class if there is one
      if (t.classId2) {
        teacherMap.get(t.teacherId).assignedClasses.push({
          id: t.classId2,
          name: t.className,
          grade: t.classGrade,
          section: t.classSection,
        });
      }
    });

    // Convert map to array
    const formattedTeachers = Array.from(teacherMap.values());

    // Get classes for this grade that would have this subject
    const gradeClasses = await db
      .select({
        id: classes.id,
        name: classes.name,
        grade: classes.grade,
        section: classes.section,
        academicYear: classes.academicYear,
      })
      .from(classes)
      .where(
        and(
          eq(classes.schoolId, user.schoolId),
          eq(classes.grade, subject.grade ?? 0),
          eq(classes.isActive, true)
        )
      )
      .orderBy(classes.grade, classes.section);

    // Get all available teachers (not yet assigned to this subject)
    const allTeachers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        employeeId: users.employeeId,
      })
      .from(users)
      .where(eq(users.type, "teacher"))
      .orderBy(users.firstName);

    // Filter out already assigned teachers
    const assignedTeacherIds = new Set(formattedTeachers.map(t => t.teacherId));
    const availableTeachers = allTeachers.filter(t => !assignedTeacherIds.has(t.id));

    logger.info("Fetched subject detail", {
      subjectId,
      assignedTeachersCount: formattedTeachers.length,
      gradeClassesCount: gradeClasses.length,
    });

    return successResponse({
      subject,
      assignedTeachers: formattedTeachers,
      gradeClasses,
      availableTeachers,
    });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// PATCH /api/school-admin/subjects/[id]
// ============================================================================

/**
 * Update subject details
 */
export const PATCH = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;
    const { id: subjectId } = await context.params;
    const body = await request.json();

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    // Verify subject exists and belongs to school using db.select()
    const existingResult = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, user.schoolId)))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return notFoundResponse("Subject");
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.grade !== undefined) updateData.grade = body.grade;

    const updatedResult = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.id, subjectId))
      .returning();

    const updated = updatedResult[0];

    logger.info("Subject updated", { subjectId, userId });

    return successResponse({ subject: updated });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// DELETE /api/school-admin/subjects/[id]
// ============================================================================

/**
 * Delete (soft delete) a subject
 */
export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { user } = auth;
    const { id: subjectId } = await context.params;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    // Verify subject exists and belongs to school using db.select()
    const existingResult = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, user.schoolId)))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return notFoundResponse("Subject");
    }

    // Check for active teacher assignments using db.select()
    const assignmentResult = await db
      .select()
      .from(teacherAssignments)
      .where(eq(teacherAssignments.subjectId, subjectId))
      .limit(1);

    const assignment = assignmentResult[0];

    if (assignment) {
      return badRequestResponse("Cannot delete subject that is assigned to teachers. Remove assignments first.");
    }

    // Soft delete
    await db
      .update(subjects)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(subjects.id, subjectId));

    logger.info("Subject deleted", { subjectId, schoolId: user.schoolId });

    return successResponse({ message: "Subject deleted successfully" });
  },
  ['school-admin', 'admin']
);
