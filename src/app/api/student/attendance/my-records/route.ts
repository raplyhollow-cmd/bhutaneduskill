import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { attendance, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// GET /api/student/attendance/my-records - Get own attendance records
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "30");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

    let conditions = [eq(attendance.studentId, currentUser.id)];

    if (startDate) {
      conditions.push(gte(attendance.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendance.date, endDate));
    }

    const records = await db.query.attendance.findMany({
      where: and(...conditions),
      orderBy: [desc(attendance.date)],
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

    return NextResponse.json({ records, stats });
  } catch (error) {
    console.error("Attendance records fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}
