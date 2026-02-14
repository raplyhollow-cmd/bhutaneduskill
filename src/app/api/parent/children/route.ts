import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, classes, enrollments, attendance, homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/parent/children - Get parent's linked children
 *
 * Returns:
 * - All children linked to this parent
 * - With class info, attendance summary, homework status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current parent user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.type !== "parent") {
      return NextResponse.json({ error: "Forbidden - Parents only" }, { status: 403 });
    }

    // Get all children where parentId = current user
    const childrenData = await db.query.users.findMany({
      where: eq(users.parentId, currentUser.id),
      orderBy: [desc(users.createdAt)],
    });

    if (!childrenData || childrenData.length === 0) {
      return NextResponse.json({ children: [] });
    }

    // Enrich each child with their class, attendance, homework info
    const enrichedChildren = await Promise.all(
      childrenData.map(async (childData) => {
        // Get child's current enrollment
        const childEnrollmentsData = await db.query.enrollments.findMany({
          where: and(
            eq(enrollments.studentId, childData.id),
            eq(enrollments.status, "active")
          ),
          with: {
            class: true,
          },
          orderBy: [desc(enrollments.createdAt)],
          limit: 1,
        });

        const currentEnrollmentItem = childEnrollmentsData[0];
        const currentClassData = currentEnrollmentItem?.class?.[0];

        // Get attendance summary (last 30 days)
        const recentAttendanceData = currentClassData
          ? await db.query.attendance.findMany({
              where: and(
                eq(attendance.studentId, childData.id),
                eq(attendance.classId, (currentClassData as any).id)
              ),
              limit: 30,
            })
          : [];

        const presentDays = recentAttendanceData.filter((a) => a.status === "present").length;
        const absentDays = recentAttendanceData.filter((a) => a.status === "absent").length;
        const attendancePercentage = recentAttendanceData.length > 0
          ? Math.round((presentDays / recentAttendanceData.length) * 100)
          : null;

        // Get homework status
        const childHomeworkData = currentClassData
          ? await db.query.homework.findMany({
              where: and(
                eq(homework.classId, currentClassData.id),
                eq(homework.isPublished, true)
              ),
              orderBy: [desc(homework.dueDate)],
              limit: 10,
            })
          : [];

        const homeworkWithStatus = await Promise.all(
          childHomeworkData.map(async (hwItem) => {
            const hwSubmissionItem = await db.query.homeworkSubmissions.findFirst({
              where: eq(homeworkSubmissions.homeworkId, hwItem.id),
            });

            const nowDate = new Date();
            const dueDate = new Date(hwItem.dueDate);
            const isOverdue = !hwSubmissionItem && dueDate < nowDate;

            return {
              id: hwItem.id,
              title: hwItem.title,
              subject: hwItem.subjectId,
              dueDate: hwItem.dueDate,
              status: hwSubmissionItem?.status || (isOverdue ? "overdue" : "pending"),
              isOverdue,
            };
          })
        );

        const pendingHomework = homeworkWithStatus.filter((h) => h.status === "pending" || h.status === "overdue").length;
        const submittedHomework = homeworkWithStatus.filter((h) => h.status === "submitted" || h.status === "graded").length;

        return {
          id: childData.id,
          name: `${childData.firstName} ${childData.lastName || ""}`.trim(),
          firstName: childData.firstName,
          lastName: childData.lastName,
          profilePicture: childData.profilePicture,
          classGrade: childData.classGrade,
          section: childData.section,
          dateOfBirth: childData.dateOfBirth,
          currentClass: currentClassData ? {
            id: (currentClassData as any).id,
            name: (currentClassData as any).name,
            grade: (currentClassData as any).grade,
            section: (currentClassData as any).section,
          } : null,
          attendanceSummary: {
            present: presentDays,
            absent: absentDays,
            percentage: attendancePercentage,
            totalRecorded: recentAttendanceData.length,
          },
          homeworkSummary: {
            pending: pendingHomework,
            submitted: submittedHomework,
            total: childHomeworkData.length,
          },
          upcomingHomework: homeworkWithStatus
            .filter((h) => h.status === "pending" || h.status === "overdue")
            .slice(0, 3),
        };
      })
    );

    return NextResponse.json({ children: enrichedChildren });
  } catch (error) {
    console.error("Parent children fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch children", children: [] },
      { status: 500 }
    );
  }
}
