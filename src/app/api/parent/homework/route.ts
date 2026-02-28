import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, homework, homeworkSubmissions, enrollments, classes, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

/**
 * GET /api/parent/homework - Get children's homework with submission status and grades
 *
 * SECURITY: FERPA COMPLIANCE
 * - Only returns homework for verified children via parent_to_student table
 * - Logs unauthorized access attempts
 *
 * Query params:
 * - childId: Filter by specific child (optional)
 * - status: Filter by submission status (pending, submitted, graded, overdue)
 *
 * Returns:
 * - All children with their homework
 * - Submission status for each homework
 * - Grades where available
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser } = auth;
    const { searchParams } = new URL(request.url);
    const childIdParam = searchParams.get("childId");
    const status = searchParams.get("status");

    try {
      // FERPA COMPLIANCE: Get parent record first
      const parentRecords = await db
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.userId, currentUser.id));

      if (parentRecords.length === 0) {
        return successResponse({
          children: [],
          homework: [],
        });
      }

      const parentId = parentRecords[0].id;

      // Get all parent-student relationships
      const relationships = await db
      .select()
      .from(parentToStudent)
      .where(eq(parentToStudent.parentId, parentId));

      if (relationships.length === 0) {
        return successResponse({
          children: [],
          homework: [],
        });
      }

      const studentIds = relationships.map((r) => r.studentId);

      // If specific child requested, verify it's in the verified list
      if (childIdParam && !studentIds.includes(childIdParam)) {
        logger.security("ferpa_violation_attempt", {
          userId: currentUser.id,
          requestedChildId: childIdParam,
          verifiedChildIds: studentIds,
          route: "/api/parent/homework",
        });
        return forbiddenResponse("Child not found or access denied");
      }

      // Get all verified children
      const children = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        classGrade: users.classGrade,
        section: users.section,
        profilePicture: users.profilePicture,
      })
      .from(users)
      .where(and(
        eq(users.type, "student"),
        inArray(users.id, studentIds)
      ));

      if (children.length === 0) {
        return successResponse({
          children: [],
          homework: [],
        });
      }

      // Filter by specific child if requested
      const filteredChildren = childIdParam
        ? children.filter((c) => c.id === childIdParam)
        : children;

      const childIds = filteredChildren.map((c) => c.id);

      // Get active enrollments for all children
      const childEnrollments = await db
      .select()
      .from(enrollments)
      .where(and(
        inArray(enrollments.studentId, childIds),
        eq(enrollments.status, "active")
      ));

      const classIds = childEnrollments.map((e) => e.classId);

      if (classIds.length === 0) {
        return successResponse({
          children: filteredChildren,
          homework: [],
        });
      }

      // Get all homework for children's classes
      const allHomework = await db
      .select()
      .from(homework)
      .where(and(
        inArray(homework.classId, classIds),
        eq(homework.isPublished, true)
      ))
      .orderBy(desc(homework.dueDate));

      // Get all submissions for these children
      const allSubmissions = await db
      .select()
      .from(homeworkSubmissions)
      .where(inArray(homeworkSubmissions.studentId, childIds));

      // Create a map for quick lookup
      const submissionMap = new Map<string, typeof allSubmissions[0]>();
      for (const submission of allSubmissions) {
        const key = `${submission.homeworkId}-${submission.studentId}`;
        submissionMap.set(key, submission);
      }

      // Enrich homework with submission status and child info
      const enrichedHomework = allHomework
        .map((hw) => {
          // Find which children are in this homework's class
          const childrenInClass = childEnrollments
            .filter((e) => e.classId === hw.classId)
            .map((e) => {
              const child = filteredChildren.find((c) => c.id === e.studentId);
              if (!child) return null;

              const submissionKey = `${hw.id}-${child.id}`;
              const submission = submissionMap.get(submissionKey);
              const now = new Date();
              const dueDate = new Date(hw.dueDate);

              // Determine status
              let submissionStatus = "pending";
              let isOverdue = false;
              let score: number | null = null;
              let feedback: string | null = null;
              let submittedAt: Date | null = null;
              let gradedAt: Date | null = null;

              if (submission) {
                submissionStatus = submission.status || "submitted";
                score = submission.score || null;
                feedback = submission.feedback || null;
                submittedAt = submission.submittedAt || null;
                gradedAt = submission.gradedAt || null;

                if (submissionStatus === "submitted" && now > dueDate) {
                  isOverdue = true;
                }
              } else if (now > dueDate) {
                submissionStatus = "overdue";
                isOverdue = true;
              }

              return {
                childId: child.id,
                childName: `${child.firstName} ${child.lastName || ""}`.trim(),
                childFirstName: child.firstName,
                childLastName: child.lastName,
                childClassGrade: child.classGrade,
                childSection: child.section,
                submissionStatus,
                isOverdue,
                score,
                feedback,
                submittedAt: submittedAt?.toISOString() || null,
                gradedAt: gradedAt?.toISOString() || null,
                totalPoints: hw.totalPoints,
                percentage: score !== null ? Math.round((score / hw.totalPoints) * 100) : null,
              };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);

          if (childrenInClass.length === 0) return null;

          return {
            id: hw.id,
            title: hw.title,
            description: hw.description,
            dueDate: hw.dueDate,
            assignedDate: hw.assignedDate,
            totalPoints: hw.totalPoints,
            passingScore: hw.passingScore,
            classId: hw.classId,
            className: null, // Will be populated if needed
            subjectId: hw.subjectId,
            subjectName: null, // Will be populated if needed
            attachments: hw.attachments,
            children: childrenInClass,
          };
        })
        .filter((hw): hw is NonNullable<typeof hw> => hw !== null);

      // Filter by status if requested
      let filteredHomework = enrichedHomework;
      if (status) {
        filteredHomework = enrichedHomework.filter((hw) => {
          if (status === "pending") {
            return hw.children.some((c) => c.submissionStatus === "pending");
          }
          if (status === "submitted") {
            return hw.children.some((c) => c.submissionStatus === "submitted");
          }
          if (status === "graded") {
            return hw.children.some((c) => c.submissionStatus === "graded");
          }
          if (status === "overdue") {
            return hw.children.some((c) => c.isOverdue === true);
          }
          return true;
        });
      }

      return successResponse({
        children: filteredChildren,
        homework: filteredHomework,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/parent/homework", method: "GET" });
      return errorResponse("Failed to fetch homework data", 500);
    }
  },
  ['parent']
);
