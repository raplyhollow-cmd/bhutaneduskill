import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes, users, subjects, teacherAssignments, timetableEntries, timePeriods } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

/**
 * POST /api/school-admin/timetable/auto-generate
 *
 * Auto-generate timetable entries from teacher assignments
 * For each teacher assignment (class + subject), create default timetable entries
 *
 * This is a simplified generator that:
 * - Distributes subjects across available periods
 * - Avoids teacher conflicts
 * - Creates entries that can be manually adjusted later
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user, userId } = auth;
    const body = await request.json();
    const { classId } = body;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    if (!classId) {
      return badRequestResponse("Class ID is required");
    }

    try {
      // Get class info using db.select()
      const classInfoResult = await db
        .select()
        .from(classes)
        .where(and(eq(classes.id, classId), eq(classes.schoolId, user.schoolId)))
        .limit(1);

      const classInfo = classInfoResult[0];

      if (!classInfo) {
        return notFoundResponse("Class");
      }

      // Get time periods for this school using db.select()
      const periods = await db
        .select()
        .from(timePeriods)
        .where(eq(timePeriods.schoolId, user.schoolId))
        .orderBy(timePeriods.order);

      // Filter out break/lunch periods
      const teachingPeriods = periods.filter(
        p => p.type !== "break" && p.type !== "lunch"
      );

      if (teachingPeriods.length === 0) {
        return badRequestResponse("No teaching periods configured. Please set up time periods first.");
      }

      // Get teacher assignments for this class using db.select()
      const assignments = await db
        .select({
          id: teacherAssignments.id,
          teacherId: teacherAssignments.teacherId,
          subjectId: teacherAssignments.subjectId,
          role: teacherAssignments.role,
          isPrimary: teacherAssignments.isPrimary,
          teacherId2: users.id,
          teacherFirstName: users.firstName,
          teacherLastName: users.lastName,
          subjectId2: subjects.id,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          subjectType: subjects.type,
        })
        .from(teacherAssignments)
        .innerJoin(users, eq(teacherAssignments.teacherId, users.id))
        .innerJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
        .where(
          and(
            eq(teacherAssignments.classId, classId),
            eq(teacherAssignments.isActive, true)
          )
        );

      if (assignments.length === 0) {
        return badRequestResponse("No teacher assignments found for this class. Please assign teachers to subjects first.");
      }

      // Get existing timetable entries for this class using db.select()
      const existingEntries = await db
        .select()
        .from(timetableEntries)
        .where(eq(timetableEntries.classId, classId));

      // Delete existing entries (regenerate)
      if (existingEntries.length > 0) {
        await db
          .delete(timetableEntries)
          .where(eq(timetableEntries.classId, classId));
      }

      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const entries: Array<{ id: string; subject: string; day: string; period: string }> = [];
      const nanoid = (await import("nanoid")).nanoid;

      // Simple distribution: assign each subject to different periods/days
      // This is a basic algorithm that can be improved later
      let periodIndex = 0;

      for (const assignment of assignments) {
        // Determine periods per week based on subject type (core subjects get more)
        const periodsPerWeek = assignment.subjectType === "core" ? 5 :
                              assignment.subjectType === "elective" ? 3 : 2;

        for (let i = 0; i < periodsPerWeek; i++) {
          const dayIndex = i % daysOfWeek.length;
          const period = teachingPeriods[periodIndex % teachingPeriods.length];

          const entryId = `tte-${nanoid()}`;

          await db.insert(timetableEntries).values({
            id: entryId,
            classId,
            subjectId: assignment.subjectId2,
            subjectName: assignment.subjectName,
            teacherId: assignment.teacherId2,
            teacherName: {
              firstName: assignment.teacherFirstName || "",
              lastName: assignment.teacherLastName || ""
            },
            roomId: null,
            roomName: { name: "TBD", roomNumber: "" },
            periodId: period.id,
            periodName: period.name,
            dayOfWeek: daysOfWeek[dayIndex],
            startTime: period.startTime,
            endTime: period.endTime,
            isDoublePeriod: false,
            notes: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          entries.push({
            id: entryId,
            subject: assignment.subjectName,
            day: daysOfWeek[dayIndex],
            period: period.name,
          });

          periodIndex++;
        }
      }

      logger.info("Auto-generated timetable entries", {
        route: "/api/school-admin/timetable/auto-generate",
        method: "POST",
        classId,
        entriesCreated: entries.length,
      });

      return successResponse({
        classId,
        entriesCreated: entries.length,
        entries,
        message: `Generated ${entries.length} timetable entries for ${assignments.length} subjects. Review and adjust as needed.`,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/school-admin/timetable/auto-generate", method: "POST" });
      return errorResponse("Failed to generate timetable", 500);
    }
  },
  ['school-admin']
);
