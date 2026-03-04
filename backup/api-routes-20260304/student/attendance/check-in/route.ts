/**
 * STUDENT SELF CHECK-IN API
 *
 * POST /api/student/attendance/check-in - Record attendance with geolocation/QR code
 * GET /api/student/attendance/check-in - Get today's check-in status
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, users, enrollments, schools } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * Check-in request body
 */
interface CheckInRequest {
  method: "geolocation" | "qr_code" | "manual";
  classId?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  qrCode?: string;
}

/**
 * Attendance record in response
 */
interface AttendanceRecordResponse {
  id: string;
  date: string;
  checkInTime: string;
  status: string;
  entryMethod: string | null;
  notes: string | null;
  createdAt: Date;
}

/**
 * Check-in response (POST)
 */
interface CheckInResponse {
  attendance: AttendanceRecordResponse;
  action: string;
  message: string;
}

/**
 * Today's status response (GET)
 */
interface TodayStatusResponse {
  hasCheckedIn: boolean;
  canCheckIn: boolean;
  attendance: AttendanceRecordResponse | null;
  message: string;
}

// ============================================================================
// POST - Record student check-in
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    // Parse request body
    let body: CheckInRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const { method, classId, latitude, longitude, accuracy, qrCode } = body;

    // Validate check-in method
    if (method && !["geolocation", "qr_code", "manual"].includes(method)) {
      return NextResponse.json(
        { error: "Invalid check-in method", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Verify user has a school
    if (!user.schoolId) {
      return NextResponse.json(
        { error: "Student not assigned to a school", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get student's school for location verification using db.select (neon-http compatible)
    const schoolResult = await db
      .select()
      .from(schools)
      .where(eq(schools.id, user.schoolId))
      .limit(1);

    const school = schoolResult[0];

    if (!school) {
      return NextResponse.json(
        { error: "School not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Determine target class ID
    let targetClassId = classId;

    if (!targetClassId) {
      // Get student's active enrollment using db.select (neon-http compatible)
      const activeEnrollmentResult = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.studentId, userId),
            eq(enrollments.status, "active")
          )
        )
        .limit(1);

      const activeEnrollment = activeEnrollmentResult[0];
      targetClassId = activeEnrollment?.classId;
    }

    // Check for existing attendance record today using db.select (neon-http compatible)
    const existingAttendanceResult = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, userId),
          eq(attendance.date, today)
        )
      )
      .limit(1);

    const existingAttendance = existingAttendanceResult[0];

    if (existingAttendance) {
      // Already checked in today - return existing record
      return NextResponse.json({
        data: {
          attendance: {
            id: existingAttendance.id,
            date: existingAttendance.date,
            checkInTime: existingAttendance.checkInTime,
            status: existingAttendance.status,
            entryMethod: existingAttendance.entryMethod,
            notes: existingAttendance.notes,
            createdAt: existingAttendance.createdAt,
          },
          action: "already_checked_in",
          message: "You have already checked in today",
        } satisfies CheckInResponse,
      } satisfies ApiSuccess<CheckInResponse>);
    }

    // Determine status based on time (late check-in after 8:30 AM)
    let status: "present" | "late" = "present";
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour > 8 || (hour === 8 && minute > 30)) {
      status = "late";
    }

    // Determine entry method
    const entryMethod = method === "geolocation" ? "app_geolocation"
      : method === "qr_code" ? "app_qr_code"
      : "manual";

    // Create new attendance record
    const attendanceId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const [newAttendance] = await db.insert(attendance)
      .values({
        id: attendanceId,
        studentId: userId,
        schoolId: user.schoolId,
        classId: targetClassId,
        date: today,
        checkInTime: currentTime,
        status,
        notes: method === "geolocation" && latitude && longitude
          ? `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          : method === "qr_code"
          ? `QR Code: ${qrCode || "N/A"}`
          : null,
        entryMethod,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Broadcast attendance update for live dashboard refresh
    if (user.schoolId && targetClassId) {
      const { broadcastAttendanceUpdated } = await import("@/lib/notifications-broadcast");
      const studentName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Student";
      broadcastAttendanceUpdated(user.schoolId, {
        studentId: userId,
        studentName,
        classId: targetClassId,
        date: today,
        status,
        checkInTime: currentTime,
        recordedBy: userId,
      }).catch((err) => {
        // Don't fail the request if broadcast fails
        logger.error("Failed to broadcast attendance update", { error: err });
      });
    }

    return NextResponse.json({
      data: {
        attendance: {
          id: newAttendance.id,
          date: newAttendance.date,
          checkInTime: newAttendance.checkInTime,
          status: newAttendance.status,
          entryMethod: newAttendance.entryMethod,
          notes: newAttendance.notes,
          createdAt: newAttendance.createdAt,
        },
        action: "checked_in",
        message: status === "late" ? "Checked in late" : "Checked in successfully",
      } satisfies CheckInResponse,
    } satisfies ApiSuccess<CheckInResponse>, { status: 201 });
  },
  ["student"]
);

// ============================================================================
// GET - Get today's check-in status
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const today = new Date().toISOString().split("T")[0];

    // Check for today's attendance record using db.select (neon-http compatible)
    const todayAttendanceResult = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, userId),
          eq(attendance.date, today)
        )
      )
      .limit(1);

    const todayAttendance = todayAttendanceResult[0];
    const hasCheckedIn = !!todayAttendance;

    return {
      data: {
        hasCheckedIn,
        canCheckIn: !hasCheckedIn,
        attendance: todayAttendance ? {
          id: todayAttendance.id,
          date: todayAttendance.date,
          checkInTime: todayAttendance.checkInTime,
          status: todayAttendance.status,
          entryMethod: todayAttendance.entryMethod,
          notes: todayAttendance.notes,
          createdAt: todayAttendance.createdAt,
        } : null,
        message: hasCheckedIn
          ? "You have already checked in today"
          : "You can check in now",
      } satisfies TodayStatusResponse,
    } satisfies ApiSuccess<TodayStatusResponse>;
  },
  ["student"]
);
