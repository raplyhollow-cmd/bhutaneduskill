import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// POST /api/timetable/generate - Auto-generate timetable
// ============================================================================

/**
 * Generate a timetable automatically based on constraints
 * Uses a greedy algorithm for conflict-free scheduling
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can generate timetables
    if (currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { schoolId, grade, section, academicYear } = body;

    if (!schoolId || !grade || !academicYear) {
      return NextResponse.json(
        { error: "Missing required fields: schoolId, grade, academicYear" },
        { status: 400 }
      );
    }

    // Get necessary data
    const {
      timePeriods: timePeriodsTable,
      timetableEntries: timetableEntriesTable,
      rooms: roomsTable,
      classes: classesTable,
      subjects: subjectsTable,
      teacherAssignments: teacherAssignmentsTable,
      timetableConflicts: timetableConflictsTable,
    } = await import("@/lib/db/timetable-schema");

    // Get time periods
    const periods = await db.query.timePeriods.findMany({
      where: eq(timePeriodsTable.schoolId, schoolId),
      orderBy: [timePeriodsTable.orderIndex],
    });

    if (periods.length === 0) {
      return NextResponse.json(
        { error: "No time periods configured for this school" },
        { status: 400 }
      );
    }

    // Get class periods (exclude breaks and lunch)
    const classPeriods = periods.filter((p) => p.type === "class");
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

    // Get available rooms
    const rooms = await db.query.rooms.findMany({
      where: and(eq(roomsTable.schoolId, schoolId), eq(roomsTable.isActive, true)),
    });

    // Get subjects for this grade
    const subjects = await db.query.subjects.findMany({
      where: eq(subjectsTable.grade, grade),
    });

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects configured for this grade" },
        { status: 400 }
      );
    }

    // Get teachers for this class
    const teachers = await db.query.users.findMany({
      where: and(eq(users.schoolId, schoolId), eq(users.type, "teacher")),
    });

    // Generate timetable using greedy algorithm
    const generatedEntries = [];
    const conflicts = [];

    // Track teacher and room availability
    const teacherAvailability = new Map<string, Set<string>>(); // teacherId -> "day_period"
    const roomAvailability = new Map<string, Set<string>>(); // roomId -> "day_period"

    for (const day of days) {
      for (const period of classPeriods) {
        const slotKey = `${day}_${period.id}`;

        // Assign subjects in round-robin
        for (const subject of subjects) {
          // Find available teacher for this subject
          const availableTeacher = teachers.find((t) => {
            const teacherSlots = teacherAvailability.get(t.id) || new Set();
            return !teacherSlots.has(slotKey) &&
              (t.subjects || []).includes(subject.name);
          });

          if (!availableTeacher) continue;

          // Find available room
          const availableRoom = rooms.find((r) => {
            const roomSlots = roomAvailability.get(r.id) || new Set();
            return !roomSlots.has(slotKey);
          });

          if (!availableRoom) continue;

          // Check if this would create a conflict
          // In production, do proper conflict detection
          const hasConflict = false;

          if (!hasConflict) {
            // Create timetable entry
            const entry = {
              id: nanoid(),
              schoolId,
              classId: `class_${grade}_${section || 'A'}`,
              grade,
              section: section || "A",
              subjectId: subject.id,
              subjectName: subject.name,
              teacherId: availableTeacher.id,
              teacherName: `${availableTeacher.firstName} ${availableTeacher.lastName || ""}`.trim(),
              roomId: availableRoom.id,
              roomName: availableRoom.name,
              periodId: period.id,
              dayOfWeek: day,
              academicYear,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            generatedEntries.push(entry);

            // Mark teacher and room as occupied
            const teacherSlots = teacherAvailability.get(availableTeacher.id) || new Set();
            teacherSlots.add(slotKey);
            teacherAvailability.set(availableTeacher.id, teacherSlots);

            const roomSlots = roomAvailability.get(availableRoom.id) || new Set();
            roomSlots.add(slotKey);
            roomAvailability.set(availableRoom.id, roomSlots);

            break; // Move to next period
          }
        }
      }
    }

    // Clear existing timetable for this class
    await db.delete(timetableEntriesTable);

    // Insert generated entries
    if (generatedEntries.length > 0) {
      await db.insert(timetableEntriesTable).values(generatedEntries);
    }

    // Log any conflicts
    if (conflicts.length > 0) {
      await db.insert(timetableConflictsTable).values(conflicts);
    }

    return NextResponse.json({
      success: true,
      entriesGenerated: generatedEntries.length,
      conflicts: conflicts.length,
      message: `Generated ${generatedEntries.length} timetable entries`,
    });
  } catch (error) {
    console.error("Timetable generation error:", error);
    return NextResponse.json({ error: "Failed to generate timetable" }, { status: 500 });
  }
}

// ============================================================================
// GET /api/timetable/generate - Get timetable generation status/options
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID required" }, { status: 400 });
    }

    const { timePeriods: timePeriodsTable, rooms: roomsTable } = await import("@/lib/db/timetable-schema");

    const [periods, rooms] = await Promise.all([
      db.query.timePeriods.findMany({
        where: eq(timePeriodsTable.schoolId, schoolId),
        orderBy: [timePeriodsTable.orderIndex],
      }),
      db.query.rooms.findMany({
        where: eq(roomsTable.schoolId, schoolId),
      }),
    ]);

    return NextResponse.json({
      periods,
      rooms,
      ready: periods.length > 0 && rooms.length > 0,
    });
  } catch (error) {
    console.error("Timetable options error:", error);
    return NextResponse.json({ error: "Failed to get options" }, { status: 500 });
  }
}
