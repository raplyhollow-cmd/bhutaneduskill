/**
 * SCHOOL EVENTS API ROUTE
 *
 * Handles CRUD operations for school events calendar
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schoolEvents, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

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

    // Build query conditions
    const conditions = [];

    // Filter by school
    if (user.schoolId) {
      conditions.push(eq(schoolEvents.schoolId, user.schoolId));
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

    // Only published events
    conditions.push(eq(schoolEvents.status, "published"));

    // Fetch events
    const events = await db.query.schoolEvents.findMany({
      where: and(...conditions),
      with: {
        organizer: {
          columns: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [desc(schoolEvents.isAllDay), desc(schoolEvents.startDate)],
    });

    return NextResponse.json({
      events,
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

    const body = await request.json();
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
      requiresRSVP,
      rsvpDeadline,
      color,
      attachments,
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
    const [event] = await db.insert(schoolEvents).values({
      id: nanoid(),
      schoolId: user.schoolId || "",
      title,
      description: description || "",
      eventType,
      startDate,
      endDate,
      location: location || "",
      isAllDay: isAllDay ?? false,
      targetAudience: targetAudience || [],
      isRecurring: isRecurring ?? false,
      recurrencePattern,
      status: "upcoming",
      reminders: [],
      attachments: attachments || [],
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      event: event[0],
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
