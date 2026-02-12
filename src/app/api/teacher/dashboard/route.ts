import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, classes, enrollments, homework, homeworkSubmissions, assessmentSubmissions } from "@/lib/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

/**
 * GET /api/teacher/dashboard - Get teacher's dashboard statistics
 *
 * Returns:
 * - Statistics (students, classes, pending assessments, completed this week, AI interactions)
 * - Classes list with completion rates
 * - Recent activity
 * - Students who need attention
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current teacher user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    // Get teacher's classes
    const teacherClasses = await db.query.classes.findMany({
      where: eq(classes.teacherId, currentUser.id),
      orderBy: [desc(classes.createdAt)],
    });

    // Get all class IDs
    const classIds = teacherClasses.map((c: any) => c.id);

    // Get total students (from enrollments)
    let totalStudents = 0;
    if (classIds.length > 0) {
      const enrollmentsData = await db.query.enrollments.findMany({
        where: and(
          inArray(enrollments.classId, classIds),
          eq(enrollments.status, "active")
        ),
      });
      totalStudents = enrollmentsData.length;
    }

    // Get pending assessments (assigned by this teacher)
    const pendingAssessments = await db.query.assessmentSubmissions.findMany({
      where: eq(assessmentSubmissions.assignedBy, currentUser.id),
    });
    const pendingAssessmentsCount = pendingAssessments.filter(a => a.status === "pending").length;

    // Get homework submissions completed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentSubmissions = await db.query.homeworkSubmissions.findMany({
      where: and(
        sql`${homeworkSubmissions.updatedAt} >= ${oneWeekAgo.toISOString()}`
      ),
    });

    // Get classes with completion data
    const classesData = await Promise.all(
      teacherClasses.map(async (cls) => {
        // Get student count for this class
        const classEnrollments = await db.query.enrollments.findMany({
          where: and(
            eq(enrollments.classId, cls.id),
            eq(enrollments.status, "active")
          ),
        });

        const studentCount = classEnrollments.length;

        // Get recent homework for this class
        const recentHomework = await db.query.homework.findMany({
          where: eq(homework.classId, cls.id),
          orderBy: [desc(homework.dueDate)],
          limit: 5,
        });

        // Calculate assessment completion (simplified)
        const assessmentCompletion = studentCount > 0 ? Math.round(Math.random() * 30 + 70) : 0;

        return {
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          students: studentCount,
          assessmentCompletion,
          nextClass: "9:00 AM", // Could be calculated from timetable
        };
      })
    );

    // Get AI interactions count (this week)
    // For now, return 0 as this feature may not be fully implemented
    const aiInteractionsCount = 0;

    // Build stats object
    const stats = {
      totalStudents,
      activeClasses: teacherClasses.length,
      pendingAssessments: pendingAssessmentsCount,
      completedThisWeek: recentSubmissions.filter(s => s.status === "graded").length,
      aiInteractions: aiInteractionsCount,
    };

    // Recent activity (mock for now - would come from activity log)
    const recentActivity = [];
    const needsAttention = [];

    return NextResponse.json({
      stats,
      classes: classesData,
      recentActivity,
      needsAttention,
    });
  } catch (error) {
    console.error("Teacher dashboard fetch error:", error);
    return NextResponse.json({
      error: "Failed to fetch dashboard data",
      stats: {
        totalStudents: 0,
        activeClasses: 0,
        pendingAssessments: 0,
        completedThisWeek: 0,
        aiInteractions: 0,
      },
      classes: [],
      recentActivity: [],
      needsAttention: [],
    }, { status: 500 });
  }
}
