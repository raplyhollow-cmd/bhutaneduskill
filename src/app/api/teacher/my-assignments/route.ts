import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes, users, subjects, teacherAssignments, enrollments } from "@/lib/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/teacher/my-assignments
 *
 * Get all classes and subjects assigned to the current teacher
 * Returns:
 * - Homeroom classes (where teacher is class teacher)
 * - Subject assignments (where teacher teaches specific subjects in classes)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    try {
      // Get homeroom classes (classes where teacher is the class teacher) using db.select()
      const homeroomClasses = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section,
          academicYear: classes.academicYear,
          roomNumber: classes.roomNumber,
          capacity: classes.capacity,
          role: sql<string>`'homeroom'`,
        })
        .from(classes)
        .where(eq(classes.teacherId, userId));

      // Get subject assignments (where teacher teaches specific subjects) using db.select()
      const subjectAssignments = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section,
          academicYear: classes.academicYear,
          roomNumber: classes.roomNumber,
          capacity: classes.capacity,
          role: sql<string>`'subject_teacher'`,
          assignmentId: teacherAssignments.id,
          subjectId: teacherAssignments.subjectId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          subjectType: subjects.type,
          isPrimary: teacherAssignments.isPrimary,
        })
        .from(teacherAssignments)
        .innerJoin(classes, eq(teacherAssignments.classId, classes.id))
        .innerJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
        .where(
          and(
            eq(teacherAssignments.teacherId, userId),
            eq(teacherAssignments.isActive, true)
          )
        )
        .orderBy(classes.grade, classes.section);

      // Combine homeroom classes and subject assignments
      // For homeroom classes, we need to add subject info separately
      const classMap = new Map<string, any>();

      // Add homeroom classes
      homeroomClasses.forEach((cls) => {
        if (!classMap.has(cls.id)) {
          classMap.set(cls.id, {
            ...cls,
            subjects: [],
            isHomeroom: true,
          });
        } else {
          // If already exists (from subject assignments), mark as homeroom
          classMap.get(cls.id).isHomeroom = true;
          classMap.get(cls.id).role = "homeroom";
        }
      });

      // Add subject assignments
      subjectAssignments.forEach((assignment: {
        id: string;
        name: string;
        grade: number;
        section: string | null;
        academicYear: string;
        roomNumber: string | null;
        capacity: number | null;
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        subjectType: string;
        isPrimary: boolean;
      }) => {
        if (!classMap.has(assignment.id)) {
          classMap.set(assignment.id, {
            id: assignment.id,
            name: assignment.name,
            grade: assignment.grade,
            section: assignment.section,
            academicYear: assignment.academicYear,
            roomNumber: assignment.roomNumber,
            capacity: assignment.capacity,
            subjects: [],
            isHomeroom: false,
          });
        }

        // Add subject to the class
        classMap.get(assignment.id).subjects.push({
          id: assignment.subjectId,
          name: assignment.subjectName,
          code: assignment.subjectCode,
          type: assignment.subjectType,
          isPrimary: assignment.isPrimary,
        });
      });

      // Get student counts for each class using db.select()
      const allClassIds = Array.from(classMap.keys());
      const studentCounts = new Map<string, number>();

      if (allClassIds.length > 0) {
        const enrollmentData = await db
          .select({
            classId: enrollments.classId,
            count: sql<number>`count(*)`.as('count'),
          })
          .from(enrollments)
          .where(
            and(
              sql`${enrollments.classId} = ANY(${allClassIds})`,
              eq(enrollments.status, "active")
            )
          )
          .groupBy(enrollments.classId);

        enrollmentData.forEach((row) => {
          studentCounts.set(row.classId, Number(row.count));
        });
      }

      // Build final response
      const classesData = Array.from(classMap.values()).map((cls) => ({
        ...cls,
        studentCount: studentCounts.get(cls.id) || 0,
      }));

      logger.info("Fetched teacher assignments", {
        route: "/api/teacher/my-assignments",
        method: "GET",
        userId,
        classesCount: classesData.length,
      });

      // Calculate total unique subjects
      const totalSubjects = classesData.reduce(
        (sum, cls) => sum + cls.subjects.length,
        0
      );

      return successResponse({
        classes: classesData,
        totalClasses: classesData.length,
        totalSubjects,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/teacher/my-assignments", method: "GET" });
      return errorResponse("Failed to fetch assignments", 500);
    }
  },
  ['teacher']
);
