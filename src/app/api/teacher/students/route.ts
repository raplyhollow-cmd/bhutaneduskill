import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, classes, enrollments, homeworkSubmissions, attendance, homework } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * GET /api/teacher/students - Get teacher's students across all classes
 *
 * Returns:
 * - All students taught by this teacher
 * - With class info, attendance summary, homework status
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

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    // Get teacher's classes
    const teacherClasses = await db.query.classes.findMany({
      where: eq(classes.teacherId, currentUser.id),
      orderBy: [desc(classes.createdAt)],
    });

    if (!teacherClasses || teacherClasses.length === 0) {
      return NextResponse.json({ students: [], classes: [] });
    }

    const classIds = teacherClasses.map((c) => c.id);

    // Get all enrollments for teacher's classes
    const classEnrollmentsData = await db.query.enrollments.findMany({
      where: and(
        inArray(enrollments.classId, classIds),
        eq(enrollments.status, "active")
      ),
      with: {
        student: true,
        class: true,
      },
    });

    // Enrich with attendance, homework data
    const enrichedStudents = await Promise.all(
      classEnrollmentsData.map(async (enrollmentItem) => {
        const studentData = enrollmentItem.student;
        const cls = enrollmentItem.class;
        if (!studentData || !cls) return null;

        // Get attendance summary (last 30 days)
        const recentAttendanceData = await db.query.attendance.findMany({
          where: and(
            eq(attendance.studentId, studentData.id),
            eq(attendance.classId, cls.id)
          ),
          limit: 30,
        });

        const presentDays = recentAttendanceData.filter((a) => a.status === "present").length;
        const absentDays = recentAttendanceData.filter((a) => a.status === "absent").length;
        const attendancePercentage = recentAttendanceData.length > 0
          ? Math.round((presentDays / recentAttendanceData.length) * 100)
          : null;

        // Get homework submissions count
        const hwSubmissionsData = await db.query.homeworkSubmissions.findMany({
          where: eq(homeworkSubmissions.studentId, studentData.id),
        });

        const submittedCount = hwSubmissionsData.filter((h) => h.status === "submitted").length;
        const gradedCount = hwSubmissionsData.filter((h) => h.status === "graded").length;
        const pendingCount = hwSubmissionsData.filter((h) => h.status === "draft").length;

        return {
          id: studentData.id,
          name: `${studentData.firstName} ${studentData.lastName || ""}`.trim(),
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email,
          profilePicture: studentData.profilePicture,
          classGrade: cls.grade,
          section: cls.section,
          className: cls.name,
          classId: cls.id,
          rollNumber: enrollmentItem.rollNumber,
          attendanceSummary: {
            present: presentDays,
            absent: absentDays,
            percentage: attendancePercentage,
            totalRecorded: recentAttendanceData.length,
          },
          homeworkSummary: {
            submitted: submittedCount,
            graded: gradedCount,
            pending: pendingCount,
            total: hwSubmissionsData.length,
          },
          enrolledAt: enrollmentItem.enrolledAt,
        };
      })
    );

    // Filter out nulls and group by class
    const validStudents = enrichedStudents.filter((s) => s !== null);

    // Group students by class
    const studentsByClass = teacherClasses.map((cls) => ({
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      section: cls.section,
      students: validStudents.filter((s) => s.classId === cls.id),
    }));

    return NextResponse.json({
      students: validStudents,
      studentsByClass,
      totalStudents: validStudents.length,
    });
  } catch (error) {
    console.error("Teacher students fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students", students: [], studentsByClass: [] },
      { status: 500 }
    );
  }
}
