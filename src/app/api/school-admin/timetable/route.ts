/**
 * SCHOOL ADMIN - TIMETABLE API
 *
 * GET /api/school-admin/timetable - Fetch timetable data
 * POST /api/school-admin/timetable - Create/update timetable entry
 * PATCH /api/school-admin/timetable/:id - Update timetable entry
 * DELETE /api/school-admin/timetable/:id - Delete timetable entry
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
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

interface TimetableClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
}

interface TimetableSubjectData {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

interface TimetableTeacherData {
  id: string;
  name: string;
  subjects: string[];
}

interface TimetableTimeSlotData {
  id: string;
  name: string;
  type: string;
  order: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

interface TimetableRoomData {
  id: string;
  name: string;
  roomNumber: string | null;
  type: string;
  capacity: number | null;
}

interface TimetableResponse {
  classes: TimetableClassData[];
  subjects: TimetableSubjectData[];
  teachers: TimetableTeacherData[];
  timeSlots: TimetableTimeSlotData[];
  rooms: TimetableRoomData[];
  timetable: TimetableViewData | null;
}

interface TimetableViewData {
  classId: string;
  className: string;
  entries: Array<{
    id: string;
    classId: string;
    subjectId: string;
    subjectName: string;
    teacherId: string;
    teacherName: string;
    roomId: string;
    roomName: string;
    dayOfWeek: string;
    periodId: string;
    periodName: string;
    startTime: string;
    endTime: string;
  }>;
}

// ============================================================================
// GET - Fetch timetable data
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { user, userId } = authResult;
    const { searchParams } = new URL(req.url);

    const schoolId = user.schoolId || searchParams.get("schoolId") || "";
    const classId = searchParams.get("classId");

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Fetch classes for this school
    const classesData = await db.query.classes.findMany({
      where: eq(classes.schoolId, schoolId),
      columns: {
        id: true,
        name: true,
        grade: true,
        section: true,
      },
    });

    // Fetch subjects
    const subjectsData = await db.query.subjects.findMany({
      where: eq(subjects.schoolId, schoolId),
      columns: {
        id: true,
        name: true,
        code: true,
      },
    });

    // Fetch teachers (users with type='teacher')
    const teachersData = await db.query.users.findMany({
      where: and(
        eq(users.type, "teacher"),
        sql`${users.schoolId} = ${schoolId}`
      ),
      columns: {
        id: true,
        name: true,
        subjects: true,
      },
    });

    // Fetch time periods
    const periodsData = await db.query.timePeriods.findMany({
      where: eq(timePeriods.schoolId, schoolId),
      orderBy: (timePeriods, { asc }) => [asc(timePeriods.order)],
    });

    // Fetch rooms
    const roomsData = await db.query.rooms.findMany({
      where: eq(rooms.schoolId, schoolId),
      columns: {
        id: true,
        name: true,
        roomNumber: true,
        type: true,
        capacity: true,
      },
    });

    // Prepare response data
    const classesResponse: TimetableClassData[] = classesData.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade || 0,
      section: c.section || "",
    }));

    const subjectsResponse: TimetableSubjectData[] = subjectsData.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code || "",
      color: null,
    }));

    const teachersResponse: TimetableTeacherData[] = teachersData.map((t) => ({
      id: t.id,
      name: t.name,
      subjects: Array.isArray(t.subjects) ? t.subjects : [],
    }));

    const timeSlotsResponse: TimetableTimeSlotData[] = periodsData.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      order: p.order,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak: p.isBreak || p.type === "break" || p.type === "lunch",
    }));

    const roomsResponse: TimetableRoomData[] = roomsData.map((r) => ({
      id: r.id,
      name: r.name,
      roomNumber: r.roomNumber,
      type: r.type,
      capacity: r.capacity,
    }));

    // Fetch timetable entries for a specific class if provided
    let timetableResponse: TimetableViewData | null = null;

    if (classId) {
      const entriesData = await db.query.timetableEntries.findMany({
        where: eq(timetableEntries.classId, classId),
      });

      const targetClass = classesData.find((c) => c.id === classId);

      timetableResponse = {
        classId,
        className: targetClass?.name || "",
        entries: entriesData.map((e) => ({
          id: e.id,
          classId: e.classId,
          subjectId: e.subjectId,
          subjectName: e.subjectName || "",
          teacherId: e.teacherId,
          teacherName: typeof e.teacherName === "string" ? e.teacherName : "",
          roomId: e.roomId || "",
          roomName: typeof e.roomName === "string" ? e.roomName : "",
          dayOfWeek: e.dayOfWeek,
          periodId: e.periodId,
          periodName: e.periodName,
          startTime: e.startTime,
          endTime: e.endTime,
        })),
      };
    }

    const response: TimetableResponse = {
      classes: classesResponse,
      subjects: subjectsResponse,
      teachers: teachersResponse,
      timeSlots: timeSlotsResponse,
      rooms: roomsResponse,
      timetable: timetableResponse,
    };

    return NextResponse.json({
      data: response,
    } satisfies ApiSuccess<TimetableResponse>);
  } catch (error) {
    logger.apiError(error, {
      route: "/api/school-admin/timetable",
      method: "GET",
    });

    return NextResponse.json(
      { error: "Failed to fetch timetable data", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create timetable entry
// ============================================================================

interface CreateTimetableEntryRequest {
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId: string | null;
  dayOfWeek: string;
  periodId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { user, userId } = authResult;
    const body = await req.json() as CreateTimetableEntryRequest;

    const {
      classId,
      subjectId,
      teacherId,
      roomId,
      dayOfWeek,
      periodId,
      startTime,
      endTime,
      notes = "",
    } = body;

    // Validate required fields
    if (!classId || !subjectId || !teacherId || !dayOfWeek || !periodId) {
      return NextResponse.json(
        { error: "Missing required fields", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get related data for denormalized fields
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    const subjectRecord = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
    });

    const teacherRecord = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
    });

    const periodRecord = await db.query.timePeriods.findFirst({
      where: eq(timePeriods.id, periodId),
    });

    if (!classRecord || !subjectRecord || !teacherRecord || !periodRecord) {
      return NextResponse.json(
        { error: "Invalid reference data provided", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check for conflicts (teacher or room at same day/period)
    // Exclude same class entry (update scenario)
    const conflictEntries = await db.query.timetableEntries.findMany({
      where: and(
        eq(timetableEntries.dayOfWeek, dayOfWeek),
        eq(timetableEntries.periodId, periodId),
        sql`${timetableEntries.classId} != ${classId}`
      ),
    });

    // Check for teacher conflict
    const teacherConflict = conflictEntries.find(e => e.teacherId === teacherId);
    if (teacherConflict) {
      return NextResponse.json(
        {
          error: `Conflict detected: Teacher is already booked at this time`,
          status: 409,
          conflictType: "teacher",
          existingEntry: teacherConflict,
        } satisfies ApiErrorResponse & { conflictType: string; existingEntry: typeof teacherConflict },
        { status: 409 }
      );
    }

    // Check for room conflict
    if (roomId) {
      const roomConflict = conflictEntries.find(e => e.roomId === roomId);
      if (roomConflict) {
        return NextResponse.json(
          {
            error: `Conflict detected: Room is already booked at this time`,
            status: 409,
            conflictType: "room",
            existingEntry: roomConflict,
          } satisfies ApiErrorResponse & { conflictType: string; existingEntry: typeof roomConflict },
          { status: 409 }
        );
      }
    }

    // Create the entry
    const entryId = `tte-${nanoid()}`;
    const roomRecord = roomId ? await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
    }) : null;

    await db.insert(timetableEntries).values({
      id: entryId,
      classId,
      subjectId,
      subjectName: subjectRecord.name,
      teacherId,
      teacherName: { firstName: teacherRecord.firstName || "", lastName: teacherRecord.lastName || "" },
      roomId: roomId || null,
      roomName: roomRecord ? { name: roomRecord.name, roomNumber: roomRecord.roomNumber || "" } : { name: "", roomNumber: "" },
      periodId,
      periodName: periodRecord.name,
      dayOfWeek,
      startTime,
      endTime,
      isDoublePeriod: false,
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info("Timetable entry created", {
      route: "/api/school-admin/timetable",
      method: "POST",
      userId,
      classId,
      subjectId,
    });

    return NextResponse.json({
      data: {
        id: entryId,
        message: "Timetable entry created successfully",
      },
    } satisfies ApiSuccess<{ id: string; message: string }>);
  } catch (error) {
    logger.apiError(error, {
      route: "/api/school-admin/timetable",
      method: "POST",
    });

    return NextResponse.json(
      { error: "Failed to create timetable entry", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
