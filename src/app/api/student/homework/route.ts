import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { homework, enrollments, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and, or, asc, inArray } from "drizzle-orm";
import type { HomeworkSubmission } from "@/lib/db/schema";

// GET /api/student/homework - List assigned homework (sorted by due date)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['student', 'teacher', 'counselor', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser, userId } = authResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // pending, submitted, all

  try {
    // Get student's class enrollments
    const studentEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, currentUser.id),
    });

    const classIds = studentEnrollments.map(e => e.classId);

    if (classIds.length === 0) {
      return NextResponse.json({ homework: [] });
    }

    // Get homework for student's classes
    const allHomework = await db.query.homework.findMany({
      where: and(
        inArray(homework.classId, classIds),
        eq(homework.isPublished, true)
      ),
      with: {
        class: true,
        subject: true,
        teacher: true,
      },
      orderBy: [asc(homework.dueDate)],
    });

    // Get submissions to determine status
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.studentId, currentUser.id),
    });

    const submissionMap = new Map<string, HomeworkSubmission>(submissions.map(s => [s.homeworkId, s]));

    // Enrich homework with status
    const enrichedHomework = allHomework.map(hw => {
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

    return NextResponse.json({ homework: filteredHomework });
  } catch (error) {
    logger.error("Student homework fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch homework" }, { status: 500 });
  }
}
