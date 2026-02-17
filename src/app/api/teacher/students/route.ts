import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission, requireAnyPermission } from "@/lib/rbac";
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
  const authResult = await requireAuth(['teacher', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user: currentUser } = authResult;

  // Check RBAC permission for reading students
  const permCheck = await requireAnyPermission(userId, ["users.read", "students.read"]);
  if (permCheck) return permCheck;

  try {
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
    }) as any[];

    // Enrich with attendance, homework data
    const enrichedStudents = await Promise.all(
      classEnrollmentsData.map(async (enrollmentItem) => {
        const studentData = enrollmentItem.student;
        const cls = (enrollmentItem as any).class;
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

        // Get parent/guardian information
        let parentGuardianName: string | null = null;
        let parentGuardianPhone: string | null = null;
        let parentGuardianEmail: string | null = null;

        const studentRecord = studentData as {
          firstName?: string | null;
          lastName?: string | null;
          parentContact?: string | null;
          parentPhone?: string | null;
          emergencyContact?: string | null;
          parentId?: string | null;
        };

        if (studentRecord.parentContact) {
          parentGuardianName = studentRecord.parentContact;
        }
        if (studentRecord.parentPhone) {
          parentGuardianPhone = studentRecord.parentPhone;
        }
        if (studentRecord.emergencyContact) {
          parentGuardianPhone = parentGuardianPhone || studentRecord.emergencyContact;
        }

        // Try to get parent from parentId
        if (studentRecord.parentId) {
          const parentUser = await db.query.users.findFirst({
            where: eq(users.id, studentRecord.parentId),
            columns: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          });
          if (parentUser) {
            parentGuardianName = parentGuardianName || `${parentUser.firstName || ""} ${parentUser.lastName || ""}`.trim() || null;
            parentGuardianEmail = parentUser.email;
            if (!parentGuardianPhone && parentUser.phone) {
              parentGuardianPhone = parentUser.phone;
            }
          }
        }

        return {
          id: studentData.id,
          name: `${studentRecord.firstName || ""} ${studentRecord.lastName || ""}`.trim(),
          firstName: studentRecord.firstName || "",
          lastName: studentRecord.lastName || "",
          email: studentData.email,
          profilePicture: (studentData as any).profilePicture || null,
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
          enrolledAt: enrollmentItem.enrollmentDate,
          parentGuardianName,
          parentGuardianPhone,
          parentGuardianEmail,
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
    logger.error("Teacher students fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students", students: [], studentsByClass: [] },
      { status: 500 }
    );
  }
}
