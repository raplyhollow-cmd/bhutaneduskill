/**
 * AI TIMETABLE OPTIMIZATION API
 *
 * POST /api/ai/timetable/optimize
 *
 * Uses AI to optimize school timetables based on user-defined constraints.
 * Part of the hybrid "Human-in-the-loop" approach where admins set rules
 * and AI finds the optimal solution.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, schools, timetables, timePeriods, classes, subjects } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import {
  optimizeTimetableWithAI,
  analyzeTimetableConflicts,
} from "@/lib/ai/timetable-optimizer";
import type { TimetableConstraints, SchoolContext, TimetableEntry } from "@/lib/types/timetable-constraints";

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const body = await request.json();
      const {
        constraints,
        currentTimetable: providedTimetable,
        scope = "all",
        academicYear,
        semester,
      } = body;

      // Validate required fields
      if (!constraints) {
        return badRequestResponse("Constraints are required");
      }

      if (!academicYear) {
        return badRequestResponse("Academic year is required");
      }

      // Get school context
      const [schoolResult, periodsResult] = await Promise.all([
        db.select().from(schools).where(eq(schools.id, user.schoolId)).limit(1),
        db
          .select()
          .from(timePeriods)
          .where(eq(timePeriods.schoolId, user.schoolId))
          .orderBy(timePeriods.order),
      ]);

      if (schoolResult.length === 0) {
        return badRequestResponse("School not found");
      }

      const school = schoolResult[0];

      // Build school context
      const context: SchoolContext = {
        schoolId: user.schoolId,
        academicYear,
        semester,
        bellSchedule: periodsResult.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type as "class" | "break" | "lunch",
          order: p.order,
          startTime: p.startTime,
          endTime: p.endTime,
          duration: p.duration || 45,
          isBreak: p.isBreak || false,
        })),
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], // Default working days
      };

      // Get current timetable if not provided
      let currentTimetable: TimetableEntry[] = providedTimetable;
      if (!currentTimetable || scope === "all") {
        const timetableResult = await db
          .select({
            id: timetables.id,
            classId: timetables.classId,
            subjectId: timetables.subjectId,
            teacherId: timetables.teacherId,
            roomNumber: timetables.roomNumber,
            dayOfWeek: timetables.dayOfWeek,
            periodNumber: timetables.periodNumber,
            startTime: timetables.startTime,
            endTime: timetables.endTime,
            className: classes.name,
            subjectName: subjects.name,
            // Teacher name from users join
          })
          .from(timetables)
          .innerJoin(classes, eq(timetables.classId, classes.id))
          .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
          .where(
            and(
              eq(timetables.schoolId, user.schoolId),
              academicYear ? eq(timetables.academicYear, academicYear) : undefined,
              semester ? eq(timetables.semester, semester) : undefined
            )
          );

        currentTimetable = timetableResult.map((entry) => ({
          id: entry.id,
          classId: entry.classId,
          className: entry.className || "",
          subjectId: entry.subjectId,
          subjectName: entry.subjectName || "",
          teacherId: entry.teacherId || "",
          teacherName: "", // Will be populated if needed
          roomId: entry.roomNumber || "",
          roomName: "",
          dayOfWeek: entry.dayOfWeek,
          periodNumber: entry.periodNumber,
          startTime: entry.startTime,
          endTime: entry.endTime,
        }));
      }

      // First analyze conflicts
      const conflicts = analyzeTimetableConflicts(currentTimetable);

      // If there are critical conflicts, note them in the response
      if (conflicts.length > 0) {
        logger.info("Timetable has conflicts before optimization", {
          schoolId: user.schoolId,
          conflictCount: conflicts.length,
        });
      }

      // Run AI optimization
      const result = await optimizeTimetableWithAI(currentTimetable, constraints, context, {
        schoolId: user.schoolId,
        scope,
      });

      // Add remaining conflicts to result
      if (conflicts.length > 0) {
        result.remainingConflicts = conflicts;
      }

      logger.info("Timetable optimization completed", {
        schoolId: user.schoolId,
        canApply: result.canApply,
        optimizationScore: result.metrics?.optimizationScore,
      });

      return successResponse({
        ...result,
        originalConflicts: conflicts,
      });
    } catch (error) {
      logger.error("Timetable optimization API failed", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Failed to optimize timetable");
    }
  },
  ["school-admin"]
);
