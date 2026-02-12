import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, classes, enrollments, subjects, homework, attendance } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/student/classes - Get student's enrolled classes
 *
 * Returns:
 * - All classes the student is enrolled in
 * - Teacher information for each class
 * - Counts for homework, attendance, classmates
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current student user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

    // Get student's enrollments
    const studentEnrollmentsData = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, currentUser.id),
      with: {
        class: {
          with: {
            teacher: true,
            subject: true,
          },
        },
      },
      orderBy: [desc(enrollments.createdAt)],
    });

    if (!studentEnrollmentsData || studentEnrollmentsData.length === 0) {
      return NextResponse.json({ classes: [] });
    }

    // Enrich with additional data
    const enrichedClasses = await Promise.all(
      studentEnrollmentsData.map(async (enrollmentItem) => {
        const cls = enrollmentItem.class;
        if (!cls) return null;

        // Get classmates count (students in same class)
        const classmatesData = await db.query.enrollments.findMany({
          where: eq(enrollments.classId, cls.id),
        });

        // Get pending homework count
        const pendingHomeworkData = await db.query.homework.findMany({
          where: and(
            eq(homework.classId, cls.id),
            eq(homework.isPublished, true)
          ),
        });

        // Get recent attendance (last 30 days)
        const recentAttendanceData = await db.query.attendance.findMany({
          where: and(
            eq(attendance.studentId, currentUser.id),
            eq(attendance.classId, cls.id)
          ),
          limit: 30,
        });

        // Calculate attendance summary
        const presentDays = recentAttendanceData.filter((a) => a.status === "present").length;
        const absentDays = recentAttendanceData.filter((a) => a.status === "absent").length;
        const lateDays = recentAttendanceData.filter((a) => a.status === "late").length;
        const attendancePercentage = recentAttendanceData.length > 0
          ? Math.round((presentDays / recentAttendanceData.length) * 100)
          : 100;

        return {
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          academicYear: cls.academicYear,
          teacher: cls.teacher ? {
            id: cls.teacher.id,
            name: `${cls.teacher.firstName} ${cls.teacher.lastName || ""}`.trim(),
            email: cls.teacher.email,
          } : null,
          subject: cls.subject ? {
            id: cls.subject.id,
            name: cls.subject.name,
            code: cls.subject.code,
          } : null,
          students: classmatesData.length,
          pendingHomework: pendingHomeworkData.length,
          attendanceSummary: {
            present: presentDays,
            absent: absentDays,
            late: lateDays,
            percentage: attendancePercentage,
          },
          enrolledAt: enrollmentItem.enrolledAt,
          status: enrollmentItem.status,
        };
      })
    );

    // Filter out nulls and sort
    const validClasses = enrichedClasses.filter((c) => c !== null);

    return NextResponse.json({ classes: validClasses });
  } catch (error) {
    console.error("Student classes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes", classes: [] },
      { status: 500 }
    );
  }
}
