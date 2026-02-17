import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, attendance as attendanceTable, classes, enrollments } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * GET /api/parent/attendance - Get child's attendance records
 *
 * Query params:
 * - childId: required - the child's user ID
 * - startDate: optional - filter start date
 * - endDate: optional - filter end date
 * - limit: optional - max records (default 30)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['parent']);
    if ('error' in authResult) {
      return authResult;
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "30");

    if (!childId) {
      return NextResponse.json({ error: "childId is required" }, { status: 400 });
    }

    // Verify the child belongs to this parent
    const child = await db.query.users.findFirst({
      where: eq(users.id, childId),
    });

    if (!child || child.parentId !== user.id) {
      return NextResponse.json({ error: "Child not found or access denied" }, { status: 404 });
    }

    // Build conditions
    let conditions = [eq(attendanceTable.studentId, childId)];

    if (startDate) {
      conditions.push(gte(attendanceTable.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendanceTable.date, endDate));
    }

    // Fetch attendance records
    const records = await db.query.attendance.findMany({
      where: and(...conditions),
      orderBy: [desc(attendanceTable.date)],
      limit,
    });

    // Get child's class info
    const childEnrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.studentId, childId),
      with: {
        class: true,
      },
      orderBy: [desc(enrollments.createdAt)],
    });

    const childClass = childEnrollment?.class;

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
    const attendance = records.map(r => ({
      id: r.id,
      date: r.date,
      status: r.status,
      checkInTime: r.checkInTime,
      notes: r.notes,
      class: childClass ? {
        id: (childClass as any).id,
        name: (childClass as any).name,
        grade: (childClass as any).grade,
        section: (childClass as any).section,
      } : null,
    }));

    return NextResponse.json({
      attendance,
      stats,
      child: {
        id: child.id,
        name: `${child.firstName} ${child.lastName || ""}`.trim(),
        classGrade: child.classGrade,
        section: child.section,
      },
    });
  } catch (error) {
    console.error("Parent attendance fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance", attendance: [], stats: null }, { status: 500 });
  }
}
