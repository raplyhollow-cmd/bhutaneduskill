/**
 * COUNSELOR DASHBOARD ACTIONS
 *
 * Server actions for counselor dashboard data fetching.
 *
 * NOTE: The dashboard now fetches real data directly from:
 * - /api/counselor/dashboard (stats and students)
 * - /api/ai/insights (AI-powered insights)
 *
 * This file is kept for potential future server-side actions.
 */

import { db } from "@/lib/db";
import { users, counselorAssignments, assessments, attendance, schools } from "@/lib/db/schema";
import { eq, and, desc, count, sql, or, gte } from "drizzle-orm";

export interface CounselorStats {
  totalStudents: number;
  activeSchools: number;
  pendingReports: number;
  assessmentsThisWeek: number;
  aiCoachUsage: number;
}

export interface StudentInsight {
  id: string;
  name: string;
  school: string;
  grade: string | number;
  attendance: number;
  lastActivity: string;
  assessmentStatus: "completed" | "in_progress" | "pending";
  topCareer: string | null;
  needsAttention: boolean;
}

/**
 * Fetch counselor stats - for server-side use only.
 * Client-side dashboard uses /api/counselor/dashboard instead.
 */
export async function fetchCounselorStats(counselorId: string): Promise<CounselorStats> {
  try {
    // Get school assignments
    const assignments = await db.query.counselorAssignments.findMany({
      where: and(
        eq(counselorAssignments.counselorId, counselorId),
        eq(counselorAssignments.isActive, true)
      ),
      columns: { schoolId: true },
    });

    const schoolIds = assignments.map((a) => a.schoolId);

    if (schoolIds.length === 0) {
      return {
        totalStudents: 0,
        activeSchools: 0,
        pendingReports: 0,
        assessmentsThisWeek: 0,
        aiCoachUsage: 0,
      };
    }

    // Get students from assigned schools
    const conditions = schoolIds.map((id) => eq(users.schoolId, id));
    const schoolCondition = conditions.length === 1
      ? conditions[0]
      : sql`(${sql.join(conditions.map(c => sql.raw(c.toString())), sql` OR `)})`;

    const students = await db.query.users.findMany({
      where: and(
        eq(users.type, "student"),
        schoolCondition as any
      ),
    });

    const totalStudents = students.length;
    const studentIds = students.map((s) => s.id);

    // Assessments this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentAssessments = studentIds.length > 0
      ? await db.query.assessments.findMany({
          where: and(
            sql`${assessments.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
            sql`${assessments.completedAt} IS NOT NULL`,
            sql`${assessments.completedAt} >= ${oneWeekAgo.toISOString()}`
          ),
        })
      : [];

    // Calculate pending reports (students with low attendance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let studentsNeedingAttention = 0;
    if (studentIds.length > 0) {
      const attendanceData = await db.query.attendance.findMany({
        where: and(
          sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
          gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
        ),
      });

      const attendanceByStudent = new Map<string, { present: number; total: number }>();
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

      for (const student of students) {
        const attStats = attendanceByStudent.get(student.id);
        const attendanceRate = attStats && attStats.total > 0
          ? (attStats.present / attStats.total) * 100
          : 0;

        if (attendanceRate < 75 || attStats === undefined) {
          studentsNeedingAttention++;
        }
      }
    }

    return {
      totalStudents,
      activeSchools: schoolIds.length,
      pendingReports: studentsNeedingAttention,
      assessmentsThisWeek: recentAssessments.length,
      aiCoachUsage: recentAssessments.length,
    };
  } catch (error) {
    console.error("Error fetching counselor stats:", error);
    return {
      totalStudents: 0,
      activeSchools: 0,
      pendingReports: 0,
      assessmentsThisWeek: 0,
      aiCoachUsage: 0,
    };
  }
}
