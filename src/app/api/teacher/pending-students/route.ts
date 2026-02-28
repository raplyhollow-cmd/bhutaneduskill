/**
 * TEACHER PENDING STUDENTS API
 *
 * GET /api/teacher/pending-students - Get pending student applications for teacher's classes
 *
 * Returns students who have applied to the school and are awaiting approval,
 * filtered to only show students in grades that the teacher teaches.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, studentApplications, classes } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    try {
      // Get teacher's info including their assigned classes
      const teacherInfo = await db
        .select({
          id: users.id,
          schoolId: users.schoolId,
          classGrade: users.classGrade,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (teacherInfo.length === 0) {
        return errorResponse("Teacher not found", 404);
      }

      const teacher = teacherInfo[0];

      // Get all classes taught by this teacher (based on grade)
      const teacherClasses = await db
        .select({
          id: classes.id,
          grade: classes.grade,
          name: classes.name,
        })
        .from(classes)
        .where(
          and(
            eq(classes.schoolId, teacher.schoolId!),
            // Match teacher's assigned grade (if set)
            teacher.classGrade ? eq(classes.grade, parseInt(teacher.classGrade)) : undefined
          )
        );

      if (teacherClasses.length === 0) {
        // Teacher has no classes assigned yet
        return successResponse({
          success: true,
          students: [],
          message: "No classes assigned to you yet",
        });
      }

      // Get grades this teacher teaches
      const gradesTaught = teacherClasses.map((c) => c.grade);

      // Get pending students for these grades
      // Students with onboardingStatus = 'pending_enrollment' and matching grade
      const pendingStudents = await db
        .select({
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          classGrade: users.classGrade,
          section: users.section,
          onboardingStatus: users.onboardingStatus,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.schoolId, teacher.schoolId),
            eq(users.type, "student"),
            eq(users.onboardingStatus, "pending_enrollment")
          )
        );

      // Filter to only show students whose grade matches teacher's classes
      const filteredStudents = pendingStudents
        .filter((student) => {
          const studentGrade = parseInt(student.classGrade || "0");
          return gradesTaught.includes(studentGrade);
        })
        .map((student) => ({
          id: student.id,
          name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          email: student.email || "",
          grade: student.classGrade || "N/A",
          section: student.section || undefined,
          appliedAt: student.createdAt?.toISOString() || new Date().toISOString(),
          applicationId: student.id, // Using user ID as application ID
        }));

      logger.info("Teacher fetched pending students", {
        teacherId: userId,
        schoolId: teacher.schoolId,
        count: filteredStudents.length,
      });

      return successResponse({
        success: true,
        students: filteredStudents,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/teacher/pending-students", method: "GET" });
      return errorResponse("Failed to fetch pending students", 500);
    }
  },
  ["teacher"]
);
