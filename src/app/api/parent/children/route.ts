/**
 * GET /api/parent/children - Fetch parent's linked children
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * SECURITY: FERPA COMPLIANCE
 * - Only returns children that have verified parent-child relationships
 * - Uses parent_to_student join table for verification
 * - Logs any unauthorized access attempts
 *
 * Returns all children linked to the parent via parent_to_student join table,
 * including their grades, attendance info, and class details.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, parents, parentToStudent, enrollments, attendance, homework, homeworkSubmissions, classes } from "@/lib/db/schema";
import { eq, and, desc, inArray, asc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

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

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    logger.info("Fetching children for parent", { route: "/api/parent/children", userId });

    // Get parent record for this user
    const parentRecords = await db
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.userId, userId));

    if (parentRecords.length === 0) {
      logger.warn("No parent record found for user", { userId });
      return successResponse({ children: [] });
    }

    const parentId = parentRecords[0].id;

    // Get all parent-student relationships
    const relationships = await db.select().from(parentToStudent).where(eq(parentToStudent.parentId, parentId));

    if (relationships.length === 0) {
      logger.info("No children linked to parent", { parentId });
      return successResponse({ children: [] });
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
    const linkedChildren = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profilePicture: users.profilePicture,
        classGrade: users.classGrade,
        section: users.section,
        dateOfBirth: users.dateOfBirth,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(and(
        eq(users.type, "student"),
        inArray(users.id, studentIds)
      ));

    if (linkedChildren.length === 0) {
      return successResponse({ children: [] });
    }

    // Enrich each child with their data
    const enrichedChildren: ChildData[] = await Promise.all(
      linkedChildren.map(async (child) => {
        const relationshipInfo = relationshipMap.get(child.id) || {
          relationshipType: "guardian",
          isPrimaryContact: false,
        };

        // Get current enrollment/class
        const enrollmentRecords = await db
          .select()
          .from(enrollments)
          .where(and(
            eq(enrollments.studentId, child.id),
            eq(enrollments.status, "active")
          ))
          .orderBy(desc(enrollments.createdAt))
          .limit(1);

        const currentEnrollment = enrollmentRecords[0];
        // Note: we can't use the `with` clause anymore, so we need to fetch class separately if needed
        // For now, we'll use the classId from enrollment
        const currentClassId = currentEnrollment?.classId || null;

        // Get class data separately if needed
        let currentClassData = null;
        if (currentClassId) {
          const classResult = await db
            .select()
            .from(classes)
            .where(eq(classes.id, currentClassId))
            .limit(1);
          currentClassData = classResult[0] || null;
        }

        // Get attendance summary (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = currentClassData
          ? await db
            .select()
            .from(attendance)
            .where(and(
              eq(attendance.studentId, child.id),
              eq(attendance.classId, currentClassData.id)
            ))
            .limit(30)
          : [];

        const presentDays = attendanceRecords.filter((a) => a.status === "present").length;
        const absentDays = attendanceRecords.filter((a) => a.status === "absent").length;
        const lateDays = attendanceRecords.filter((a) => a.status === "late").length;
        const attendancePercentage = attendanceRecords.length > 0
          ? Math.round(((presentDays + lateDays) / attendanceRecords.length) * 100)
          : null;

        // Get homework status
        const homeworkRecords = currentClassData
          ? await db
            .select()
            .from(homework)
            .where(eq(homework.classId, currentClassData.id))
            .orderBy(desc(homework.dueDate))
            .limit(10)
          : [];

        const homeworkWithStatus = await Promise.all(
          homeworkRecords.map(async (hw) => {
            const submission = await db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.homeworkId, hw.id)).limit(1).then(r => r[0]);

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

    return successResponse({
      children: enrichedChildren,
    });
  },
  ['parent']
);
