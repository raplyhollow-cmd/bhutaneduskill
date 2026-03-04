/**
 * SCHOOL ADMIN - TIMETABLE API
 *
 * GET /api/school-admin/timetable - Fetch timetable data
 * POST /api/school-admin/timetable - Create/update timetable entry
 * PATCH /api/school-admin/timetable/:id - Update timetable entry
 * DELETE /api/school-admin/timetable/:id - Delete timetable entry
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  users,
  classes,
  subjects,
  timetableEntries,
  timePeriods,
  rooms,
  classSubjects,
} from "@/lib/db/schema";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse, conflictResponse } from "@/lib/api/response-helpers";
import { nanoid as generateId } from "nanoid";

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

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;
    const { searchParams } = new URL(request.url);

    const schoolId = user.schoolId || searchParams.get("schoolId") || "";
    const classId = searchParams.get("classId");

    if (!schoolId) {
      return badRequestResponse("School ID is required");
    }

    try {
      // Fetch classes for this school
      const classesData = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
          section: classes.section,
        })
        .from(classes)
        .where(eq(classes.schoolId, schoolId));

      // Fetch subjects
      const subjectsData = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        })
        .from(subjects)
        .where(eq(subjects.schoolId, schoolId));

      // Fetch teachers (users with type='teacher')
      const teachersData = await db
        .select({
          id: users.id,
          name: users.name,
          subjects: users.subjects,
        })
        .from(users)
        .where(
          sql`(${users.type} = 'teacher' AND ${users.schoolId} = ${schoolId})`
        );

      // Fetch time periods
      const periodsData = await db
        .select()
        .from(timePeriods)
        .where(eq(timePeriods.schoolId, schoolId))
        .orderBy(asc(timePeriods.order));

      // Fetch rooms
      const roomsData = await db
        .select({
          id: rooms.id,
          name: rooms.name,
          roomNumber: rooms.roomNumber,
          type: rooms.type,
          capacity: rooms.capacity,
        })
        .from(rooms)
        .where(eq(rooms.schoolId, schoolId));

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
        const entriesData = await db
          .select()
          .from(timetableEntries)
          .where(eq(timetableEntries.classId, classId));

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

      return successResponse(response);
    } catch (error) {
      logger.apiError(error, {
        route: "/api/school-admin/timetable",
        method: "GET",
      });
      return errorResponse("Failed to fetch timetable data", 500);
    }
  },
  ['school-admin', 'admin']
);

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

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    try {
      const body = await request.json() as CreateTimetableEntryRequest;

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
        return badRequestResponse("Missing required fields");
      }

      // Get related data for denormalized fields
      const classRecord = await db.select().from(classes).where(eq(classes.id, classId)).limit(1).then(r => r[0]);

      const subjectRecord = await db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1).then(r => r[0]);

      const teacherRecord = await db.select().from(users).where(eq(users.id, teacherId)).limit(1).then(r => r[0]);

      const periodRecord = await db.select().from(timePeriods).where(eq(timePeriods.id, periodId)).limit(1).then(r => r[0]);

      if (!classRecord || !subjectRecord || !teacherRecord || !periodRecord) {
        return badRequestResponse("Invalid reference data provided");
      }

      // Check for conflicts (teacher or room at same day/period)
      // Exclude same class entry (update scenario)
      const conflictEntries = await db
        .select()
        .from(timetableEntries)
        .where(
          sql`(${timetableEntries.dayOfWeek} = ${dayOfWeek}
                AND ${timetableEntries.periodId} = ${periodId}
                AND ${timetableEntries.classId} != ${classId})`
        );

      // Check for teacher conflict
      const teacherConflict = conflictEntries.find((e) => e.teacherId === teacherId);
      if (teacherConflict) {
        return conflictResponse("Conflict detected: Teacher is already booked at this time");
      }

      // Check for room conflict
      if (roomId) {
        const roomConflict = conflictEntries.find((e) => e.roomId === roomId);
        if (roomConflict) {
          return conflictResponse("Conflict detected: Room is already booked at this time");
        }
      }

      // Create the entry
      const entryId = `tte-${generateId()}`;
      const [roomRecord] = roomId
        ? await db
            .select()
            .from(rooms)
            .where(eq(rooms.id, roomId))
            .limit(1)
        : [null];

      await db.insert(timetableEntries).values({
        id: entryId,
        classId,
        subjectId,
        subjectName: subjectRecord.name,
        teacherId,
        teacherName: {
          firstName: teacherRecord.firstName || "",
          lastName: teacherRecord.lastName || "",
        },
        roomId: roomId || null,
        roomName: roomRecord
          ? { name: roomRecord.name, roomNumber: roomRecord.roomNumber || "" }
          : { name: "", roomNumber: "" },
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

      return createdResponse({
        id: entryId,
        message: "Timetable entry created successfully",
      });
    } catch (error) {
      logger.apiError(error, {
        route: "/api/school-admin/timetable",
        method: "POST",
      });

      return errorResponse("Failed to create timetable entry", 500);
    }
  },
  ['school-admin', 'admin']
);
