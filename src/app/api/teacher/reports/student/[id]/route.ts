/**
 * TEACHER STUDENT REPORT API
 *
 * GET /api/teacher/reports/student/:id - Generate student snapshot report
 * GET /api/teacher/reports/student/:id/pdf - Generate PDF report (placeholder)
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, classes, enrollments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateStudentSnapshot, generateBatchSnapshots } from "@/lib/reports/student-snapshot";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Generate student snapshot report
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(['teacher', 'admin', 'school-admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user: currentUser } = authResult;
  const { id } = await context.params;

  try {
    // Get student
    const student = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!student || student.type !== 'student') {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // If teacher, verify student is in their class
    if (currentUser.type === 'teacher') {
      const enrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.studentId, id),
          eq(enrollments.status, 'active')
        ),
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "Student enrollment not found" },
          { status: 404 }
        );
      }

      const classRecord = await db.query.classes.findFirst({
        where: eq(classes.id, enrollment.classId),
      });

      if (!classRecord || classRecord.teacherId !== userId) {
        return NextResponse.json(
          { error: "You can only generate reports for your students" },
          { status: 403 }
        );
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
      return NextResponse.json(
        { error: "Failed to generate student report" },
        { status: 500 }
      );
    }

    logger.info("Student report generated", {
      studentId: id,
      requestedBy: userId,
      reportType: "snapshot",
    });

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    logger.apiError(error, { route: `/api/teacher/reports/student/${id}`, method: "GET" });
    return NextResponse.json(
      { error: "Failed to generate student report" },
      { status: 500 }
    );
  }
}
