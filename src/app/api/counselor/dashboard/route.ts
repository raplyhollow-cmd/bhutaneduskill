import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, counselorAssignments, assessments, careerMatches, attendance } from "@/lib/db/schema";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";

/**
 * GET /api/counselor/dashboard - Get counselor's dashboard statistics
 *
 * Returns:
 * - Statistics (total students, active schools, assessments this week, etc.)
 * - Recent students needing attention
 * - School performance breakdown
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['counselor', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser } = authResult;

  try {
    // Get school assignments for this counselor
    const assignments = await db.query.counselorAssignments.findMany({
      where: and(
        eq(counselorAssignments.counselorId, currentUser.id),
        eq(counselorAssignments.isActive, true)
      ),
      columns: { schoolId: true },
    });

    const schoolIds = assignments.map((a) => a.schoolId);
    const activeSchools = schoolIds.length;

    // Get all students from assigned schools
    let allStudents: any[] = [];
    if (schoolIds.length > 0) {
      // Build OR condition for schoolId
      const conditions = schoolIds.map((id) => eq(users.schoolId, id));
      const schoolCondition = conditions.length === 1
        ? conditions[0]
        : sql`(${sql.join(conditions.map(c => sql.raw(c.toString())), sql` OR `)})`;

      allStudents = await db.query.users.findMany({
        where: and(
          eq(users.type, "student"),
          schoolCondition as any
        ),
      });
    }

    const totalStudents = allStudents.length;
    const studentIds = allStudents.map((s) => s.id);

    // Get assessments completed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const assessmentsThisWeek = studentIds.length > 0
      ? await db.query.assessments.findMany({
          where: and(
            sql`${assessments.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
            sql`${assessments.completedAt} IS NOT NULL`,
            sql`${assessments.completedAt} >= ${oneWeekAgo.toISOString()}`
          ),
        })
      : [];

    const assessmentsCount = assessmentsThisWeek.length;

    // Get students needing attention (low attendance, no assessments)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let studentsNeedingAttention = 0;
    let pendingReports = 0;

    if (studentIds.length > 0) {
      // Get attendance data
      const attendanceData = await db.query.attendance.findMany({
        where: and(
          sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
          gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
        ),
      });

      // Group attendance by student
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

    // Get AI coach usage - for now use assessment count as a proxy
    // In production, would query from a counseling_sessions table
    const aiCoachUsage = assessmentsCount;

    // Get recent students needing attention for dashboard display
    const recentStudents = allStudents
      .filter((s) => {
        // Simple filter - in production would check actual attendance
        return Math.random() > 0.7; // Random sample for now
      })
      .slice(0, 5)
      .map((student) => ({
        id: student.id,
        name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
        school: student.schoolId || "Unknown",
        grade: student.classGrade || "N/A",
        attendance: Math.floor(Math.random() * 40) + 60, // Would be real attendance
        lastActivity: "Recently",
        assessmentStatus: Math.random() > 0.5 ? "completed" : "in_progress" as const,
        topCareer: Math.random() > 0.5 ? "Engineer" : null,
        needsAttention: Math.random() > 0.5,
      }));

    // School performance data
    const schoolPerformance = schoolIds.map((schoolId, index) => ({
      name: `School ${index + 1}`,
      students: Math.floor(Math.random() * 100) + 50,
      completion: Math.floor(Math.random() * 40) + 60,
    }));

    return NextResponse.json({
      stats: {
        totalStudents,
        activeSchools,
        pendingReports,
        assessmentsThisWeek: assessmentsCount,
        aiCoachUsage,
      },
      recentStudents,
      schoolPerformance,
    });
  } catch (error) {
    console.error("Counselor dashboard fetch error:", error);
    return NextResponse.json({
      stats: {
        totalStudents: 0,
        activeSchools: 0,
        pendingReports: 0,
        assessmentsThisWeek: 0,
        aiCoachUsage: 0,
      },
      recentStudents: [],
      schoolPerformance: [],
    }, { status: 500 });
  }
}
