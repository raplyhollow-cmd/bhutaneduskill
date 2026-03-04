/**
 * STUDENT HOMEWORK API
 *
 * GET /api/student/homework - List assigned homework (sorted by due date)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { homework, enrollments, homeworkSubmissions, classes, subjects, users } from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import type { HomeworkSubmission } from "@/lib/db/schema";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/student/homework - List assigned homework (sorted by due date)
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser, userId } = auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, submitted, all

    try {
      // Get student's class enrollments using db.select()
      const studentEnrollmentsResult = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, currentUser.id));

      const classIds = studentEnrollmentsResult.map(e => e.classId);

      if (classIds.length === 0) {
        return successResponse({ homework: [] });
      }

      // Get homework for student's classes using db.select()
      const allHomeworkResult = await db
        .select({
          id: homework.id,
          classId: homework.classId,
          subjectId: homework.subjectId,
          title: homework.title,
          description: homework.description,
          dueDate: homework.dueDate,
          assignedDate: homework.assignedDate,
          totalPoints: homework.totalPoints,
          passingScore: homework.passingScore,
          isPublished: homework.isPublished,
          // Class info
          className: classes.name,
          classGrade: classes.grade,
          classSection: classes.section,
          // Subject info
          subjectName: subjects.name,
          subjectCode: subjects.code,
        })
        .from(homework)
        .innerJoin(classes, eq(homework.classId, classes.id))
        .leftJoin(subjects, eq(homework.subjectId, subjects.id))
        .where(
          and(
            inArray(homework.classId, classIds),
            eq(homework.isPublished, true)
          )
        )
        .orderBy(asc(homework.dueDate));

      // Get submissions to determine status using db.select()
      const submissionsResult = await db
        .select()
        .from(homeworkSubmissions)
        .where(eq(homeworkSubmissions.studentId, currentUser.id));

      const submissionMap = new Map<string, HomeworkSubmission>(
        submissionsResult.map(s => [s.homeworkId, s])
      );

      // Enrich homework with status
      const enrichedHomework = allHomeworkResult.map(hw => {
        const submission = submissionMap.get(hw.id);
        const now = new Date();
        const dueDate = new Date(hw.dueDate);

        let hwStatus = "pending";
        if (submission) {
          hwStatus = submission.status || "pending";
        } else if (now > dueDate) {
          hwStatus = "overdue";
        }

        return {
          ...hw,
          status: hwStatus,
          submission,
          timeRemaining: dueDate.getTime() - now.getTime(),
        };
      });

      // Filter by status if requested
      let filteredHomework = enrichedHomework;
      if (status === "pending") {
        filteredHomework = enrichedHomework.filter(hw => !submissionMap.has(hw.id) && new Date(hw.dueDate) > new Date());
      } else if (status === "submitted") {
        filteredHomework = enrichedHomework.filter(hw => submissionMap.has(hw.id));
      } else if (status === "overdue") {
        filteredHomework = enrichedHomework.filter(hw => !submissionMap.has(hw.id) && new Date(hw.dueDate) < new Date());
      }

      return successResponse({ homework: filteredHomework });
    } catch (error) {
      logger.error("Student homework fetch error:", error);
      return errorResponse("Failed to fetch homework", 500);
    }
  },
  ['student', 'teacher', 'counselor', 'admin']
);
