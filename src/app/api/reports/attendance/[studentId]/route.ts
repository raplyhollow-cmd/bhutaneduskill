import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { attendance, users } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

interface Params {
  params: { studentId: string };
}

// GET /api/reports/attendance/[studentId] - Student attendance report
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const termId = searchParams.get("termId");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || !["admin", "teacher", "counselor", "parent"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build conditions
    const conditions = [eq(attendance.studentId, params.studentId)];

    if (startDate) {
      conditions.push(gte(attendance.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendance.date, endDate));
    }

    const records = await db.query.attendance.findMany({
      where: and(...conditions),
      orderBy: [desc(attendance.date)],
    });

    // Calculate detailed statistics
    const stats = {
      totalDays: records.length,
      present: records.filter(r => r.status === "present").length,
      absent: records.filter(r => r.status === "absent").length,
      late: records.filter(r => r.status === "late").length,
      excused: records.filter(r => r.status === "excused").length,
      sickLeave: records.filter(r => r.status === "sick_leave").length,
      attendancePercentage: records.length > 0
        ? Math.round((records.filter(r => r.status === "present" || r.status === "late").length / records.length) * 100)
        : 0,
    };

    // Calculate monthly trends
    const monthlyTrends: Record<string, any> = {};
    records.forEach(record => {
      const month = record.date.substring(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      monthlyTrends[month][record.status] = (monthlyTrends[month][record.status] || 0) + 1;
      monthlyTrends[month].total++;
    });

    // Identify patterns
    const patterns = {
      mostAbsentDay: null as string | null,
      consecutiveAbsences: 0,
      needsAttention: false,
    };

    // Check consecutive absences
    let consecutiveCount = 0;
    const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
    for (const record of sortedRecords) {
      if (record.status === "absent") {
        consecutiveCount++;
      } else {
        if (consecutiveCount > patterns.consecutiveAbsences) {
          patterns.consecutiveAbsences = consecutiveCount;
        }
        consecutiveCount = 0;
      }
    }

    // Flag if attendance is below 75%
    patterns.needsAttention = stats.attendancePercentage < 75;

    return NextResponse.json({
      studentId: params.studentId,
      period: { startDate, endDate, termId },
      stats,
      records,
      monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({ month, ...data })),
      patterns,
    });
  } catch (error) {
    console.error("Attendance report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
