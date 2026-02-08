import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { attendance, users, enrollments, classes, schools } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// POST /api/student/attendance/check-in - Check-in via app with geolocation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { latitude, longitude, accuracy, classId } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Get student's school location for verification
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, currentUser.schoolId),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Verify geolocation (within 500 meters of school)
    // In production, you'd use the actual school coordinates
    let locationVerified = true;
    if (latitude && longitude && school.address) {
      // Simple validation - in production, use proper geocoding
      // For now, just store the location
    }

    // Get student's active class for today
    let targetClassId = classId;
    if (!targetClassId) {
      const activeEnrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.studentId, currentUser.id),
          eq(enrollments.status, "active")
        ),
        with: {
          class: true,
        },
      });
      targetClassId = activeEnrollment?.classId;
    }

    if (!targetClassId) {
      return NextResponse.json({ error: "No active class found" }, { status: 400 });
    }

    // Check for existing check-in today
    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.studentId, currentUser.id),
        eq(attendance.date, today)
      ),
    });

    if (existing) {
      // Already checked in, update check-out time instead
      const [updated] = await db.update(attendance)
        .set({
          checkOutTime: currentTime,
          updatedAt: now,
        })
        .where(eq(attendance.id, existing.id))
        .returning();

      return NextResponse.json({ attendance: updated, action: "checked-out" });
    }

    // Create new attendance record
    const [newAttendance] = await db.insert(attendance)
      .values({
        id: `att_${Date.now()}_${currentUser.id}`,
        schoolId: currentUser.schoolId,
        classId: targetClassId,
        studentId: currentUser.id,
        date: today,
        status: "present",
        checkInTime: currentTime,
        checkInLocation: latitude && longitude ? { latitude, longitude, accuracy: accuracy || 0 } : undefined,
        entryMethod: "app_check_in",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ attendance: newAttendance, action: "checked-in" }, { status: 201 });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}

// GET /api/student/attendance/check-in - Get today's check-in status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const todayAttendance = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.studentId, currentUser.id),
        eq(attendance.date, today)
      ),
    });

    return NextResponse.json({
      checkedIn: !!todayAttendance,
      attendance: todayAttendance,
    });
  } catch (error) {
    console.error("Check-in status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
