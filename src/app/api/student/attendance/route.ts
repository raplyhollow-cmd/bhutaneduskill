import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { attendance as attendanceTable, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * GET /api/student/attendance - Get student's attendance records
 *
 * This is a simpler endpoint that redirects to my-records
 * Returns attendance with statistics
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return authResult;
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "30");

    let conditions = [eq(attendanceTable.studentId, user.id)];

    if (startDate) {
      conditions.push(gte(attendanceTable.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendanceTable.date, endDate));
    }

    const records = await db.query.attendance.findMany({
      where: and(...conditions),
      orderBy: [desc(attendanceTable.date)],
      limit,
    });

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === "present").length,
      absent: records.filter(r => r.status === "absent").length,
      late: records.filter(r => r.status === "late").length,
      excused: records.filter(r => r.status === "excused").length,
      sickLeave: records.filter(r => r.status === "sick_leave").length,
      percentage: records.length > 0
        ? Math.round((records.filter(r => r.status === "present" || r.status === "excused").length / records.length) * 100)
        : 0,
    };

    // Transform records for frontend
    const attendance = records.map((r: any) => ({
      id: r.id,
      date: r.date,
      status: r.status,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime || null,
      notes: r.notes,
      className: r.classId, // Will be enriched with join if needed
    }));

    return NextResponse.json({ attendance, stats });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance", attendance: [], stats: null }, { status: 500 });
  }
}
