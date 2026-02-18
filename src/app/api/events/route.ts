/**
 * EVENTS API ROUTE
 *
 * Handles CRUD operations for school events calendar
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schoolEvents, eventRegistrations, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, or, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

interface CreateEventInput {
  title: string;
  description?: string;
  eventType: "academic" | "sports" | "cultural" | "holiday" | "exam" | "meeting" | "other";
  category?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: string;
  venue?: string;
  targetAudience?: string[];
  targetGradeLevels?: number[];
  targetClassIds?: string[];
  isRecurring?: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEndDate?: string;
  requiresRegistration?: boolean;
  registrationDeadline?: string;
  maxParticipants?: number;
  color?: string;
  attachments?: Array<{ id: string; name: string; url: string }>;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled" | "draft";
}

interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

// ============================================================================
// GET - Fetch events with filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'parent', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const eventType = searchParams.get("eventType");
    const status = searchParams.get("status");
    const includeDraft = searchParams.get("includeDraft") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    // Filter by school
    if (user.schoolId) {
      conditions.push(eq(schoolEvents.schoolId, user.schoolId));
    }

    // Filter by event type
    if (eventType) {
      conditions.push(eq(schoolEvents.eventType, eventType));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(schoolEvents.status, status));
    } else if (!includeDraft) {
      // Only show published/upcoming events by default
      conditions.push(sql`${schoolEvents.status} != 'draft'`);
    }

    // Filter by date range if provided
    if (startDate) {
      conditions.push(
        or(
          sql`${schoolEvents.isAllDay} = 1`,
          gte(schoolEvents.startDate, startDate)
        ) as any
      );
    }
    if (endDate) {
      conditions.push(
        or(
          sql`${schoolEvents.isAllDay} = 1`,
          lte(schoolEvents.startDate, endDate)
        ) as any
      );
    }

    // Fetch events with pagination
    const [events, totalCount] = await Promise.all([
      db.query.schoolEvents.findMany({
        where: and(...conditions),
        with: {
          organizer: {
            columns: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: [desc(schoolEvents.startDate), desc(schoolEvents.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() })
        .from(schoolEvents)
        .where(and(...conditions))
    ]);

    // For each event, get registration count and user registration
    const eventsWithRegistrationInfo = await Promise.all(
      events.map(async (event: any) => {
        const result: any = { ...event };

        // Get registration count
        const registrationCounts = await db
          .select({ count: count() })
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.eventId, event.id),
              eq(eventRegistrations.status, "registered")
            )
          );
        result.registeredCount = registrationCounts[0]?.count || 0;

        // Get user registration
        const userRegistration = await db.query.eventRegistrations.findFirst({
          where: and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.userId, user.id)
          ),
        });
        result.userRegistration = userRegistration || null;

        return result;
      })
    );

    return NextResponse.json({
      success: true,
      events: eventsWithRegistrationInfo,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
      user: {
        id: user.id,
        role: user.role,
        canCreate: user.role === "school_admin" || user.role === "admin" || user.role === "teacher",
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new event
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    // Only admins and teachers can create events
    const canCreate = user.role === "school_admin" || user.role === "admin" || user.role === "teacher";
    if (!canCreate) {
      return NextResponse.json(
        { error: "You don't have permission to create events" },
        { status: 403 }
      );
    }

    const body: CreateEventInput = await request.json();
    const {
      title,
      description,
      eventType,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      location,
      venue,
      targetAudience,
      targetGradeLevels,
      targetClassIds,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate,
      requiresRegistration,
      registrationDeadline,
      maxParticipants,
      color,
      attachments,
      status,
    } = body;

    // Validate required fields
    if (!title || !startDate || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields: title, startDate, eventType" },
        { status: 400 }
      );
    }

    // Create event
    const now = new Date();
    const eventId = `event_${nanoid(12)}`;
    const [event] = await db.insert(schoolEvents).values({
      id: eventId,
      schoolId: user.schoolId || "",
      title,
      description: description || "",
      eventType,
      startDate,
      endDate: endDate || startDate,
      location: location || venue || "",
      isAllDay: isAllDay ?? false,
      targetAudience: targetAudience || ["all"],
      isRecurring: isRecurring ?? false,
      recurrencePattern,
      status: status || "upcoming",
      reminders: [],
      attachments: attachments?.map((a: any) => a.url) || [],
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    }).returning();

    logger.info("Event created", { eventId, title, createdBy: user.id });

    return NextResponse.json({
      success: true,
      event: event[0] || event,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update an event
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body: UpdateEventInput = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Check if event exists and user has permission
    const existingEvent = await db.query.schoolEvents.findFirst({
      where: eq(schoolEvents.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const canEdit =
      user.role === "admin" ||
      (user.schoolId && existingEvent.schoolId === user.schoolId);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this event" },
        { status: 403 }
      );
    }

    // Update event
    const [updatedEvent] = await db.update(schoolEvents)
      .set({
        ...updateData,
        updatedAt: new Date(),
      } as any)
      .where(eq(schoolEvents.id, id))
      .returning();

    logger.info("Event updated", { eventId: id, updatedBy: user.id });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete an event
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Check if event exists and user has permission
    const existingEvent = await db.query.schoolEvents.findFirst({
      where: eq(schoolEvents.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const canDelete =
      user.role === "admin" ||
      (user.schoolId && existingEvent.schoolId === user.schoolId);

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    // Delete event (cascade will delete registrations)
    await db.delete(schoolEvents).where(eq(schoolEvents.id, id));

    logger.info("Event deleted", { eventId: id, deletedBy: user.id });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
