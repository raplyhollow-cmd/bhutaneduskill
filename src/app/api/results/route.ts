import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, examResults } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { requireAuth, canAccessSchool } from "@/lib/db/tenant";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const examType = searchParams.get("examType");

    // Determine which results to fetch based on user role
    let whereCondition: any = eq(examResults.userId, currentUser.id);

    // Counselors, teachers, and admins can view other students' results
    if (["counselor", "teacher", "admin"].includes(currentUser.type)) {
      if (studentId) {
        // Verify access to the student (same school for counselor/teacher)
        const student = await db.query.users.findFirst({
          where: eq(users.id, studentId),
        });

        if (!student) {
          return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        if (!canAccessSchool(currentUser, student.schoolId || "")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        whereCondition = eq(examResults.userId, studentId);
      } else if (currentUser.schoolId) {
        // Get all results for students in the same school
        const schoolStudents = await db.query.users.findMany({
          where: eq(users.schoolId, currentUser.schoolId),
        });
        const studentIds = schoolStudents.map((s) => s.id);

        if (studentIds.length > 0) {
          whereCondition = or(...studentIds.map((id) => eq(examResults.userId, id)));
        }
      }
    }

    // Additional filter by exam type if provided
    let results = await db.query.examResults.findMany({
      where: whereCondition,
      orderBy: desc(examResults.examYear),
      with: {
        user: true,
      },
    });

    // Filter by exam type if specified
    if (examType) {
      results = results.filter((r) => r.examType === examType);
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const body = await request.json();
    const { userId, examType, examYear, subjects } = body;

    // Determine whose results to save
    let targetUserId = currentUser.id;
    let enteredBy = currentUser.id;

    // Counselors, teachers, and admins can enter results for students
    if (["counselor", "teacher", "admin"].includes(currentUser.type)) {
      if (userId) {
        const student = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!student) {
          return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        if (!canAccessSchool(currentUser, student.schoolId || "")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        targetUserId = student.id;
      }
    }

    // Calculate total percentage
    const totalPercentage = Math.round(
      subjects.reduce((sum: number, s: any) => sum + s.marks, 0) /
        subjects.reduce((sum: number, s: any) => sum + s.totalMarks, 0) * 100
    );

    // Determine division based on Bhutan grading system
    let division = "Third";
    if (totalPercentage >= 60) division = "Second";
    if (totalPercentage >= 75) division = "First";
    if (totalPercentage >= 85) division = "Distinction";

    const [result] = await db
      .insert(examResults)
      .values({
        id: `exam_${Date.now()}`,
        userId: targetUserId,
        examName: "Exam",
        examType,
        examYear,
        academicYear: new Date().getFullYear().toString(),
        term: "1",
        examDate: new Date().toISOString().split('T')[0],
        subjects,
        totalMarks: subjects.reduce((sum: number, s: any) => sum + s.totalMarks, 0),
        maxTotalMarks: subjects.reduce((sum: number, s: any) => sum + s.totalMarks, 0),
        totalMarksObtained: subjects.reduce((sum: number, s: any) => sum + s.marks, 0),
        percentage: totalPercentage,
        totalPercentage: totalPercentage,
        grade: division,
        division,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Results save error:", error);
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
  }
}
