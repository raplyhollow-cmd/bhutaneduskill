/**
 * STUDENT CLASSES API
 *
 * GET /api/student/classes - Get student's enrolled classes
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Returns:
 * - All classes the student is enrolled in
 * - Teacher information for each class
 * - Counts for homework, attendance, classmates
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, enrollments, subjects, homework, attendance } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/student/classes - Get student's enrolled classes
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    try {
      // Get student's enrollments using db.select()
      const studentEnrollmentsData = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, userId))
        .orderBy(desc(enrollments.createdAt));

      if (!studentEnrollmentsData || studentEnrollmentsData.length === 0) {
        return successResponse({ classes: [] });
      }

      // Get all class IDs
      const classIds = studentEnrollmentsData.map(e => e.classId);

      // Get class details using db.select()
      const classData = await db
        .select()
        .from(classes)
        .where(inArray(classes.id, classIds));

      // Get class teacher IDs from classes
      const teacherIds = classData
        .map(c => c.classTeacherId)
        .filter((id): id is string => id !== null && id !== undefined);

      // Get teacher details using db.select()
      const teachersData = teacherIds.length > 0
        ? await db
            .select()
            .from(users)
            .where(inArray(users.id, teacherIds))
        : [];

      const teacherMap = new Map(teachersData.map(t => [t.id, t]));

      // Enrich with additional data
      const enrichedClasses = await Promise.all(
        studentEnrollmentsData.map(async (enrollmentItem) => {
          const cls = classData.find(c => c.id === enrollmentItem.classId);
          if (!cls) return null;

          const teacher = cls.classTeacherId ? teacherMap.get(cls.classTeacherId) : null;

          // Get classmates count (students in same class) using db.select()
          const classmatesData = await db
            .select()
            .from(enrollments)
            .where(eq(enrollments.classId, cls.id));

          // Get pending homework count using db.select()
          const pendingHomeworkData = await db
            .select()
            .from(homework)
            .where(
              and(
                eq(homework.classId, cls.id),
                eq(homework.isPublished, true)
              )
            );

          // Get recent attendance (last 30 days) using db.select()
          const recentAttendanceData = await db
            .select()
            .from(attendance)
            .where(
              and(
                eq(attendance.studentId, userId),
                eq(attendance.classId, cls.id)
              )
            )
            .limit(30);

          // Calculate attendance summary
          const presentDays = recentAttendanceData.filter((a) => a.status === "present").length;
          const absentDays = recentAttendanceData.filter((a) => a.status === "absent").length;
          const lateDays = recentAttendanceData.filter((a) => a.status === "late").length;
          const attendancePercentage = recentAttendanceData.length > 0
            ? Math.round((presentDays / recentAttendanceData.length) * 100)
            : 100;

          return {
            id: cls.id,
            name: cls.name,
            grade: cls.grade,
            section: cls.section,
            academicYear: cls.academicYear,
            teacher: teacher ? {
              id: teacher.id,
              name: `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
              email: teacher.email || "",
            } : null,
            students: classmatesData.length,
            pendingHomework: pendingHomeworkData.length,
            attendanceSummary: {
              present: presentDays,
              absent: absentDays,
              late: lateDays,
              percentage: attendancePercentage,
            },
            enrolledAt: enrollmentItem.enrollmentDate,
            status: enrollmentItem.status,
          };
        })
      );

      // Filter out nulls and sort
      const validClasses = enrichedClasses.filter((c) => c !== null);

      return successResponse({ classes: validClasses });
    } catch (error) {
      logger.error("Student classes fetch error:", error);
      return errorResponse("Failed to fetch classes", 500);
    }
  },
  ['student', 'teacher', 'counselor', 'admin']
);
