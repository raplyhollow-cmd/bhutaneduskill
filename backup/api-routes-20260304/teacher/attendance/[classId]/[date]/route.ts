import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { attendance, users, classes, enrollments } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

interface AttendanceRecord {
  studentId: string;
  status: string;
  notes?: string;
  reason?: string | null;
  checkInTime?: string;
  checkOutTime?: string;
}

// GET /api/teacher/attendance/[classId]/[date] - Get attendance for class on date
export const GET = createApiRoute<{ classId: string; date: string }>(
  async (request, auth, context) => {
    const params = await context!.params;
    const classId = params.classId;
    const date = params.date;

    // Get class students with student data via leftJoin
    const classEnrollments = await db.select({
      enrollmentId: enrollments.id,
      studentId: enrollments.studentId,
      classId: enrollments.classId,
      status: enrollments.status,
      enrollmentDate: enrollments.enrollmentDate,
      // Student fields
      student: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        clerkUserId: users.clerkUserId,
      },
    })
    .from(enrollments)
    .leftJoin(users, eq(enrollments.studentId, users.id))
    .where(
      and(
        eq(enrollments.classId, classId),
        eq(enrollments.status, "active")
      )
    );

    const studentIds = classEnrollments.map(e => e.studentId);

    // Get existing attendance records for this date
    const existingRecords = await db.select().from(attendance).where(
      and(
        eq(attendance.classId, classId),
        eq(attendance.date, date)
      )
    );

    const attendanceMap = new Map(existingRecords.map(r => [r.studentId, r]));

    // Combine students with their attendance
    const studentsWithAttendance = classEnrollments.map(enrollment => ({
      student: enrollment.student,
      attendance: attendanceMap.get(enrollment.studentId) || null,
    }));

    return {
      date: date,
      classId: classId,
      students: studentsWithAttendance,
    };
  },
  ['teacher']
);

// POST /api/teacher/attendance/[classId]/[date] - Mark attendance for entire class
export const POST = createApiRoute<{ classId: string; date: string }>(
  async (request, auth, context) => {
    const params = await context!.params;
    const classId = params.classId;
    const date = params.date;
    const { user } = auth;

    const body = await request.json();
    const { attendance: attendanceData } = body; // Array of { studentId, status, notes, reason }

    if (!Array.isArray(attendanceData)) {
      return {
        error: "Invalid attendance data",
        status: 400
      };
    }

    const now = new Date();

    // Process each attendance record
    const results = await Promise.all(
      attendanceData.map(async (record: AttendanceRecord) => {
        const { studentId, status, notes, reason, checkInTime, checkOutTime } = record;

        // Check for existing record
        const [existing] = await db.select().from(attendance).where(
          and(
            eq(attendance.classId, classId),
            eq(attendance.studentId, studentId),
            eq(attendance.date, date)
          )
        ).limit(1);

        if (existing && existing.id) {
          // Update existing
          const [updated] = await db.update(attendance)
            .set({
              status,
              notes,
              reason: reason ?? null,
              checkInTime,
              recordedBy: user.id,
              updatedAt: now,
            })
            .where(eq(attendance.id, existing.id))
            .returning();

          return updated;
        } else {
          // Create new
          const [created] = await db.insert(attendance)
            .values({
              id: `att_${Date.now()}_${studentId}`,
              schoolId: user.schoolId ?? null,
              classId: classId,
              studentId,
              date: date,
              status,
              notes,
              reason: reason ?? null,
              checkInTime,
              recordedBy: user.id,
              entryMethod: "manual",
              createdAt: now,
              updatedAt: now,
            })
            .returning();

          return created;
        }
      })
    );

    return { attendance: results, count: results.length };
  },
  ['teacher']
);
