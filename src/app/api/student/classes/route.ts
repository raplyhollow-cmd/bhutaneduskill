import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, classes, enrollments, subjects, homework, attendance } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * GET /api/student/classes - Get student's enrolled classes
 *
 * Returns:
 * - All classes the student is enrolled in
 * - Teacher information for each class
 * - Counts for homework, attendance, classmates
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['student', 'teacher', 'counselor', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser } = authResult;

  try {
    // Get student's enrollments
    const studentEnrollmentsData = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, currentUser.id))
      .orderBy(desc(enrollments.createdAt));

    if (!studentEnrollmentsData || studentEnrollmentsData.length === 0) {
      return NextResponse.json({ classes: [] });
    }

    // Get all class IDs
    const classIds = studentEnrollmentsData.map(e => e.classId);

    // Get class details
    const classData = await db
      .select()
      .from(classes)
      .where(inArray(classes.id, classIds));

    // Get teacher IDs from classes
    const teacherIds = classData
      .map(c => c.teacherId)
      .filter((id): id is string => id !== null && id !== undefined);

    // Get teacher details
    const teachersData = teacherIds.length > 0
      ? await db
          .select()
          .from(users)
          .where(inArray(users.id, teacherIds))
      : [];

    const teacherMap = new Map(teachersData.map(t => [t.id, t]));

    // Enrich with additional data
    const enrichedClasses = await Promise.all(
      studentEnrollmentsData.map(async (enrollmentItem) => {
        const cls = classData.find(c => c.id === enrollmentItem.classId);
        if (!cls) return null;

        const teacher = cls.teacherId ? teacherMap.get(cls.teacherId) : null;

        // Get classmates count (students in same class)
        const classmatesData = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.classId, cls.id));

        // Get pending homework count
        const pendingHomeworkData = await db
          .select()
          .from(homework)
          .where(
            and(
              eq(homework.classId, cls.id),
              eq(homework.isPublished, true)
            )
          );

        // Get recent attendance (last 30 days)
        const recentAttendanceData = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.studentId, currentUser.id),
              eq(attendance.classId, cls.id)
            )
          )
          .limit(30);

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
          teacher: teacher ? {
            id: teacher.id,
            name: `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
            email: teacher.email || "",
          } : null,
          students: classmatesData.length,
          pendingHomework: pendingHomeworkData.length,
          attendanceSummary: {
            present: presentDays,
            absent: absentDays,
            late: lateDays,
            percentage: attendancePercentage,
          },
          enrolledAt: enrollmentItem.enrollmentDate,
          status: enrollmentItem.status,
        };
      })
    );

    // Filter out nulls and sort
    const validClasses = enrichedClasses.filter((c) => c !== null);

    return NextResponse.json({ classes: validClasses });
  } catch (error) {
    logger.error("Student classes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes", classes: [] },
      { status: 500 }
    );
  }
}
