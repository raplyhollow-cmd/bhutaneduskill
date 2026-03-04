/**
 * CALENDAR INTEGRATION
 *
 * Utilities for working with calendar events
 */

import { db } from "@/lib/db";
import { events, enrollments, users } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  type: "academic" | "holiday" | "exam" | "sports" | "cultural" | "meeting" | "other";
  userId?: string;
  schoolId?: string;
  allDay?: boolean;
}

/**
 * Get events in date range for a user
 */
export async function getEventsInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  // First get the user's school
  const [userRecord] = await db
    .select({ schoolId: users.schoolId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRecord) {
    return [];
  }

  const results = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.schoolId, userRecord.schoolId),
        gte(events.startDate, start),
        lte(events.startDate, end)
      )
    )
    .orderBy(events.startDate);

  return results.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || undefined,
    startTime: e.startTime || undefined,
    endTime: e.endTime || undefined,
    location: e.location || undefined,
    type: e.eventType as CalendarEvent["type"],
    schoolId: e.schoolId || undefined,
    allDay: e.isAllDay ?? false,
  }));
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(
  userId: string,
  limit = 5
): Promise<CalendarEvent[]> {
  // Get user's school
  const [userRecord] = await db
    .select({ schoolId: users.schoolId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRecord) {
    return [];
  }

  const now = new Date();
  const results = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.schoolId, userRecord.schoolId),
        gte(events.startDate, now)
      )
    )
    .orderBy(events.startDate)
    .limit(limit);

  return results.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || undefined,
    startTime: e.startTime || undefined,
    endTime: e.endTime || undefined,
    location: e.location || undefined,
    type: e.eventType as CalendarEvent["type"],
    schoolId: e.schoolId || undefined,
    allDay: e.isAllDay ?? false,
  }));
}

/**
 * Create calendar event
 */
export async function createEvent(
  eventData: Partial<CalendarEvent> & {
    title: string;
    type: CalendarEvent["type"];
    schoolId: string;
    createdBy: string;
    startDate: Date;
    endDate?: Date;
  }
): Promise<CalendarEvent | null> {
  try {
    const [newEvent] = await db
      .insert(events)
      .values({
        id: randomUUID(),
        schoolId: eventData.schoolId,
        createdBy: eventData.createdBy,
        title: eventData.title,
        description: eventData.description || null,
        eventType: eventData.type,
        category: "general",
        startDate: eventData.startDate,
        endDate: eventData.endDate || null,
        isAllDay: eventData.allDay || false,
        startTime: eventData.startTime || null,
        endTime: eventData.endTime || null,
        location: eventData.location || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: events.id,
        title: events.title,
        description: events.description,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        eventType: events.eventType,
        schoolId: events.schoolId,
        isAllDay: events.isAllDay,
      });

    return {
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description || undefined,
      startTime: newEvent.startTime || undefined,
      endTime: newEvent.endTime || undefined,
      location: newEvent.location || undefined,
      type: newEvent.eventType as CalendarEvent["type"],
      schoolId: newEvent.schoolId || undefined,
      allDay: newEvent.isAllDay ?? false,
    };
  } catch (error) {
    console.error("Failed to create event:", error);
    return null;
  }
}

/**
 * Update calendar event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<CalendarEvent, "id">>
): Promise<boolean> {
  try {
    await db
      .update(events)
      .set({
        title: updates.title,
        description: updates.description || null,
        startTime: updates.startTime || null,
        endTime: updates.endTime || null,
        location: updates.location || null,
      })
      .where(eq(events.id, eventId));

    return true;
  } catch (error) {
    console.error("Failed to update event:", error);
    return false;
  }
}

/**
 * Delete calendar event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    await db.delete(events).where(eq(events.id, eventId));
    return true;
  } catch (error) {
    console.error("Failed to delete event:", error);
    return false;
  }
}
