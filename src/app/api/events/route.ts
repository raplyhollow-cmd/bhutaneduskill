/**
 * SCHOOL EVENTS API ROUTE
 *
 * Handles CRUD operations for school events calendar
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { schoolEvents, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Build query conditions
    const conditions = [];

    // Filter by school
    if (currentUser.schoolId) {
      conditions.push(eq(schoolEvents.schoolId, currentUser.schoolId));
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
        id: currentUser.id,
        role: currentUser.role,
        canCreate: currentUser.role === "school_admin" || currentUser.role === "admin" || currentUser.role === "teacher",
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins and teachers can create events
    const canCreate = currentUser.role === "school_admin" || currentUser.role === "admin" || currentUser.role === "teacher";
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
      schoolId: currentUser.schoolId || "",
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
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      event: event[0],
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
