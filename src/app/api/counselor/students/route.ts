import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, counselorAssignments, schools, assessments, careerPlans, attendance } from "@/lib/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// GET /api/counselor/students - Get counselor's assigned students
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true },
    });

    if (!currentUser || currentUser.type !== "counselor") {
      return NextResponse.json({ error: "Forbidden - counselors only" }, { status: 403 });
    }

    // Get school assignments for this counselor
    const assignments = await db.query.counselorAssignments.findMany({
      where: and(
        eq(counselorAssignments.counselorId, currentUser.id),
        eq(counselorAssignments.isActive, true)
      ),
      columns: { schoolId: true },
    });

    const schoolIds = assignments.map((a) => a.schoolId);

    if (schoolIds.length === 0) {
      return NextResponse.json({
        students: [],
        stats: {
          totalStudents: 0,
          studentsCompletedAssessments: 0,
          studentsWithCareerPlans: 0,
          studentsNeedingAttention: 0,
        },
      });
    }

    // Get all students from assigned schools
    const allStudents = await db.query.users.findMany({
      where: and(
        eq(users.type, "student"),
        sql`${users.schoolId} IN ${sql.raw(`('${schoolIds.join("','")}')`)}`
      ),
      with: {
        school: true,
      },
    });

    // Get attendance data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Enrich students with assessment and plan data
    const studentsWithData = await Promise.all(
      allStudents.map(async (student) => {
        // Get assessments
        const studentAssessments = await db.query.assessments.findMany({
          where: eq(assessments.userId, student.id),
          columns: { status: true },
        });

        const completedAssessments = studentAssessments.filter((a) => a.status === "completed").length;
        const inProgressAssessments = studentAssessments.some((a) => a.status === "in_progress");

        // Get career plan
        const careerPlan = await db.query.careerPlans.findFirst({
          where: eq(careerPlans.userId, student.id),
          columns: { status: true },
        });

        // Get attendance rate (last 30 days)
        const recentAttendance = await db.query.attendance.findMany({
          where: and(
            eq(attendance.studentId, student.id),
            gte(attendance.date, thirtyDaysAgo.toISOString().split("T")[0])
          ),
        });

        const presentDays = recentAttendance.filter((a) => a.status === "present").length;
        const attendanceRate = recentAttendance.length > 0
          ? Math.round((presentDays / recentAttendance.length) * 100)
          : 0;

        // Determine needs attention
        const needsAttention =
          attendanceRate < 80 ||
          (completedAssessments === 0 && !inProgressAssessments) ||
          (careerPlan?.status !== "completed" && student.classGrade && student.classGrade >= 10);

        // Format last session (placeholder for now - would need sessions table)
        const lastSession = "Not available";

        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName || ""}`.trim(),
          email: student.email || null,
          phone: student.phone || null,
          grade: student.classGrade || null,
          section: student.section || null,
          school: student.school?.name || null,
          counselorId: currentUser.id,
          assessmentStatus:
            completedAssessments > 0
              ? "completed"
              : inProgressAssessments
              ? "in_progress"
              : "pending",
          assessmentsTaken: completedAssessments,
          topCareer: null, // Would need to query career matches
          careerMatch: null,
          planStatus: careerPlan?.status === "completed" ? "completed" : careerPlan ? "in_progress" : "not_started",
          lastSession,
          needsAttention,
          gpa: null, // Would need exam results
          attendanceRate,
        };
      })
    );

    // Calculate stats
    const totalStudents = studentsWithData.length;
    const studentsCompletedAssessments = studentsWithData.filter((s) => s.assessmentStatus === "completed").length;
    const studentsWithCareerPlans = studentsWithData.filter((s) => s.planStatus === "completed").length;
    const studentsNeedingAttention = studentsWithData.filter((s) => s.needsAttention).length;

    return NextResponse.json({
      students: studentsWithData,
      stats: {
        totalStudents,
        studentsCompletedAssessments,
        studentsWithCareerPlans,
        studentsNeedingAttention,
      },
    });
  } catch (error) {
    console.error("Counselor students fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
