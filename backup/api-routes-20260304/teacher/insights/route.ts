import { NextRequest } from "next/server";
import { intelligenceEngine } from "@/lib/intelligence/engine";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, studentProgressAnalytics } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

/**
 * GET /api/teacher/insights
 *
 * Get insights for the teacher:
 * - At-risk students in their classes
 * - Students needing attention
 * - Assessment completion alerts
 *
 * Response:
 * {
 *   insights: TeacherInsight[],
 *   atRiskCount: number,
 *   needsAttentionCount: number
 * }
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const schoolId = user.schoolId;

    // Get students with low attendance or grades (at-risk)
    const atRiskStudents = await db
      .select({
        studentId: studentProgressAnalytics.userId,
        riskLevel: studentProgressAnalytics.riskLevel,
        riskFactors: studentProgressAnalytics.riskFactors,
        attendanceRate: studentProgressAnalytics.attendanceRate,
        studentName: users.name,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        grade: users.grade,
        section: users.section,
      })
      .from(studentProgressAnalytics)
      .innerJoin(users, eq(studentProgressAnalytics.userId, users.id))
      .where(
        and(
          eq(users.schoolId, schoolId || ""),
          or(
            eq(studentProgressAnalytics.riskLevel, "high"),
            eq(studentProgressAnalytics.riskLevel, "critical")
          )
        )
      )
      .limit(20);

    // Transform into insights
    const insights = atRiskStudents.map((student) => {
      const factors = student.riskFactors as unknown[] || [];
      const attendance = student.attendanceRate ? parseFloat(student.attendanceRate) : 0;

      return {
        id: `risk-${student.studentId}`,
        type: "alert" as const,
        title: `At-Risk Student: ${student.studentFirstName} ${student.studentLastName}`,
        description: `Risk level: ${student.riskLevel.toUpperCase()}. Attendance: ${(attendance * 100).toFixed(0)}%`,
        studentId: student.studentId,
        studentName: student.studentName,
        riskLevel: student.riskLevel,
        actionUrl: `/teacher/students/${student.studentId}`,
        actionLabel: "View Student",
        priority: student.riskLevel === "critical" ? 3 : 2,
        data: { factors, attendance },
      };
    });

    const atRiskCount = insights.filter((i) => i.riskLevel === "critical" || i.riskLevel === "high").length;

    logger.info(`Retrieved ${insights.length} insights for teacher ${userId}`);

    return {
      insights,
      atRiskCount,
      needsAttentionCount: insights.length,
    };
  },
  ["teacher"]
);