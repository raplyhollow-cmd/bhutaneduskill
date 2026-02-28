import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users, examResults } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { canAccessSchool } from "@/lib/db/tenant";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const currentUser = auth.user;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const examType = searchParams.get("examType");

    // Determine which results to fetch based on user role
    let whereCondition: ReturnType<typeof eq> | undefined = eq(examResults.userId, currentUser.id);

    // Counselors, teachers, and admins can view other students' results
    if (["counselor", "teacher", "admin"].includes(currentUser.type)) {
      if (studentId) {
        // Verify access to the student (same school for counselor/teacher)
        const studentList = await db
          .select()
          .from(users)
          .where(eq(users.id, studentId))
          .limit(1);
        const student = studentList[0] || null;

        if (!student) {
          return { error: "Student not found", status: 404 };
        }

        if (student.schoolId && !canAccessSchool({ type: currentUser.type, schoolId: currentUser.schoolId }, student.schoolId)) {
          return { error: "Forbidden", status: 403 };
        }

        whereCondition = eq(examResults.userId, studentId);
      } else if (currentUser.schoolId) {
        // Get all results for students in the same school
        const schoolStudents = await db
          .select()
          .from(users)
          .where(eq(users.schoolId, currentUser.schoolId));
        const studentIds = schoolStudents.map((s) => s.id);

        if (studentIds.length > 0) {
          whereCondition = or(...studentIds.map((id) => eq(examResults.userId, id)));
        }
      }
    }

    // Additional filter by exam type if provided
    // Using db.select with leftJoin instead of db.query
    let results = await db
      .select({
        id: examResults.id,
        userId: examResults.userId,
        examName: examResults.examName,
        examType: examResults.examType,
        examYear: examResults.examYear,
        academicYear: examResults.academicYear,
        term: examResults.term,
        examDate: examResults.examDate,
        subjects: examResults.subjects,
        totalMarks: examResults.totalMarks,
        maxTotalMarks: examResults.maxTotalMarks,
        totalMarksObtained: examResults.totalMarksObtained,
        percentage: examResults.percentage,
        totalPercentage: examResults.totalPercentage,
        grade: examResults.grade,
        division: examResults.division,
        rank: examResults.rank,
        remarks: examResults.remarks,
        createdAt: examResults.createdAt,
        updatedAt: examResults.updatedAt,
        // User fields
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(examResults)
      .leftJoin(users, eq(examResults.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(examResults.examYear));

    // Filter by exam type if specified
    if (examType) {
      results = results.filter((r) => r.examType === examType);
    }

    return { results };
  },
  ['student', 'teacher', 'admin', 'school-admin', 'parent', 'counselor']
);

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const currentUser = auth.user;

    const body = await request.json();
    const { userId, examType, examYear, subjects } = body;

    // Determine whose results to save
    let targetUserId = currentUser.id;
    let enteredBy = currentUser.id;

    // Counselors, teachers, and admins can enter results for students
    if (["counselor", "teacher", "admin"].includes(currentUser.type)) {
      if (userId) {
        const studentList = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        const student = studentList[0] || null;

        if (!student) {
          return { error: "Student not found", status: 404 };
        }

        if (student.schoolId && !canAccessSchool({ type: currentUser.type, schoolId: currentUser.schoolId }, student.schoolId)) {
          return { error: "Forbidden", status: 403 };
        }

        targetUserId = student.id;
      }
    }

    // Calculate total percentage
    const totalPercentage = Math.round(
      subjects.reduce((sum: number, s: { marks: number }) => sum + s.marks, 0) /
        subjects.reduce((sum: number, s: { totalMarks: number }) => sum + s.totalMarks, 0) * 100
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
        totalMarks: subjects.reduce((sum: number, s: { totalMarks: number }) => sum + s.totalMarks, 0),
        maxTotalMarks: subjects.reduce((sum: number, s: { totalMarks: number }) => sum + s.totalMarks, 0),
        totalMarksObtained: subjects.reduce((sum: number, s: { marks: number }) => sum + s.marks, 0),
        percentage: totalPercentage,
        totalPercentage: totalPercentage,
        grade: division,
        division,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, result };
  },
  ['teacher', 'admin', 'school-admin', 'counselor']
);
