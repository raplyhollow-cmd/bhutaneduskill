/**
 * COUNSELOR STUDENTS API
 *
 * GET /api/counselor/students - Get counselor's assigned students
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, counselorAssignments, schools, assessments, careerPlans, attendance } from "@/lib/db/schema";
import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import type { User } from "@/lib/db/schema";
import type { DbUser } from "@/types";

// ============================================================================
// GET /api/counselor/students - Get counselor's assigned students
// ============================================================================

export const GET = createApiRoute(
  async (request, auth) => {
    const { user: currentUser, userId } = auth;

    try {
      // Get school assignments for this counselor using db.select (neon-http compatible)
      const assignments = await db
        .select({ schoolId: counselorAssignments.schoolId })
        .from(counselorAssignments)
        .where(
          and(
            eq(counselorAssignments.counselorId, currentUser.id),
            eq(counselorAssignments.isActive, true)
          )
        );

      const schoolIds = assignments.map((a) => a.schoolId);

      if (schoolIds.length === 0) {
        return successResponse({
          students: [],
          stats: {
            totalStudents: 0,
            studentsCompletedAssessments: 0,
            studentsWithCareerPlans: 0,
            studentsNeedingAttention: 0,
          },
        });
      }

      // Get all students from assigned schools using db.select (neon-http compatible)
      const allStudents = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.type, "student"),
            schoolIds.length > 0 ? sql`${users.schoolId} IN ${sql.raw(`('${schoolIds.join("','")}')`)}` : undefined
          )
        );

      // Get schools data for all students using db.select (neon-http compatible)
      const uniqueSchoolIds = [...new Set(allStudents.map((s) => s.schoolId).filter(Boolean))] as string[];
      const schoolsData = uniqueSchoolIds.length > 0
        ? await db
            .select()
            .from(schools)
            .where(sql`${schools.id} IN ${sql.raw(`('${uniqueSchoolIds.join("','")}')`)}`)
        : [];

      const schoolMap = new Map(schoolsData.map((s) => [s.id, s]));

      // OPTIMIZATION: Batch fetch all data instead of N queries per student
      // Get attendance date range (30 days back)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      // Collect all student IDs
      const studentIds = allStudents.map((s) => s.id);

      // Batch 1: Fetch all assessments for these students
      const allAssessments = await db
        .select({ userId: assessments.userId, status: assessments.status })
        .from(assessments)
        .where(sql`${assessments.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

      // Create assessment map: userId -> { completed, inProgress }
      const assessmentMap = new Map(
        studentIds.map((id) => [
          id,
          { completed: 0, inProgress: false },
        ])
      );
      for (const a of allAssessments) {
        const entry = assessmentMap.get(a.userId);
        if (entry) {
          if (a.status === "completed") entry.completed++;
          if (a.status === "in_progress") entry.inProgress = true;
        }
      }

      // Batch 2: Fetch all career plans
      const allCareerPlans = await db
        .select({ userId: careerPlans.userId, status: careerPlans.status })
        .from(careerPlans)
        .where(sql`${careerPlans.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

      const careerPlanMap = new Map(allCareerPlans.map((p) => [p.userId, p.status]));

      // Batch 3: Fetch all attendance records
      const allAttendance = await db
        .select({ studentId: attendance.studentId, status: attendance.status })
        .from(attendance)
        .where(
          and(
            sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
            gte(attendance.date, thirtyDaysAgoStr)
          )
        );

      // Create attendance map: studentId -> { present, total }
      const attendanceMap = new Map(
        studentIds.map((id) => [id, { present: 0, total: 0 }])
      );
      for (const a of allAttendance) {
        const entry = attendanceMap.get(a.studentId);
        if (entry) {
          entry.total++;
          if (a.status === "present") entry.present++;
        }
      }

      // Now enrich students with batched data (no more queries!)
      const studentsWithData = allStudents.map((student) => {
        const assessEntry = assessmentMap.get(student.id) || { completed: 0, inProgress: false };
        const attendEntry = attendanceMap.get(student.id) || { present: 0, total: 0 };
        const careerStatus = careerPlanMap.get(student.id);

        const attendanceRate = attendEntry.total > 0
          ? Math.round((attendEntry.present / attendEntry.total) * 100)
          : 0;

        const needsAttention =
          attendanceRate < 80 ||
          (assessEntry.completed === 0 && !assessEntry.inProgress) ||
          (careerStatus !== "completed" && student.classGrade && student.classGrade >= 10);

        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName || ""}`.trim(),
          email: student.email || null,
          phone: student.phone || null,
          grade: student.classGrade || null,
          section: student.section || null,
          school: schoolMap.get(student.schoolId)?.name || null,
          counselorId: currentUser.id,
          assessmentStatus:
            assessEntry.completed > 0
              ? "completed"
              : assessEntry.inProgress
              ? "in_progress"
              : "pending",
          assessmentsTaken: assessEntry.completed,
          topCareer: null, // Would need to query career matches
          careerMatch: null,
          planStatus: careerStatus === "completed" ? "completed" : careerStatus ? "in_progress" : "not_started",
          lastSession: "Not available", // Would need sessions table
          needsAttention,
          gpa: null, // Would need exam results
          attendanceRate,
        };
      });

      // Calculate stats
      const totalStudents = studentsWithData.length;
      const studentsCompletedAssessments = studentsWithData.filter((s) => s.assessmentStatus === "completed").length;
      const studentsWithCareerPlans = studentsWithData.filter((s) => s.planStatus === "completed").length;
      const studentsNeedingAttention = studentsWithData.filter((s) => s.needsAttention).length;

      return successResponse({
        students: studentsWithData,
        stats: {
          totalStudents,
          studentsCompletedAssessments,
          studentsWithCareerPlans,
          studentsNeedingAttention,
        },
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/counselor/students", method: "GET" });
      return errorResponse("Failed to fetch students", 500);
    }
  },
  ['counselor', 'admin']
);
