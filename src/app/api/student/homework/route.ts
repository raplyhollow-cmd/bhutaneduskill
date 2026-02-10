import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { homework, users, classes, enrollments, homeworkSubmissions } from "@/lib/db/schema";
import { eq, and, or, asc, inArray } from "drizzle-orm";

// GET /api/student/homework - List assigned homework (sorted by due date)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, submitted, all

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

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

    const submissionMap = new Map(submissions.map(s => [s.homeworkId, s]));

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
    console.error("Student homework fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch homework" }, { status: 500 });
  }
}
