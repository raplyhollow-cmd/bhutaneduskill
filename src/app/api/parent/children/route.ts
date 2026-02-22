/**
 * GET /api/parent/children - Fetch parent's linked children
 *
 * Returns all children linked to the parent via parent_to_student join table,
 * including their grades, attendance info, and class details.
 */

import { createSafeHandler } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, parents, students, parentToStudent, classes, enrollments, attendance, homework, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * Child data with attendance and class info
 */
interface ChildData {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  classGrade: number | null;
  section: string | null;
  dateOfBirth: Date | null;
  relationshipType: string;
  isPrimaryContact: boolean;
  currentClass: {
    id: string;
    name: string;
    grade: number;
    section: string | null;
  } | null;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    percentage: number | null;
    totalRecorded: number;
  };
  homeworkSummary: {
    pending: number;
    submitted: number;
    graded: number;
    total: number;
  };
  upcomingHomework: Array<{
    id: string;
    title: string;
    subject: string | null;
    dueDate: string;
    status: string;
    isOverdue: boolean;
  }>;
}

/**
 * Response type
 */
interface ChildrenResponse {
  children: ChildData[];
}

export const GET = createSafeHandler<ChildrenResponse>(async (req) => {
  // Authenticate parent
  const authResult = await requireAuth(['parent']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId, user } = authResult;

  logger.info("Fetching children for parent", { route: "/api/parent/children", userId });

  // Get parent record for this user
  const parentRecords = await db.query.parents.findMany({
    where: eq(parents.userId, userId),
    columns: { id: true },
  });

  if (parentRecords.length === 0) {
    logger.warn("No parent record found for user", { userId });
    return { success: true, data: { children: [] } };
  }

  const parentId = parentRecords[0].id;

  // Get all parent-student relationships
  const relationships = await db.query.parentToStudent.findMany({
    where: eq(parentToStudent.parentId, parentId),
  });

  if (relationships.length === 0) {
    logger.info("No children linked to parent", { parentId });
    return { success: true, data: { children: [] } };
  }

  const studentIds = relationships.map((r) => r.studentId);

  // Build relationship map
  const relationshipMap = new Map(
    relationships.map((r) => [
      r.studentId,
      {
        relationshipType: r.relationshipType,
        isPrimaryContact: r.isPrimaryContact,
      },
    ])
  );

  // Get all students via user table - these are the children linked to this parent
  const linkedChildren = await db.query.users.findMany({
    where: and(
      eq(users.type, "student"),
      inArray(users.id, studentIds)
    ),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
      classGrade: true,
      section: true,
      dateOfBirth: true,
      schoolId: true,
    },
  });

  if (linkedChildren.length === 0) {
    return { success: true, data: { children: [] } };
  }

  // Enrich each child with their data
  const enrichedChildren: ChildData[] = await Promise.all(
    linkedChildren.map(async (child) => {
      const relationshipInfo = relationshipMap.get(child.id) || {
        relationshipType: "guardian",
        isPrimaryContact: false,
      };

      // Get current enrollment/class
      const enrollmentRecords = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.studentId, child.id),
          eq(enrollments.status, "active")
        ),
        with: {
          class: true,
        },
        orderBy: [desc(enrollments.createdAt)],
        limit: 1,
      });

      const currentEnrollment = enrollmentRecords[0];
      const currentClassData = currentEnrollment?.class?.[0];

      // Get attendance summary (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = currentClassData
        ? await db.query.attendance.findMany({
            where: and(
              eq(attendance.studentId, child.id),
              eq(attendance.classId, currentClassData.id)
            ),
            limit: 30,
          })
        : [];

      const presentDays = attendanceRecords.filter((a) => a.status === "present").length;
      const absentDays = attendanceRecords.filter((a) => a.status === "absent").length;
      const lateDays = attendanceRecords.filter((a) => a.status === "late").length;
      const attendancePercentage = attendanceRecords.length > 0
        ? Math.round(((presentDays + lateDays) / attendanceRecords.length) * 100)
        : null;

      // Get homework status
      const homeworkRecords = currentClassData
        ? await db.query.homework.findMany({
            where: eq(homework.classId, currentClassData.id),
            orderBy: [desc(homework.dueDate)],
            limit: 10,
          })
        : [];

      const homeworkWithStatus = await Promise.all(
        homeworkRecords.map(async (hw) => {
          const submission = await db.query.homeworkSubmissions.findFirst({
            where: eq(homeworkSubmissions.homeworkId, hw.id),
          });

          const now = new Date();
          const dueDate = new Date(hw.dueDate);
          const isOverdue = !submission && dueDate < now;

          return {
            id: hw.id,
            title: hw.title,
            subject: hw.subjectId,
            dueDate: hw.dueDate,
            status: submission?.status || (isOverdue ? "overdue" : "pending"),
            isOverdue,
          };
        })
      );

      const pendingHomework = homeworkWithStatus.filter((h) => h.status === "pending" || h.status === "overdue").length;
      const submittedHomework = homeworkWithStatus.filter((h) => h.status === "submitted" || h.status === "graded").length;
      const gradedHomework = homeworkWithStatus.filter((h) => h.status === "graded").length;

      return {
        id: child.id,
        name: `${child.firstName} ${child.lastName || ""}`.trim(),
        firstName: child.firstName,
        lastName: child.lastName,
        profilePicture: child.profilePicture,
        classGrade: child.classGrade,
        section: child.section,
        dateOfBirth: child.dateOfBirth,
        relationshipType: relationshipInfo.relationshipType,
        isPrimaryContact: relationshipInfo.isPrimaryContact,
        currentClass: currentClassData ? {
          id: currentClassData.id,
          name: currentClassData.name,
          grade: currentClassData.grade,
          section: currentClassData.section,
        } : null,
        attendanceSummary: {
          present: presentDays,
          absent: absentDays,
          late: lateDays,
          percentage: attendancePercentage,
          totalRecorded: attendanceRecords.length,
        },
        homeworkSummary: {
          pending: pendingHomework,
          submitted: submittedHomework,
          graded: gradedHomework,
          total: homeworkRecords.length,
        },
        upcomingHomework: homeworkWithStatus
          .filter((h) => h.status === "pending" || h.status === "overdue")
          .slice(0, 3),
      };
    })
  );

  logger.info("Successfully fetched children for parent", {
    route: "/api/parent/children",
    userId,
    count: enrichedChildren.length,
  });

  return {
    success: true,
    data: {
      children: enrichedChildren,
    },
  };
});
