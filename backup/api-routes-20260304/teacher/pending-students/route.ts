/**
 * TEACHER PENDING STUDENTS API
 *
 * GET /api/teacher/pending-students - Get pending student applications for teacher's classes
 *
 * Returns students who have applied to the school and are awaiting approval,
 * filtered to only show students for classes where this teacher is assigned as class teacher.
 *
 * CLASS-BASED APPROVAL: Only the assigned class teacher can approve students
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
      // Get teacher's school
      const teacherInfo = await db
        .select({
          id: users.id,
          schoolId: users.schoolId,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (teacherInfo.length === 0) {
        return errorResponse("Teacher not found", 404);
      }

      const teacher = teacherInfo[0];

      // Get all classes where this teacher is assigned as the CLASS TEACHER
      const teacherClasses = await db
        .select({
          id: classes.id,
          grade: classes.grade,
          section: classes.section,
          name: classes.name,
        })
        .from(classes)
        .where(
          and(
            eq(classes.schoolId, teacher.schoolId!),
            eq(classes.classTeacherId, userId) // Only classes where teacher is class teacher
          )
        );

      if (teacherClasses.length === 0) {
        // Teacher is not assigned as a class teacher to any class
        return successResponse({
          success: true,
          students: [],
          message: "You are not assigned as a class teacher to any class",
        });
      }

      // Build list of (grade, section) pairs this teacher can approve
      const classCombinations = teacherClasses.map((c) => ({
        grade: c.grade,
        section: c.section?.toUpperCase(),
      }));

      // Get pending students who applied to this teacher's classes
      // Check both studentApplications (formal applications) and users (direct signup via wizard)
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

      // Filter to only show students whose grade+section matches this teacher's assigned classes
      const filteredStudents = pendingStudents
        .filter((student) => {
          const studentGrade = parseInt(student.classGrade || "0");
          const studentSection = student.section?.toUpperCase();

          // Check if student's grade+section matches any of this teacher's classes
          return classCombinations.some(
            (combo) => combo.grade === studentGrade && combo.section === studentSection
          );
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

      logger.info("Teacher fetched pending students for their classes", {
        teacherId: userId,
        schoolId: teacher.schoolId,
        assignedClasses: teacherClasses.map((c) => c.name),
        count: filteredStudents.length,
      });

      return successResponse({
        success: true,
        students: filteredStudents,
        assignedClasses: teacherClasses.map((c) => c.name),
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/teacher/pending-students", method: "GET" });
      return errorResponse("Failed to fetch pending students", 500);
    }
  },
  ["teacher"]
);
