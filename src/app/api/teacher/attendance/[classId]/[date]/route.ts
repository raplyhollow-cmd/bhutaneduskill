import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { attendance, users, classes, enrollments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: Promise<{ classId: string; date: string }>;
}

// GET /api/teacher/attendance/[classId]/[date] - Get attendance for class on date
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { classId, date } = await params;
    const authResult = await requireAuth(['teacher']);
    if ('error' in authResult) {
      return authResult;
    }
    const { userId, user } = authResult;

    // Get class students
    const classEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.classId, classId),
        eq(enrollments.status, "active")
      ),
      with: {
        student: true,
      },
    });

    const studentIds = classEnrollments.map(e => e.studentId);

    // Get existing attendance records for this date
    const existingRecords = await db.query.attendance.findMany({
      where: and(
        eq(attendance.classId, classId),
        eq(attendance.date, date)
      ),
    });

    const attendanceMap = new Map(existingRecords.map(r => [r.studentId, r]));

    // Combine students with their attendance
    const studentsWithAttendance = classEnrollments.map(enrollment => ({
      student: enrollment.student,
      attendance: attendanceMap.get(enrollment.studentId) || null,
    }));

    return NextResponse.json({
      date: date,
      classId: classId,
      students: studentsWithAttendance,
    });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/teacher/attendance/[classId]/[date] - Mark attendance for entire class
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { classId, date } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attendance: attendanceData } = body; // Array of { studentId, status, notes, reason }

    if (!Array.isArray(attendanceData)) {
      return NextResponse.json({ error: "Invalid attendance data" }, { status: 400 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    // Process each attendance record
    const results = await Promise.all(
      attendanceData.map(async (record: any) => {
        const { studentId, status, notes, reason, checkInTime, checkOutTime } = record;

        // Check for existing record
        const existing = await db.query.attendance.findFirst({
          where: and(
            eq(attendance.classId, classId),
            eq(attendance.studentId, studentId),
            eq(attendance.date, date)
          ),
        });

        if (existing) {
          // Update existing
          const [updated] = await db.update(attendance)
            .set({
              status,
              notes,
              reason: reason as any,
              checkInTime,
              recordedBy: currentUser.id,
              updatedAt: now,
            } as any)
            .where(eq(attendance.id, existing.id))
            .returning();

          return updated;
        } else {
          // Create new
          const [created] = await db.insert(attendance)
            .values({
              id: `att_${Date.now()}_${studentId}`,
              schoolId: currentUser.schoolId,
              classId: classId,
              studentId,
              date: date,
              status,
              notes,
              reason: reason as any,
              checkInTime,
              recordedBy: currentUser.id,
              entryMethod: "manual",
              createdAt: now,
              updatedAt: now,
            } as any)
            .returning();

          return created;
        }
      })
    );

    return NextResponse.json({ attendance: results, count: results.length });
  } catch (error) {
    console.error("Attendance marking error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}
