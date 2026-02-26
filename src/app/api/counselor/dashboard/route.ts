/**
 * COUNSELOR DASHBOARD API
 *
 * GET /api/counselor/dashboard - Get counselor's dashboard statistics
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 * FIXED: Removed db.query.* usage, now uses db.select().from() pattern
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, counselorAssignments, assessments, careerMatches, attendance, schools } from "@/lib/db/schema";
import { eq, and, desc, gte, count, sql, inArray, isNull } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import type { User } from "@/lib/db/schema";
import type { CounselorDashboardStats, StudentNeedingAttention, SchoolPerformance } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

type DashboardStatistics = CounselorDashboardStats;

// ============================================================================
// GET /api/counselor/dashboard - Get counselor's dashboard statistics
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser } = auth;

    try {
      // Get school assignments for this counselor using proper query pattern
      const assignments = await db
        .select({
          schoolId: counselorAssignments.schoolId,
        })
        .from(counselorAssignments)
        .where(
          and(
            eq(counselorAssignments.counselorId, currentUser.id as string),
            eq(counselorAssignments.isActive, true)
          )
        );

      const schoolIds = assignments.map((a) => a.schoolId);
      const activeSchools = schoolIds.length;

      // Get all students from assigned schools using proper query pattern
      let allStudents: User[] = [];
      if (schoolIds.length > 0) {
        allStudents = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.type, "student"),
              inArray(users.schoolId, schoolIds)
            )
          ) as User[];
      }

      const totalStudents = allStudents.length;
      const studentIds = allStudents.map((s) => s.id);

      // Get assessments completed this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      let assessmentsCount = 0;
      if (studentIds.length > 0) {
        const recentAssessments = await db
          .select({ count: count() })
          .from(assessments)
          .where(
            and(
              inArray(assessments.userId, studentIds),
              sql`${assessments.completedAt} IS NOT NULL`,
              sql`${assessments.completedAt} >= ${oneWeekAgo.toISOString()}`
            )
          );
        assessmentsCount = recentAssessments[0]?.count || 0;
      }

      // Get students needing attention (low attendance, no assessments)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let studentsNeedingAttention = 0;
      let pendingReports = 0;

      // Group attendance by student
      const attendanceByStudent = new Map<string, { present: number; total: number }>();

      if (studentIds.length > 0) {
        // Get attendance data
        const attendanceData = await db
          .select({
            studentId: attendance.studentId,
            status: attendance.status,
          })
          .from(attendance)
          .where(
            and(
              inArray(attendance.studentId, studentIds),
              gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
            )
          );

        for (const record of attendanceData) {
          if (!attendanceByStudent.has(record.studentId)) {
            attendanceByStudent.set(record.studentId, { present: 0, total: 0 });
          }
          const stats = attendanceByStudent.get(record.studentId)!;
          stats.total++;
          if (record.status === "present") {
            stats.present++;
          }
        }

        // Calculate needs attention
        for (const student of allStudents) {
          const attStats = attendanceByStudent.get(student.id);
          const attendanceRate = attStats && attStats.total > 0
            ? (attStats.present / attStats.total) * 100
            : 0;

          if (attendanceRate < 75 || attStats === undefined) {
            studentsNeedingAttention++;
          }
        }

        // Pending reports = students needing attention
        pendingReports = studentsNeedingAttention;
      }

      // Get AI coach usage - use assessment count as a proxy
      const aiCoachUsage = assessmentsCount;

      // Build students needing attention list
      const studentsNeedingAttentionList: User[] = [];
      for (const student of allStudents) {
        const attStats = attendanceByStudent.get(student.id);
        const attendanceRate = attStats && attStats.total > 0
          ? (attStats.present / attStats.total) * 100
          : 0;

        // Include students who need attention (low attendance OR no assessments)
        if (attendanceRate < 75 || attStats === undefined) {
          studentsNeedingAttentionList.push(student);
        }
      }

      // Take top 5 students needing attention
      const studentsToProcess = studentsNeedingAttentionList.slice(0, 5);
      const studentIdsToProcess = studentsToProcess.map(s => s.id);

      // Batch fetch assessments for these students
      type AssessmentRow = { userId: string; status: string };
      const assessmentsByStudent = new Map<string, AssessmentRow[]>();

      if (studentIdsToProcess.length > 0) {
        const allStudentAssessments = await db
          .select({
            userId: assessments.userId,
            status: assessments.status,
          })
          .from(assessments)
          .where(inArray(assessments.userId, studentIdsToProcess));

        for (const a of allStudentAssessments) {
          if (!assessmentsByStudent.has(a.userId)) {
            assessmentsByStudent.set(a.userId, []);
          }
          assessmentsByStudent.get(a.userId)!.push(a);
        }
      }

      // Batch fetch career matches for these students
      type CareerMatchRow = { studentId: string; careerTitle: string | null; matchScore: number | null };
      const careersByStudent = new Map<string, CareerMatchRow>();

      if (studentIdsToProcess.length > 0) {
        const allCareerMatches = await db
          .select({
            studentId: careerMatches.studentId,
            careerTitle: careerMatches.careerTitle,
            matchScore: careerMatches.matchScore,
          })
          .from(careerMatches)
          .where(inArray(careerMatches.studentId, studentIdsToProcess));

        for (const c of allCareerMatches) {
          const existing = careersByStudent.get(c.studentId);
          if (!existing || (c.matchScore !== null && c.matchScore > (existing.matchScore || 0))) {
            careersByStudent.set(c.studentId, {
              studentId: c.studentId,
              careerTitle: c.careerTitle,
              matchScore: c.matchScore,
            });
          }
        }
      }

      const recentStudents: StudentNeedingAttention[] = studentsToProcess.map((student) => {
        // Get real attendance rate
        const attStats = attendanceByStudent.get(student.id);
        const attendanceRate = attStats && attStats.total > 0
          ? Math.round((attStats.present / attStats.total) * 100)
          : 0;

        // Get assessment status from pre-fetched data
        const studentAssessments = assessmentsByStudent.get(student.id) || [];
        const hasCompleted = studentAssessments.some(a => a.status === "completed");
        const hasInProgress = studentAssessments.some(a => a.status === "in_progress");

        // Get top career from pre-fetched data
        const topCareerMatch = careersByStudent.get(student.id);

        return {
          id: student.id,
          name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
          school: student.schoolId || "Unknown",
          grade: student.classGrade || null,
          attendance: attendanceRate,
          lastActivity: "Recently",
          assessmentStatus: hasCompleted
            ? "completed"
            : hasInProgress
            ? "in_progress"
            : "pending",
          topCareer: topCareerMatch?.careerTitle || null,
          needsAttention: true,
        };
      });

      // Get REAL school performance data
      const schoolPerformance: SchoolPerformance[] = [];

      // Batch fetch all assessments for all school students at once
      if (studentIds.length > 0) {
        const schoolAssessments = await db
          .select({
            userId: assessments.userId,
          })
          .from(assessments)
          .where(inArray(assessments.userId, studentIds));

        const studentsWithAssessments = new Set(schoolAssessments.map(a => a.userId));

        for (const schoolId of schoolIds) {
          const schoolStudents = allStudents.filter(s => s.schoolId === schoolId);
          const schoolStudentIds = schoolStudents.map(s => s.id);

          // Calculate completion rate for this school
          let completionRate = 0;
          if (schoolStudentIds.length > 0) {
            const schoolStudentsWithAssessments = schoolStudentIds.filter(id =>
              studentsWithAssessments.has(id)
            ).length;
            completionRate = Math.round((schoolStudentsWithAssessments / schoolStudentIds.length) * 100);
          }

          // Get school name from pre-fetched assignments or query
          const schoolData = await db
            .select({ name: schools.name })
            .from(schools)
            .where(eq(schools.id, schoolId))
            .limit(1);

          schoolPerformance.push({
            name: schoolData[0]?.name || `School ${schoolId}`,
            students: schoolStudents.length,
            completion: completionRate || 0,
          });
        }
      }

      return successResponse({
        stats: {
          totalStudents,
          activeSchools,
          pendingReports,
          assessmentsThisWeek: assessmentsCount,
          aiCoachUsage,
        } satisfies CounselorDashboardStats,
        recentStudents,
        schoolPerformance,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/counselor/dashboard", method: "GET" });
      return errorResponse("Failed to fetch dashboard data", 500);
    }
  },
  ['counselor', 'admin']
);
