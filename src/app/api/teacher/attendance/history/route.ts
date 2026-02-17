import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, classes, attendance, enrollments } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql, SQL } from "drizzle-orm";

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
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const summary = searchParams.get("summary") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    // If summary requested, return per-student statistics
    if (summary && classId) {
      // Get all students in the class
      const classEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.classId, classId),
        with: {
          student: true,
        },
      });

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

      const records = await db.query.attendance.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        orderBy: [desc(attendance.date)],
        limit: limit > 500 ? 500 : limit,
      });

      // Get student details separately
      const studentDetails = await db.query.users.findMany({
        where: eq(users.id, sql`ANY(${studentIds})`),
        columns: {
          id: true,
          name: true,
          rollNumber: true,
        },
      });

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

      return NextResponse.json({
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
      });
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

    const records = await db.query.attendance.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        student: true,
      },
      orderBy: [desc(attendance.date)],
      limit,
    });

    return NextResponse.json({
      records,
      count: records.length,
    });
  } catch (error) {
    console.error("Attendance history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance history" },
      { status: 500 }
    );
  }
}
