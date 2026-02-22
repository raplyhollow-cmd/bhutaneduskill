import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, students, studentInterventions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// Type for student context data
interface StudentContextData {
  id: string;
  name: string | null;
  photo: string | null;
  classGrade: string | null;
  section: string | null;
  schoolId: string | null;
  gradeTrend: "stable" | "improving" | "declining";
  gradeChange: number;
  attendanceRate: number;
  homeworkCompletion: number;
  recentFlags: string[];
  previousInterventions: Array<{
    type: string;
    date: Date | null;
    outcome: string | null;
  }>;
}

// GET /api/counselor/student-context - Get student context for intervention
export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(["counselor"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return Response.json(
        { error: "Student ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get student details
    const studentRecords = await db
      .select({
        id: students.id,
        userId: students.userId,
        name: users.name,
        photo: users.photo,
        currentClass: students.currentClass,
        section: students.section,
        schoolId: students.schoolId,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentRecords.length === 0) {
      return Response.json(
        { error: "Student not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const student = studentRecords[0];

    // Get previous interventions (using startDate, not scheduledDate)
    const previousInterventions = await db
      .select({
        id: studentInterventions.id,
        type: studentInterventions.type,
        startDate: studentInterventions.startDate,
        outcome: studentInterventions.outcome,
      })
      .from(studentInterventions)
      .where(eq(studentInterventions.studentId, studentId))
      .orderBy(desc(studentInterventions.startDate))
      .limit(5);

    logger.info("Student context retrieved", { studentId });

    const data: StudentContextData = {
      id: student.id,
      name: student.name,
      photo: student.photo,
      classGrade: student.currentClass,
      section: student.section,
      schoolId: student.schoolId,
      gradeTrend: "stable",
      gradeChange: 0,
      attendanceRate: 85,
      homeworkCompletion: 80,
      recentFlags: [],
      previousInterventions: previousInterventions.map((i) => ({
        type: i.type,
        date: i.startDate,
        outcome: i.outcome,
      })),
    };

    return Response.json({
      data,
    } satisfies ApiSuccess<StudentContextData>);
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/student-context", method: "GET" });
    return Response.json(
      { error: "Failed to fetch student context", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
