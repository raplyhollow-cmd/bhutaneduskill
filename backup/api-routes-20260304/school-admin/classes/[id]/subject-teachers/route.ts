/**
 * SCHOOL ADMIN CLASS SUBJECT TEACHERS API
 *
 * GET /api/school-admin/classes/[id]/subject-teachers - Get subject-teacher assignments
 * POST /api/school-admin/classes/[id]/subject-teachers - Assign teacher to subject
 * DELETE /api/school-admin/classes/[id]/subject-teachers - Remove teacher assignment
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes, users, subjects, teacherAssignments } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, createdResponse } from "@/lib/api/response-helpers";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/school-admin/classes/[id]/subject-teachers
 *
 * Get all subject-teacher assignments for a class
 * Returns: subjects with assigned teachers, and available teachers
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    const { user } = auth;
    const { id: classId } = await params;

    if (!user.schoolId) {
      return errorResponse("No school associated with your account", 400);
    }

    // Verify class exists and belongs to school
    const [classInfo] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, user.schoolId)))
      .limit(1);

    if (!classInfo) {
      return notFoundResponse("Class");
    }

    // Get subjects for this grade
    const gradeSubjects = await db
      .select()
      .from(subjects)
      .where(
        and(
          eq(subjects.schoolId, user.schoolId),
          sql`${subjects.grade} = ${classInfo.grade} OR ${subjects.grade} IS NULL`
        )
      )
      .orderBy(subjects.grade, subjects.name);

    // Get existing teacher assignments for this class (with subject info)
    const assignments = await db
      .select({
        id: teacherAssignments.id,
        teacherId: teacherAssignments.teacherId,
        subjectId: teacherAssignments.subjectId,
        classId: teacherAssignments.classId,
        role: teacherAssignments.role,
        isPrimary: teacherAssignments.isPrimary,
        academicYear: teacherAssignments.academicYear,
        teacher: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          employeeId: users.employeeId,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          type: subjects.type,
          grade: subjects.grade,
        },
      })
      .from(teacherAssignments)
      .innerJoin(users, eq(teacherAssignments.teacherId, users.id))
      .innerJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
      .where(
        and(
          eq(teacherAssignments.classId, classId),
          eq(teacherAssignments.isActive, true)
        )
      )
      .orderBy(subjects.name);

    // Get all teachers for this school
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

    // Build a map of subject -> assigned teachers
    const subjectTeacherMap = new Map<string, typeof assignments>();
    assignments.forEach((assignment) => {
      if (!subjectTeacherMap.has(assignment.subjectId)) {
        subjectTeacherMap.set(assignment.subjectId, []);
      }
      subjectTeacherMap.get(assignment.subjectId)!.push(assignment);
    });

    // Combine subjects with their assigned teachers
    const subjectsWithTeachers = gradeSubjects.map((subject) => ({
      ...subject,
      assignedTeachers: subjectTeacherMap.get(subject.id) || [],
    }));

    logger.info("Fetched class subject-teacher assignments", {
      route: "/api/school-admin/classes/[id]/subject-teachers",
      method: "GET",
      classId,
      subjectsCount: subjectsWithTeachers.length,
    });

    type SubjectTeachersResponse = {
      classInfo: typeof classInfo;
      subjectsWithTeachers: typeof subjectsWithTeachers;
      allTeachers: typeof allTeachers;
    };

    return successResponse({
      classInfo,
      subjectsWithTeachers,
      allTeachers,
    });
  },
  ['school-admin']
);

/**
 * POST /api/school-admin/classes/[id]/subject-teachers
 *
 * Assign a teacher to a subject for a specific class
 * Body: { teacherId, subjectId, role?, isPrimary?, periodsPerWeek? }
 */
export const POST = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    const { userId, user } = auth;
    const { id: classId } = await params;
    const body = await req.json();

    if (!user.schoolId) {
      return errorResponse("No school associated with your account", 400);
    }

    const { teacherId, subjectId, role = "subject_teacher", isPrimary = false, periodsPerWeek } = body;

    if (!teacherId || !subjectId) {
      return badRequestResponse("Teacher ID and Subject ID are required");
    }

    // Verify class exists
    const [classInfo] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, user.schoolId)))
      .limit(1);

    if (!classInfo) {
      return notFoundResponse("Class");
    }

    // Verify teacher exists
    const [teacher] = await db
      .select()
      .from(users)
      .where(eq(users.id, teacherId))
      .limit(1);

    if (!teacher || teacher.type !== "teacher") {
      return notFoundResponse("Teacher");
    }

    // Verify subject exists
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (!subject) {
      return notFoundResponse("Subject");
    }

    // Check if assignment already exists
    const [existing] = await db
      .select()
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.classId, classId),
          eq(teacherAssignments.subjectId, subjectId)
        )
      )
      .limit(1);

    if (existing) {
      return badRequestResponse("This teacher is already assigned to this subject for this class");
    }

    // Get current academic year
    const now = new Date();
    const year = now.getFullYear();
    const academicYear = now.getMonth() >= 8
      ? `${year}-${year + 1}`
      : `${year - 1}-${year}`;

    // Generate assignment ID
    const nanoid = (await import("nanoid")).nanoid;
    const assignmentId = `ta-${nanoid()}`;

    // Create teacher assignment
    const assignmentResult = await db
      .insert(teacherAssignments)
      .values({
        id: assignmentId,
        teacherId,
        classId,
        subjectId,
        role,
        isPrimary,
        academicYear,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const assignment = assignmentResult[0];

    logger.info("Teacher assigned to subject for class", {
      route: "/api/school-admin/classes/[id]/subject-teachers",
      method: "POST",
      classId,
      teacherId,
      subjectId,
      role,
    });

    type AssignmentResponse = {
      assignment: typeof assignment;
      teacher: typeof teacher;
      subject: typeof subject;
    };

    return successResponse({
      assignment,
      teacher,
      subject,
    });
  },
  ['school-admin']
);

/**
 * DELETE /api/school-admin/classes/[id]/subject-teachers
 *
 * Remove a teacher assignment from a class subject
 * Body: { teacherId, subjectId }
 */
export const DELETE = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ id: string }> }) => {
    const { user } = auth;
    const { id: classId } = await params;
    const body = await req.json();

    if (!user.schoolId) {
      return errorResponse("No school associated with your account", 400);
    }

    const { teacherId, subjectId } = body;

    if (!teacherId || !subjectId) {
      return badRequestResponse("Teacher ID and Subject ID are required");
    }

    // Verify class exists
    const [classInfo] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, user.schoolId)))
      .limit(1);

    if (!classInfo) {
      return notFoundResponse("Class");
    }

    // Delete the assignment (soft delete)
    await db
      .update(teacherAssignments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.classId, classId),
          eq(teacherAssignments.subjectId, subjectId)
        )
      );

    logger.info("Teacher unassigned from class subject", {
      route: "/api/school-admin/classes/[id]/subject-teachers",
      method: "DELETE",
      classId,
      teacherId,
      subjectId,
    });

    type DeleteResponse = {
      message: string;
    };

    return successResponse({ message: "Teacher unassigned successfully" });
  },
  ['school-admin']
);
