import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, attendance, enrollments } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql, SQL } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/teacher/attendance/history
 *
 * Query params:
 * - classId: optional - filter by class
 * - startDate: optional - filter from date
 * - endDate: optional - filter to date
 * - summary: "true" - return summarized student statistics
 *
 * Returns attendance history with optional student summaries
 */
export const GET = createApiRoute(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const summary = searchParams.get("summary") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    // If summary requested, return per-student statistics
    if (summary && classId) {
      // Get all students in the class
      const classEnrollments = await db
        .select({
          id: enrollments.id,
          studentId: enrollments.studentId,
          classId: enrollments.classId,
          status: enrollments.status,
          enrollmentDate: enrollments.enrollmentDate,
          student: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            name: users.name,
          },
        })
        .from(enrollments)
        .leftJoin(users, eq(enrollments.studentId, users.id))
        .where(eq(enrollments.classId, classId));

      const studentIds = classEnrollments.map((e) => e.studentId);

      // Build date conditions
      let dateConditions: SQL[] = [];
      if (startDate) {
        dateConditions.push(gte(attendance.date, startDate));
      }
      if (endDate) {
        dateConditions.push(lte(attendance.date, endDate));
      }

      // Get all attendance records for students in this class
      const whereConditions: SQL[] = studentIds.length > 0
        ? [
            sql`${attendance.studentId} = ANY(${studentIds})`,
            ...dateConditions,
          ]
        : dateConditions;

      const records = await db
        .select()
        .from(attendance)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(attendance.date))
        .limit(limit > 500 ? 500 : limit);

      // Get student details separately
      const studentDetails = await db
        .select({
          id: users.id,
          name: users.name,
          rollNumber: users.rollNumber,
        })
        .from(users)
        .where(eq(users.id, sql`ANY(${studentIds})`));

      const studentMap = new Map(studentDetails.map(s => [s.id, s]));

      // Group by student and calculate statistics
      const studentSummaries = classEnrollments.map((enrollment) => {
        const studentRecords = records.filter((r) => r.studentId === enrollment.studentId);
        const present = studentRecords.filter((r) => r.status === "present").length;
        const absent = studentRecords.filter((r) => r.status === "absent").length;
        const late = studentRecords.filter((r) => r.status === "late").length;
        const excused = studentRecords.filter((r) => r.status === "excused").length;
        const totalDays = studentRecords.length;

        // Calculate attendance percentage (present + excused) / total
        const percentage = totalDays > 0
          ? Math.round(((present + excused) / totalDays) * 100)
          : 0;

        const student = studentMap.get(enrollment.studentId);

        return {
          studentId: enrollment.studentId,
          studentName: student?.name || "Unknown",
          rollNumber: student?.rollNumber || "N/A",
          totalDays,
          present,
          absent,
          late,
          excused,
          percentage,
          // Determine alert level
          alertLevel: percentage < 60 ? "critical" : percentage < 75 ? "warning" : "none",
        };
      });

      // Get daily attendance totals for the class
      const dailyRecords = records.reduce((acc: Record<string, {
        date: string;
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
      }>, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          };
        }
        acc[record.date].total++;
        if (record.status === "present") acc[record.date].present++;
        else if (record.status === "absent") acc[record.date].absent++;
        else if (record.status === "late") acc[record.date].late++;
        else if (record.status === "excused") acc[record.date].excused++;
        return acc;
      }, {});

      const dailyData = Object.values(dailyRecords)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30); // Last 30 days

      return {
        classId,
        students: studentSummaries,
        dailyData,
        summary: {
          totalStudents: studentSummaries.length,
          avgAttendance: studentSummaries.length > 0
            ? Math.round(studentSummaries.reduce((sum, s) => sum + s.percentage, 0) / studentSummaries.length)
            : 0,
          criticalCount: studentSummaries.filter((s) => s.alertLevel === "critical").length,
          warningCount: studentSummaries.filter((s) => s.alertLevel === "warning").length,
        },
      };
    }

    // Default: return raw attendance records with student info
    let whereConditions: SQL[] = [];

    if (classId) {
      whereConditions.push(eq(attendance.classId, classId));
    }

    if (startDate) {
      whereConditions.push(gte(attendance.date, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(attendance.date, endDate));
    }

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        classId: attendance.classId,
        date: attendance.date,
        status: attendance.status,
        notes: attendance.notes,
        recordedBy: attendance.recordedBy,
        createdAt: attendance.createdAt,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          name: users.name,
        },
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.studentId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(attendance.date))
      .limit(limit);

    return {
      records,
      count: records.length,
    };
  },
  ['teacher']
);
