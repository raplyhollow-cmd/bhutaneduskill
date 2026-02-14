import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, counselorAssignments, assessments, careerMatches, attendance, schools } from "@/lib/db/schema";
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

    // Group attendance by student - declare outside the if block
    const attendanceByStudent = new Map<string, { present: number; total: number }>();

    if (studentIds.length > 0) {
      // Get attendance data
      const attendanceData = await db.query.attendance.findMany({
        where: and(
          sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
          gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
        ),
      });

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

    // Get REAL recent students needing attention for dashboard display
    // Use actual attendance data to identify students who need attention
    const studentsNeedingAttentionList: typeof allStudents = [];
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
    // Fetch all their assessments and career matches in batch first
    const studentsToProcess = studentsNeedingAttentionList.slice(0, 5);
    const studentIdsToProcess = studentsToProcess.map(s => s.id);

    // Build the IN clause string
    const studentIdsList = `('${studentIdsToProcess.join("','")}')`;

    // Batch fetch assessments for these students
    const allStudentAssessments = studentIdsToProcess.length > 0
      ? await db.query.assessments.findMany({
          where: sql`${assessments.userId} IN ${sql.raw(studentIdsList)}`,
          columns: {
            userId: true,
            status: true
          },
          orderBy: [desc(assessments.completedAt)]
        })
      : [];

    // Batch fetch career matches for these students
    const allCareerMatches = studentIdsToProcess.length > 0
      ? await db.query.careerMatches.findMany({
          where: sql`${careerMatches.studentId} IN ${sql.raw(studentIdsList)}`,
          columns: {
            studentId: true,
            careerTitle: true,
            matchScore: true
          },
        })
      : [];

    // Group by student ID for quick lookup
    type AssessmentRow = { userId: string; status: string };
    const assessmentsByStudent = new Map<string, AssessmentRow[]>();
    for (const a of allStudentAssessments) {
      if (!assessmentsByStudent.has(a.userId)) {
        assessmentsByStudent.set(a.userId, []);
      }
      assessmentsByStudent.get(a.userId)!.push(a);
    }

    type CareerMatchRow = { studentId: string; careerTitle: string; matchScore: number };
    const careersByStudent = new Map<string, CareerMatchRow>();
    for (const c of allCareerMatches) {
      if (!careersByStudent.has(c.studentId) || c.matchScore > careersByStudent.get(c.studentId)!.matchScore) {
        careersByStudent.set(c.studentId, { studentId: c.studentId, careerTitle: c.careerTitle!, matchScore: c.matchScore! });
      }
    }

    const recentStudents = studentsToProcess.map((student) => {
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
        grade: student.classGrade || "N/A",
        attendance: attendanceRate,
        lastActivity: "Recently",
        assessmentStatus: hasCompleted
          ? "completed"
          : hasInProgress
          ? "in_progress"
          : "pending" as const,
        topCareer: topCareerMatch?.careerTitle || null,
        needsAttention: true,
      };
    });

    // Get REAL school performance data
    const schoolPerformance = [];
    for (const schoolId of schoolIds) {
      // Get students for this school
      const schoolStudents = allStudents.filter(s => s.schoolId === schoolId);
      const schoolStudentIds = schoolStudents.map(s => s.id);

      // Calculate completion rate for this school
      let completionRate = 0;
      if (schoolStudentIds.length > 0) {
        const schoolAssessments = await db.query.assessments.findMany({
          where: sql`${assessments.userId} IN ${sql.raw(`('${schoolStudentIds.join("','")}')`)}`,
        });

        const studentsWithAssessments = new Set(schoolAssessments.map(a => a.userId)).size;
        completionRate = Math.round((studentsWithAssessments / schoolStudentIds.length) * 100);
      }

      // Get school name
      const schoolData = await db.query.schools.findFirst({
        where: eq(schools.id, schoolId),
        columns: { name: true }
      });

      schoolPerformance.push({
        name: schoolData?.name || `School ${schoolId}`,
        students: schoolStudents.length,
        completion: completionRate || 0,
      });
    }

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
