import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, homework, homeworkSubmissions, enrollments, classes } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * GET /api/parent/homework - Get children's homework with submission status and grades
 *
 * Query params:
 * - childId: Filter by specific child (optional)
 * - status: Filter by submission status (pending, submitted, graded, overdue)
 *
 * Returns:
 * - All children with their homework
 * - Submission status for each homework
 * - Grades where available
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['parent']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser } = authResult;
  const { searchParams } = new URL(request.url);
  const childIdParam = searchParams.get("childId");
  const status = searchParams.get("status");

  try {
    // Get all children linked to this parent
    const children = await db.query.users.findMany({
      where: eq(users.parentId, currentUser.id),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        classGrade: true,
        section: true,
        profileImage: true,
      },
    });

    if (children.length === 0) {
      return NextResponse.json({
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
    const childEnrollments = await db.query.enrollments.findMany({
      where: and(
        inArray(enrollments.studentId, childIds),
        eq(enrollments.status, "active")
      ),
    });

    const classIds = childEnrollments.map((e) => e.classId);

    if (classIds.length === 0) {
      return NextResponse.json({
        children: filteredChildren,
        homework: [],
      });
    }

    // Get all homework for children's classes
    const allHomework = await db.query.homework.findMany({
      where: and(
        inArray(homework.classId, classIds),
        eq(homework.isPublished, true)
      ),
      orderBy: [desc(homework.dueDate)],
    });

    // Get all submissions for these children
    const allSubmissions = await db.query.homeworkSubmissions.findMany({
      where: inArray(homeworkSubmissions.studentId, childIds),
    });

    // Create a map for quick lookup
    const submissionMap = new Map<string, typeof allSubmissions[0]>();
    for (const submission of allSubmissions) {
      const key = `${submission.homeworkId}-${submission.studentId}`;
      submissionMap.set(key, submission);
    }

    // Get class info for each child
    const classInfoMap = new Map<string, typeof classes.$inferSelect>();
    for (const enrollment of childEnrollments) {
      if (!classInfoMap.has(enrollment.studentId)) {
        const classData = await db.query.classes.findFirst({
          where: eq(classes.id, enrollment.classId),
        });
        if (classData) {
          classInfoMap.set(enrollment.studentId, classData);
        }
      }
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

    return NextResponse.json({
      children: filteredChildren,
      homework: filteredHomework,
    });
  } catch (error) {
    console.error("Parent homework fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch homework data",
        children: [],
        homework: [],
      },
      { status: 500 }
    );
  }
}
