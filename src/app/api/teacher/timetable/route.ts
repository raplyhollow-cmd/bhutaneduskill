import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes, users, subjects, timetableEntries, teacherAssignments } from "@/lib/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/teacher/timetable
 *
 * Get the current teacher's weekly timetable
 * Shows all classes, subjects, periods, and days for the logged-in teacher
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart"); // Optional: filter by week

    try {
      // Get all timetable entries where this teacher is assigned using db.select()
      const entries = await db
        .select({
          id: timetableEntries.id,
          classId: timetableEntries.classId,
          className: sql<string>`${classes.name}`.as('className'),
          classGrade: classes.grade,
          classSection: classes.section,
          subjectId: timetableEntries.subjectId,
          subjectName: timetableEntries.subjectName,
          teacherId: timetableEntries.teacherId,
          periodId: timetableEntries.periodId,
          periodName: timetableEntries.periodName,
          dayOfWeek: timetableEntries.dayOfWeek,
          startTime: timetableEntries.startTime,
          endTime: timetableEntries.endTime,
          roomId: timetableEntries.roomId,
          roomName: timetableEntries.roomName,
          isDoublePeriod: timetableEntries.isDoublePeriod,
        })
        .from(timetableEntries)
        .innerJoin(classes, eq(timetableEntries.classId, classes.id))
        .where(eq(timetableEntries.teacherId, userId))
        .orderBy(
          sql`CASE ${timetableEntries.dayOfWeek}
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            ELSE 6
          END`
        );

      // Get additional classes from teacher_assignments that might not have timetable entries yet
      const assignments = await db
        .select({
          id: teacherAssignments.id,
          classId: teacherAssignments.classId,
          className: classes.name,
          classGrade: classes.grade,
          classSection: classes.section,
          subjectId: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          isPrimary: teacherAssignments.isPrimary,
          role: teacherAssignments.role,
        })
        .from(teacherAssignments)
        .innerJoin(classes, eq(teacherAssignments.classId, classes.id))
        .innerJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
        .where(
          and(
            eq(teacherAssignments.teacherId, userId),
            eq(teacherAssignments.isActive, true)
          )
        );

      // Group by day for easier display
      const timetableByDay = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      };

      entries.forEach((entry) => {
        const day = entry.dayOfWeek as keyof typeof timetableByDay;
        if (timetableByDay[day]) {
          (timetableByDay[day] as typeof entries).push(entry);
        }
      });

      logger.info("Fetched teacher timetable", {
        route: "/api/teacher/timetable",
        method: "GET",
        userId,
        entriesCount: entries.length,
        assignmentsCount: assignments.length,
      });

      return successResponse({
        teacherId: userId,
        teacherName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        timetableEntries: entries,
        timetableByDay,
        assignedClasses: assignments,
        totalClasses: assignments.length,
        totalPeriodsPerWeek: entries.length,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/teacher/timetable", method: "GET" });
      return errorResponse("Failed to fetch timetable", 500);
    }
  },
  ['teacher']
);
