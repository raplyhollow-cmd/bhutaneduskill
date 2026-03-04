/**
 * TEACHER ATTENDANCE API
 *
 * GET /api/teacher/attendance - Get classes for attendance marking
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, enrollments, teacherAssignments } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import type { AuthContext } from "@/lib/api/route-handler";

// ============================================================================
// GET /api/teacher/attendance - Get classes for attendance marking
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth: AuthContext | null) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    try {
      // Get assignments using db.select() - neon-http doesn't support query API
      const assignmentsResult = await db
        .select()
        .from(teacherAssignments)
        .where(
          and(
            eq(teacherAssignments.teacherId, user.id),
            eq(teacherAssignments.isActive, true)
          )
        );

      const classesWithStudents = await Promise.all(
        assignmentsResult.map(async (assignment) => {
          // Get enrolled students for this class using db.select()
          const classEnrollmentsResult = await db
            .select()
            .from(enrollments)
            .where(
              and(
                eq(enrollments.classId, assignment.classId),
                eq(enrollments.status, "active")
              )
            );

          // Get student details for each enrollment - batch fetch all students
          const studentIds = classEnrollmentsResult.map(e => e.studentId).filter(Boolean);
          const studentsData = studentIds.length > 0
            ? await db
                .select()
                .from(users)
                .where(inArray(users.id, studentIds))
            : [];

          return {
            classId: assignment.classId,
            role: assignment.role,
            studentsCount: classEnrollmentsResult.length,
            students: studentsData.map(s => ({
              id: s.id,
              name: s.name,
              rollNumber: s.rollNumber || "",
              classId: assignment.classId,
            })),
          };
        })
      );

      return successResponse({ classes: classesWithStudents });
    } catch (error) {
      logger.apiError(error, { route: "/api/teacher/attendance", method: "GET" });
      return errorResponse("Failed to fetch classes", 500);
    }
  },
  ['teacher']
);
