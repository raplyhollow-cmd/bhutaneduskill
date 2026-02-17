/**
 * STUDENT SELF CHECK-IN API
 *
 * POST /api/student/attendance/check-in - Record attendance with geolocation/QR code
 * GET /api/student/attendance/check-in - Get today's check-in status
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { attendance, users, enrollments, schools } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

export async function POST(request: NextRequest) {
  try {
    // Require authentication - students only
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;

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

    // Get student's school for location verification
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, user.schoolId),
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Determine target class ID
    let targetClassId = classId;

    if (!targetClassId) {
      // Get student's active enrollment
      const activeEnrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.studentId, userId),
          eq(enrollments.status, "active")
        ),
      });

      targetClassId = activeEnrollment?.classId;
    }

    // Check for existing attendance record today
    const existingAttendance = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.studentId, userId),
        eq(attendance.date, today)
      ),
    });

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

  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to check in", status: 500, details: error instanceof Error ? error.message : String(error) } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get today's check-in status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require authentication - students only
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    const today = new Date().toISOString().split("T")[0];

    // Check for today's attendance record
    const todayAttendance = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.studentId, userId),
        eq(attendance.date, today)
      ),
    });

    const hasCheckedIn = !!todayAttendance;

    return NextResponse.json({
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
    } satisfies ApiSuccess<TodayStatusResponse>);

  } catch (error) {
    console.error("Check-in status error:", error);
    return NextResponse.json(
      { error: "Failed to get status", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
