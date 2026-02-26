/**
 * TEACHER SCHEDULE API
 *
 * GET /api/teacher/schedule - Fetch teacher's weekly/monthly schedule
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Features:
 * - Weekly and monthly views
 * - Class timings from timetable
 * - Break periods
 * - Duties and events
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { timetableEntries, classes, subjects, rooms, timePeriods, users, schoolEvents } from "@/lib/db/schema";
import { eq, and, asc, or } from "drizzle-orm";
import type { ApiSuccess } from "@/types";
import { successResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

type ScheduleViewType = "weekly" | "monthly";
type ScheduleDayType = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type ScheduleItemType = "class" | "break" | "meeting" | "event" | "office_hours" | "duty";

interface ScheduleItem {
  id: string;
  title: string;
  type: ScheduleItemType;
  day: ScheduleDayType;
  startTime: string; // HH:MM format
  endTime: string;
  location?: string;
  classId?: string;
  className?: string;
  subject?: string;
  subjectId?: string;
  roomId?: string;
  isRecurring: boolean;
  notes?: string;
  color?: string;
}

interface ScheduleResponse {
  schedule: ScheduleItem[];
  summary: {
    totalClasses: number;
    totalBreaks: number;
    totalEvents: number;
    workingHours: number;
  };
  view: ScheduleViewType;
  dateRange: {
    start: string;
    end: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAY_MAPPING: Record<number, ScheduleDayType> = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  0: "sunday",
};

const TYPE_COLORS: Record<ScheduleItemType, string> = {
  class: "rgb(59 130 246)",      // Blue
  break: "rgb(156 163 175)",     // Gray
  meeting: "rgb(168 85 247)",    // Purple
  event: "rgb(34 197 94)",       // Green
  office_hours: "rgb(249 115 22)", // Orange
  duty: "rgb(236 72 153)",       // Pink
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get week start and end dates for a given date
 */
function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get month start and end dates for a given date
 */
function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Format date to ISO string
 */
function formatDateToISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse time string to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate duration between two time strings in minutes
 */
function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

// ============================================================================
// API HANDLER
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, user } = auth;

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const view = (searchParams.get("view") || "weekly") as ScheduleViewType;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      const today = new Date();
      if (view === "monthly") {
        const range = getMonthRange(today);
        startDate = range.start;
        endDate = range.end;
      } else {
        const range = getWeekRange(today);
        startDate = range.start;
        endDate = range.end;
      }
    }

    // Fetch teacher's schedule from timetable
    const timetableData = await db
      .select({
        id: timetableEntries.id,
        dayOfWeek: timetableEntries.dayOfWeek,
        startTime: timetableEntries.startTime,
        endTime: timetableEntries.endTime,
        isDoublePeriod: timetableEntries.isDoublePeriod,
        notes: timetableEntries.notes,
        classId: timetableEntries.classId,
        className: classes.name,
        classGrade: classes.grade,
        section: classes.section,
        subjectId: timetableEntries.subjectId,
        subjectName: subjects.name,
        roomId: timetableEntries.roomId,
        roomName: timetableEntries.roomName,
        periodName: timetableEntries.periodName,
        periodId: timetableEntries.periodId,
      })
      .from(timetableEntries)
      .innerJoin(classes, eq(timetableEntries.classId, classes.id))
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .where(eq(timetableEntries.teacherId, userId))
      .orderBy(asc(timetableEntries.dayOfWeek), asc(timetableEntries.startTime));

    logger.info("Fetched timetable data", {
      route: "/api/teacher/schedule",
      method: "GET",
      userId,
      entriesCount: timetableData.length,
    });

    // Fetch break periods from school's time periods
    const schoolId = user.schoolId;
    let breakPeriods: Array<{
      startTime: string;
      endTime: string;
      name: string;
      dayOfWeek?: string;
    }> = [];

    if (schoolId) {
      const periodsData = await db.query.timePeriods.findMany({
        where: eq(timePeriods.schoolId, schoolId),
        columns: {
          startTime: true,
          endTime: true,
          name: true,
          type: true,
          isActive: true,
        },
      });

      breakPeriods = periodsData
        .filter((p) => p.type === "break" || p.type === "lunch")
        .map((p) => ({
          startTime: p.startTime,
          endTime: p.endTime,
          name: p.name,
        }));
    }

    // Fetch school events for the date range
    const startDateStr = formatDateToISO(startDate);
    const endDateStr = formatDateToISO(endDate);

    let schoolEventsData: Array<{
      id: string;
      title: string;
      description: string;
      eventType: string;
      startDate: string;
      endDate: string;
      location: string;
    }> = [];

    if (schoolId) {
      const events = await db.query.schoolEvents.findMany({
        where: and(
          eq(schoolEvents.schoolId, schoolId),
          or(
            eq(schoolEvents.status, "upcoming"),
            eq(schoolEvents.status, "ongoing")
          )
        ),
        columns: {
          id: true,
          title: true,
          description: true,
          eventType: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      });

      schoolEventsData = events
        .filter((e) => e.startDate >= startDateStr && e.startDate <= endDateStr)
        .map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          eventType: e.eventType,
          startDate: e.startDate,
          endDate: e.endDate,
          location: e.location,
        }));
    }

    // Build schedule items
    const scheduleItems: ScheduleItem[] = [];

    // Add class schedule from timetable
    for (const entry of timetableData) {
      const dayKey = entry.dayOfWeek.toLowerCase() as ScheduleDayType;

      scheduleItems.push({
        id: entry.id,
        title: `${entry.subjectName} - ${entry.className}`,
        type: "class",
        day: dayKey,
        startTime: entry.startTime,
        endTime: entry.endTime,
        location: typeof entry.roomName === "string" ? entry.roomName : undefined,
        classId: entry.classId,
        className: entry.className,
        subject: entry.subjectName,
        subjectId: entry.subjectId,
        roomId: entry.roomId || undefined,
        isRecurring: true,
        notes: entry.notes || undefined,
        color: TYPE_COLORS.class,
      });
    }

    // Add break periods for each day
    for (const breakPeriod of breakPeriods) {
      const weekDays: ScheduleDayType[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      for (const day of weekDays) {
        scheduleItems.push({
          id: `break-${day}-${breakPeriod.startTime}`,
          title: breakPeriod.name,
          type: "break",
          day: day,
          startTime: breakPeriod.startTime,
          endTime: breakPeriod.endTime,
          isRecurring: true,
          color: TYPE_COLORS.break,
        });
      }
    }

    // Add school events
    for (const event of schoolEventsData) {
      const eventDate = new Date(event.startDate);
      const dayKey = DAY_MAPPING[eventDate.getDay()];

      if (dayKey) {
        scheduleItems.push({
          id: event.id,
          title: event.title,
          type: event.eventType === "meeting" ? "meeting" : "event",
          day: dayKey,
          startTime: event.startDate.split("T")[1]?.substring(0, 5) || "09:00",
          endTime: event.endDate.split("T")[1]?.substring(0, 5) || "10:00",
          location: event.location,
          isRecurring: false,
          notes: event.description,
          color: event.eventType === "meeting" ? TYPE_COLORS.meeting : TYPE_COLORS.event,
        });
      }
    }

    // Sort schedule items by day and time
    const dayOrder: Record<ScheduleDayType, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };

    scheduleItems.sort((a, b) => {
      const dayDiff = dayOrder[a.day] - dayOrder[b.day];
      if (dayDiff !== 0) return dayDiff;
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    // Calculate summary statistics
    const totalClasses = scheduleItems.filter((i) => i.type === "class").length;
    const totalBreaks = scheduleItems.filter((i) => i.type === "break").length;
    const totalEvents = scheduleItems.filter((i) => i.type === "event" || i.type === "meeting").length;

    // Calculate working hours (sum of class durations)
    let totalMinutes = 0;
    for (const item of scheduleItems) {
      if (item.type === "class") {
        totalMinutes += calculateDuration(item.startTime, item.endTime);
      }
    }
    const workingHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

    // Build response
    const response: ScheduleResponse = {
      schedule: scheduleItems,
      summary: {
        totalClasses,
        totalBreaks,
        totalEvents,
        workingHours,
      },
      view,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
    };

    logger.info("Schedule fetched successfully", {
      route: "/api/teacher/schedule",
      method: "GET",
      userId,
      itemsCount: scheduleItems.length,
      view,
    });

    return successResponse(response);
  },
  ['teacher', 'admin']
);
