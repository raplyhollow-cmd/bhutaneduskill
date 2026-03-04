/**
 * DATA EXPORT UTILITIES
 *
 * Export data to Excel, PDF, CSV for all portals
 */

import { db } from "@/lib/db";
import { users, schools, assessments } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export interface ExportOptions {
  format: "csv" | "xlsx" | "pdf";
  portal?: string;
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  url?: string;
  filename: string;
  recordCount: number;
  error?: string;
}

/**
 * Export student data
 */
export async function exportStudentData(
  schoolId: string,
  options: ExportOptions = { format: "csv" }
): Promise<ExportResult> {
  try {
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        grade: users.grade,
        section: users.section,
        status: users.type,
      })
      .from(users)
      .where(sql`${users.schoolId} = ${schoolId} AND ${users.type} = 'student'`);

    const filename = `students_${schoolId}_${Date.now()}.${options.format}`;

    // In production, generate actual file and upload to storage
    // For now, return CSV data
    const csv = generateCSV([
      ["ID", "Name", "Email", "Grade", "Section", "Type"],
      ...students.map((s) => [
        s.id,
        s.name,
        s.email || "",
        s.grade || "",
        s.section || "",
        s.status || "student",
      ]),
    ]);

    return {
      success: true,
      filename,
      recordCount: students.length,
      url: `data:text/csv;base64,${Buffer.from(csv).toString("base64")}`,
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      recordCount: 0,
      error: String(error),
    };
  }
}

/**
 * Export assessment results
 */
export async function exportAssessmentResults(
  assessmentId: string,
  options: ExportOptions = { format: "csv" }
): Promise<ExportResult> {
  try {
    const results = await db
      .select({
        studentName: users.name,
        studentEmail: users.email,
        score: sql<number>`assessment_results.score`,
        completedAt: sql<Date>`assessment_results.completed_at`,
      })
      .from(users)
      .innerJoin(
        sql`assessment_results`,
        sql`assessment_results.user_id = users.id`
      )
      .where(sql`assessment_results.assessment_id = ${assessmentId}`);

    const filename = `assessment_results_${assessmentId}_${Date.now()}.${options.format}`;
    const csv = generateCSV([
      ["Student Name", "Email", "Score", "Completed Date"],
      ...results.map((r: any) => [
        r.studentName,
        r.studentEmail || "",
        r.score?.toString() || "",
        r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "",
      ]),
    ]);

    return {
      success: true,
      filename,
      recordCount: results.length,
      url: `data:text/csv;base64,${Buffer.from(csv).toString("base64")}`,
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      recordCount: 0,
      error: String(error),
    };
  }
}

/**
 * Export grades report
 */
export async function exportGradesReport(
  classId: string,
  subjectId: string,
  options: ExportOptions = { format: "csv" }
): Promise<ExportResult> {
  try {
    const studentGrades = await db
      .select({
        studentName: users.name,
        studentId: users.id,
        midterm: sql<number>`COALESCE(grades.midterm, 0)`,
        final: sql<number>`COALESCE(grades.final, 0)`,
        total: sql<number>`COALESCE(grades.midterm, 0) + COALESCE(grades.final, 0)`,
      })
      .from(users)
      .leftJoin(sql`grades`, sql`grades.student_id = users.id`)
      .where(
        sql`${users.classId} = ${classId} AND grades.subject_id = ${subjectId}`
      );

    const filename = `grades_${classId}_${subjectId}_${Date.now()}.${options.format}`;
    const csv = generateCSV([
      ["Student Name", "Student ID", "Midterm", "Final", "Total"],
      ...studentGrades.map((g: any) => [
        g.studentName,
        g.studentId,
        g.midterm?.toString() || "0",
        g.final?.toString() || "0",
        g.total?.toString() || "0",
      ]),
    ]);

    return {
      success: true,
      filename,
      recordCount: studentGrades.length,
      url: `data:text/csv;base64,${Buffer.from(csv).toString("base64")}`,
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      recordCount: 0,
      error: String(error),
    };
  }
}

/**
 * Export ministry workforce data
 */
export async function exportWorkforceData(
  options: ExportOptions = { format: "csv" }
): Promise<ExportResult> {
  try {
    // Get career interests distribution
    const careerData = await db
      .select({
        schoolId: schools.id,
        schoolName: schools.name,
        schoolType: schools.schoolType,
        studentCount: sql<number>`COUNT(DISTINCT users.id)`,
      })
      .from(schools)
      .innerJoin(users, sql`users.school_id = schools.id`)
      .groupBy(schools.id);

    const filename = `workforce_data_${Date.now()}.${options.format}`;
    const csv = generateCSV([
      ["School ID", "School Name", "School Type", "Student Count"],
      ...careerData.map((c: any) => [
        c.schoolId,
        c.schoolName,
        c.schoolType || "",
        c.studentCount?.toString() || "0",
      ]),
    ]);

    return {
      success: true,
      filename,
      recordCount: careerData.length,
      url: `data:text/csv;base64,${Buffer.from(csv).toString("base64")}`,
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      recordCount: 0,
      error: String(error),
    };
  }
}

/**
 * Generate CSV from data
 */
function generateCSV(data: string[][]): string {
  return data.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

/**
 * Download file helper
 */
export function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
