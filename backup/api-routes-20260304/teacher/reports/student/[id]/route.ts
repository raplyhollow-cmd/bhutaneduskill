/**
 * TEACHER STUDENT REPORT API
 *
 * GET /api/teacher/reports/student/:id - Generate student snapshot report
 * GET /api/teacher/reports/student/:id/pdf - Generate PDF report (placeholder)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, classes, enrollments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateStudentSnapshot, generateBatchSnapshots } from "@/lib/reports/student-snapshot";
import { createApiRoute } from "@/lib/api/route-handler";

interface TeacherReportStudentParams extends Record<string, unknown> {
  id: string;
}

/**
 * GET - Generate student snapshot report
 */
export const GET = createApiRoute<TeacherReportStudentParams>(
  async (request: NextRequest, auth, context) => {
    const { userId, user: currentUser } = auth;
    const { id } = await context!.params!;

    // Get student
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!student || student.type !== 'student') {
      return { error: "Student not found", status: 404 };
    }

    // If teacher, verify student is in their class
    if (currentUser.type === 'teacher') {
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.studentId, id),
          eq(enrollments.status, 'active')
        ))
        .limit(1);

      if (!enrollment) {
        return { error: "Student enrollment not found", status: 404 };
      }

      const [classRecord] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, enrollment.classId))
        .limit(1);

      if (!classRecord || classRecord.teacherId !== userId) {
        return { error: "You can only generate reports for your students", status: 403 };
      }
    }

    const { searchParams } = new URL(request.url);
    const includeAiComment = searchParams.get('ai') === 'true';
    const termStartDate = searchParams.get('startDate') || undefined;
    const termEndDate = searchParams.get('endDate') || undefined;

    // Generate snapshot
    const snapshot = await generateStudentSnapshot(id, {
      includeAiComment,
      termStartDate,
      termEndDate,
    });

    if (!snapshot) {
      return { error: "Failed to generate student report", status: 500 };
    }

    logger.info("Student report generated", {
      studentId: id,
      requestedBy: userId,
      reportType: "snapshot",
    });

    return {
      success: true,
      data: snapshot,
    };
  },
  ['teacher', 'admin', 'school-admin']
);
