import { createApiRoute } from "@/lib/api/route-handler";
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
  journalSummary: {
    totalEntries: number;
    recentMood: string | null;
    recentTopics: string[];
    lastEntryDate: string | null;
  };
}

// GET /api/counselor/student-context - Get student context for intervention
export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return { error: "Student ID is required", status: 400 } satisfies ApiErrorResponse;
    }

    // Get student details including settings (for journal data)
    const studentRecords = await db
      .select({
        id: students.id,
        userId: students.userId,
        name: users.name,
        photo: users.photo,
        currentClass: students.currentClass,
        section: students.section,
        schoolId: students.schoolId,
        settings: users.settings,
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

    // Extract journal data from settings
    const settings = (student.settings as Record<string, unknown>) || {};
    const journalEntries = (settings.journalEntries as Array<{
      date: string;
      mood?: string;
      tags?: string[];
      title?: string;
    }>) || [];

    // Build journal summary
    const sortedEntries = [...journalEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recentEntry = sortedEntries[0];
    const recentTopics = sortedEntries
      .slice(0, 5)
      .flatMap((e) => e.tags || [])
      .filter((tag, i, arr) => arr.indexOf(tag) === i)
      .slice(0, 5);

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
      journalSummary: {
        totalEntries: journalEntries.length,
        recentMood: recentEntry?.mood || null,
        recentTopics,
        lastEntryDate: recentEntry?.date || null,
      },
    };

    return { data } satisfies ApiSuccess<StudentContextData>;
  },
  ["counselor"]
);
