/**
 * TIMETABLE GENERATION API
 *
 * Auto-generate school timetables based on constraints
 * Uses a greedy algorithm for conflict-free scheduling
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-utils";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import {
  users,
  classes,
  subjects,
  timetableEntries,
  timePeriods,
  rooms,
  classSubjects,
} from "@/lib/db/schema";
import { eq, and, or, sql, inArray, ne } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

interface TimetableSlot {
  day: DayOfWeek;
  periodId: string;
  startTime: string;
  endTime: string;
}

interface SubjectRequirement {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  periodsPerWeek: number;
  roomId: string | null;
  roomName: string | null;
  isCoreSubject: boolean;
}

interface GenerateTimetableRequest {
  schoolId: string;
  classId?: string | string[];
  academicYear: string;
  startDate?: string;
  endDate?: string;
  skipConflicts?: boolean;
}

interface GeneratedEntry {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: { firstName: string; lastName: string };
  roomId: string | null;
  roomName: { name: string; roomNumber: string } | null;
  periodId: string;
  periodName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isDoublePeriod: boolean;
  notes: string;
}

interface TimetableGenerationResult {
  entries: GeneratedEntry[];
  summary: {
    totalEntries: number;
    classesProcessed: number;
    conflictsAvoided: number;
    warnings: string[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_OF_WEEK: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const BREAK_PERIOD_TYPES = ["break", "lunch"];

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/timetable/generate
 * Generate timetable for classes automatically
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { user, userId } = authResult;

    // Parse request body
    const body = await req.json() as Partial<GenerateTimetableRequest>;
    const {
      schoolId,
      classId,
      academicYear = new Date().getFullYear().toString(),
      skipConflicts = false,
    } = body;

    // Validate schoolId
    const targetSchoolId = schoolId || user.schoolId;
    if (!targetSchoolId) {
      return NextResponse.json(
        { error: "School ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get classes to process
    const targetClassIds = Array.isArray(classId) ? classId : classId ? [classId] : undefined;

    const classesToProcess = targetClassIds
      ? await db.query.classes.findMany({
          where: eq(classes.id, targetClassIds[0]),
        })
      : await db.query.classes.findMany({
          where: eq(classes.schoolId, targetSchoolId),
        });

    if (classesToProcess.length === 0) {
      return NextResponse.json(
        {
          error: "No classes found for the given criteria",
          status: 404,
        } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Get time periods for the school
    const periods = await db.query.timePeriods.findMany({
      where: eq(timePeriods.schoolId, targetSchoolId),
      orderBy: (timePeriods, { asc }) => [asc(timePeriods.order)],
    });

    if (periods.length === 0) {
      return NextResponse.json(
        {
          error: "No time periods configured for this school. Please set up time periods first.",
          status: 400,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get available rooms
    const availableRooms = await db.query.rooms.findMany({
      where: eq(rooms.schoolId, targetSchoolId),
    });

    // Generate timetable
    const result = await generateTimetable({
      schoolId: targetSchoolId,
      classes: classesToProcess,
      periods,
      availableRooms,
      academicYear,
      skipConflicts,
      userId,
    });

    logger.info("Timetable generated successfully", {
      route: "/api/timetable/generate",
      method: "POST",
      userId,
      schoolId: targetSchoolId,
      entriesCreated: result.summary.totalEntries,
      classesProcessed: result.summary.classesProcessed,
    });

    return NextResponse.json({
      data: result,
    } satisfies ApiSuccess<TimetableGenerationResult>);
  } catch (error) {
    logger.apiError(error, {
      route: "/api/timetable/generate",
      method: "POST",
    });

    return NextResponse.json(
      {
        error: "Failed to generate timetable",
        status: 500,
        details: error instanceof Error ? error.message : "Unknown error",
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/timetable/generate
 * Preview timetable generation without saving
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    const { searchParams } = new URL(req.url);

    const schoolId = searchParams.get("schoolId") || user.schoolId || "";
    const classId = searchParams.get("classId") || undefined;
    const academicYear = searchParams.get("academicYear") || new Date().getFullYear().toString();

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get preview data
    const classesToProcess = classId
      ? await db.query.classes.findMany({
          where: eq(classes.id, classId),
        })
      : await db.query.classes.findMany({
          where: eq(classes.schoolId, schoolId),
        });

    const periods = await db.query.timePeriods.findMany({
      where: eq(timePeriods.schoolId, schoolId),
      orderBy: (timePeriods, { asc }) => [asc(timePeriods.order)],
    });

    const availableRooms = await db.query.rooms.findMany({
      where: eq(rooms.schoolId, schoolId),
    });

    // Generate preview (without saving)
    const preview = await generateTimetable({
      schoolId,
      classes: classesToProcess,
      periods,
      availableRooms,
      academicYear,
      skipConflicts: false,
      userId: user.id,
      preview: true,
    });

    return NextResponse.json({
      data: preview,
    } satisfies ApiSuccess<TimetableGenerationResult>);
  } catch (error) {
    logger.apiError(error, {
      route: "/api/timetable/generate",
      method: "GET",
    });

    return NextResponse.json(
      { error: "Failed to generate timetable preview", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// TIMETABLE GENERATION LOGIC
// ============================================================================

interface GenerationParams {
  schoolId: string;
  classes: Array<typeof classes.$inferSelect>;
  periods: Array<typeof timePeriods.$inferSelect>;
  availableRooms: Array<typeof rooms.$inferSelect>;
  academicYear: string;
  skipConflicts: boolean;
  userId: string;
  preview?: boolean;
}

async function generateTimetable(params: GenerationParams): Promise<TimetableGenerationResult> {
  const { schoolId, classes: classesToProcess, periods, availableRooms, academicYear, skipConflicts, userId, preview = false } = params;

  const allEntries: GeneratedEntry[] = [];
  const warnings: string[] = [];
  let conflictsAvoided = 0;

  // Filter out break periods
  const classPeriods = periods.filter(
    (p) => !p.isBreak && !BREAK_PERIOD_TYPES.includes(p.type)
  );

  // Get all class subjects for the classes
  const classIds = classesToProcess.map((c) => c.id);
  const allClassSubjects = await db
    .select()
    .from(classSubjects)
    .where(inArray(classSubjects.classId, classIds));

  // Get all related subjects, teachers, and rooms
  const subjectIds = [...new Set(allClassSubjects.map((cs) => cs.subjectId))];
  const teacherIds = [...new Set(allClassSubjects.map((cs) => cs.teacherId).filter(Boolean))];
  const roomIds = [...new Set(allClassSubjects.map((cs) => cs.roomId).filter(Boolean))];

  const subjectsData = subjectIds.length > 0
    ? await db.select().from(subjects).where(inArray(subjects.id, subjectIds))
    : [];

  const teachersData = teacherIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, teacherIds))
    : [];

  // Use availableRooms parameter instead of querying rooms again
  const roomsData = roomIds.length > 0
    ? availableRooms.filter((r) => roomIds.includes(r.id))
    : [];

  // Create lookup maps
  const subjectMap = new Map(subjectsData.map((s) => [s.id, s]));
  const teacherMap = new Map(teachersData.map((t) => [t.id, t]));
  const roomMap = new Map(roomsData.map((r) => [r.id, r]));

  // Get existing entries to check for conflicts
  const existingEntries = preview ? [] : await db
    .select()
    .from(timetableEntries)
    .where(inArray(timetableEntries.classId, classIds));

  // Track used slots for conflict detection
  const usedSlots = new Map<string, Set<string>>(); // teacherId -> Set of "day-periodId"
  const usedRoomsMap = new Map<string, Set<string>>(); // roomId -> Set of "day-periodId"

  // Populate used slots from existing entries
  for (const entry of existingEntries) {
    const key = `${entry.dayOfWeek}-${entry.periodId}`;
    if (entry.teacherId) {
      if (!usedSlots.has(entry.teacherId)) {
        usedSlots.set(entry.teacherId, new Set());
      }
      usedSlots.get(entry.teacherId)!.add(key);
    }
    if (entry.roomId) {
      if (!usedRoomsMap.has(entry.roomId)) {
        usedRoomsMap.set(entry.roomId, new Set());
      }
      usedRoomsMap.get(entry.roomId)!.add(key);
    }
  }

  // Process each class
  for (const classRecord of classesToProcess) {
    const classEntries: GeneratedEntry[] = [];

    // Get subject requirements for this class
    const classSubjectRecords = allClassSubjects.filter((cs) => cs.classId === classRecord.id);

    if (classSubjectRecords.length === 0) {
      warnings.push(`Class ${classRecord.name} has no subjects assigned. Skipping.`);
      continue;
    }

    // Build requirements list
    const requirements: SubjectRequirement[] = classSubjectRecords
      .filter((sr) => sr.isActive)
      .map((sr) => {
        const subject = subjectMap.get(sr.subjectId);
        const teacher = teacherMap.get(sr.teacherId || "");
        const room = sr.roomId ? roomMap.get(sr.roomId) : null;

        return {
          subjectId: sr.subjectId,
          subjectName: subject?.name || "Unknown",
          teacherId: sr.teacherId || "",
          teacherName: teacher?.name || "Unknown",
          periodsPerWeek: sr.periodsPerWeek,
          roomId: sr.roomId || null,
          roomName: room?.name || null,
          isCoreSubject: sr.isCoreSubject,
        };
      })
      .filter((req) => req.teacherId); // Must have a teacher

    // Sort by priority (core subjects first)
    requirements.sort((a, b) => {
      if (a.isCoreSubject && !b.isCoreSubject) return -1;
      if (!a.isCoreSubject && b.isCoreSubject) return 1;
      return b.periodsPerWeek - a.periodsPerWeek;
    });

    // Generate slots for this class
    for (const requirement of requirements) {
      const slotsGenerated = generateSubjectSlots({
        classRecord,
        requirement,
        classPeriods,
        availableRooms: roomsData,
        usedSlots,
        usedRooms: usedRoomsMap,
        skipConflicts,
        academicYear,
      });

      classEntries.push(...slotsGenerated.entries);
      conflictsAvoided += slotsGenerated.conflictsAvoided;

      if (slotsGenerated.warnings.length > 0) {
        warnings.push(...slotsGenerated.warnings);
      }
    }

    allEntries.push(...classEntries);
  }

  // If not preview, save entries to database
  if (!preview && allEntries.length > 0) {
    // Delete existing entries for the affected classes
    await db.delete(timetableEntries).where(inArray(timetableEntries.classId, classIds));

    // Insert new entries
    const entriesToInsert = allEntries.map((entry) => ({
      id: entry.id || `tte-${nanoid()}`,
      classId: entry.classId,
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      roomId: entry.roomId,
      roomName: entry.roomName || { name: "", roomNumber: "" },
      periodId: entry.periodId,
      periodName: entry.periodName,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      isDoublePeriod: entry.isDoublePeriod,
      notes: entry.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(timetableEntries).values(entriesToInsert);
  }

  return {
    entries: allEntries,
    summary: {
      totalEntries: allEntries.length,
      classesProcessed: classesToProcess.length,
      conflictsAvoided,
      warnings,
    },
  };
}

interface GenerateSubjectSlotsParams {
  classRecord: typeof classes.$inferSelect;
  requirement: SubjectRequirement;
  classPeriods: Array<typeof timePeriods.$inferSelect>;
  availableRooms: Array<typeof rooms.$inferSelect>;
  usedSlots: Map<string, Set<string>>;
  usedRooms: Map<string, Set<string>>;
  skipConflicts: boolean;
  academicYear: string;
}

interface GenerateSubjectSlotsResult {
  entries: GeneratedEntry[];
  conflictsAvoided: number;
  warnings: string[];
}

function generateSubjectSlots(params: GenerateSubjectSlotsParams): GenerateSubjectSlotsResult {
  const {
    classRecord,
    requirement,
    classPeriods,
    availableRooms,
    usedSlots,
    usedRooms,
    skipConflicts,
    academicYear,
  } = params;

  const entries: GeneratedEntry[] = [];
  const warnings: string[] = [];
  let conflictsAvoided = 0;
  let periodsScheduled = 0;

  // Try to schedule all required periods
  for (const day of DAYS_OF_WEEK) {
    if (periodsScheduled >= requirement.periodsPerWeek) {
      break;
    }

    for (const period of classPeriods) {
      if (periodsScheduled >= requirement.periodsPerWeek) {
        break;
      }

      const slotKey = `${day}-${period.id}`;
      const teacherKey = requirement.teacherId;
      const roomKey = requirement.roomId || findAvailableRoom(requirement, availableRooms, usedRooms, day, period.id);

      // Check for conflicts
      const teacherConflict = usedSlots.get(teacherKey)?.has(slotKey);
      const roomConflict = roomKey ? usedRooms.get(roomKey)?.has(slotKey) : false;

      if (teacherConflict || roomConflict) {
        conflictsAvoided++;

        if (!skipConflicts) {
          // Try next slot
          continue;
        }

        if (teacherConflict) {
          warnings.push(
            `Teacher ${requirement.teacherName} is already booked on ${day} at ${period.startTime}`
          );
        }
        if (roomConflict) {
          warnings.push(
            `Room ${requirement.roomName || "Unknown"} is already booked on ${day} at ${period.startTime}`
          );
        }
        continue;
      }

      // Create the entry
      const entry: GeneratedEntry = {
        id: `tte-${nanoid()}`,
        classId: classRecord.id,
        className: classRecord.name,
        subjectId: requirement.subjectId,
        subjectName: requirement.subjectName,
        teacherId: requirement.teacherId,
        teacherName: parseTeacherName(requirement.teacherName),
        roomId: roomKey,
        roomName: roomKey ? parseRoomName(roomKey, availableRooms) : null,
        periodId: period.id,
        periodName: period.name,
        dayOfWeek: day,
        startTime: period.startTime,
        endTime: period.endTime,
        isDoublePeriod: false,
        notes: "",
      };

      entries.push(entry);

      // Mark slots as used
      if (!usedSlots.has(teacherKey)) {
        usedSlots.set(teacherKey, new Set());
      }
      usedSlots.get(teacherKey)!.add(slotKey);

      if (roomKey) {
        if (!usedRooms.has(roomKey)) {
          usedRooms.set(roomKey, new Set());
        }
        usedRooms.get(roomKey)!.add(slotKey);
      }

      periodsScheduled++;
    }
  }

  // Check if all periods were scheduled
  if (periodsScheduled < requirement.periodsPerWeek) {
    warnings.push(
      `Could not schedule all periods for ${requirement.subjectName} in class ${classRecord.name}. ` +
        `Scheduled: ${periodsScheduled}/${requirement.periodsPerWeek}`
    );
  }

  return { entries, conflictsAvoided, warnings };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function findAvailableRoom(
  requirement: SubjectRequirement,
  roomsList: Array<typeof rooms.$inferSelect>,
  usedRooms: Map<string, Set<string>>,
  day: string,
  periodId: string
): string | null {
  // If a specific room is assigned, check if it's available
  if (requirement.roomId) {
    const slotKey = `${day}-${periodId}`;
    const isUsed = usedRooms.get(requirement.roomId)?.has(slotKey);
    if (!isUsed) {
      return requirement.roomId;
    }
  }

  // Find any available classroom
  const slotKey = `${day}-${periodId}`;
  for (const room of roomsList) {
    if (room.type === "classroom") {
      const isUsed = usedRooms.get(room.id)?.has(slotKey);
      if (!isUsed) {
        return room.id;
      }
    }
  }

  return null;
}

function parseTeacherName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function parseRoomName(
  roomId: string,
  roomsList: Array<typeof rooms.$inferSelect>
): { name: string; roomNumber: string } | null {
  const room = roomsList.find((r) => r.id === roomId);
  if (!room) {
    return null;
  }
  return {
    name: room.name,
    roomNumber: room.roomNumber,
  };
}
