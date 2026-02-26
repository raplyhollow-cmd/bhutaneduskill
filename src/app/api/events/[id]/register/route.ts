/**
 * EVENT REGISTRATION API ROUTE
 *
 * Handles event registrations / RSVPs
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schoolEvents, eventRegistrations, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CreateRegistrationInput {
  eventId: string;
  notes?: string;
  attendees?: number;
  guardianName?: string;
  guardianContact?: string;
  responses?: Record<string, string | string[]>;
}

// ============================================================================
// GET - Fetch event registrations (admin/teacher only)
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    // Verify event exists
    const event = await db.query.schoolEvents.findFirst({
      where: eq(schoolEvents.id, eventId),
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canView = user.type === "admin" || (user.schoolId && event.schoolId === user.schoolId);
    if (!canView) {
      return NextResponse.json(
        { error: "You don't have permission to view registrations for this event" },
        { status: 403 }
      );
    }

    // Fetch registrations
    const registrations = await db.query.eventRegistrations.findMany({
      where: eq(eventRegistrations.eventId, eventId),
      with: {
        user: {
          columns: { id: true, firstName: true, lastName: true, email: true, type: true, grade: true },
        },
      },
      orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
    });

    // Get registration counts by status
    const statusCounts = await db
      .select({
        status: eventRegistrations.status,
        count: sql<number>`count(*)`,
      })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId))
      .groupBy(eventRegistrations.status);

    const counts = statusCounts.reduce((acc, item) => {
      acc[item.status || "registered"] = (item.count as number);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      registrations,
      counts: {
        total: registrations.length,
        registered: counts.registered || 0,
        confirmed: counts.confirmed || 0,
        cancelled: counts.cancelled || 0,
        attended: counts.attended || 0,
        noShow: counts.no_show || 0,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events/[id]/register", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Register for an event
// ============================================================================

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;
  try {
    const authResult = await requireAuth(['student', 'teacher', 'parent', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const body: CreateRegistrationInput = await request.json();
    const { notes, attendees, guardianName, guardianContact, responses } = body;

    // Verify event exists
    const event = await db.query.schoolEvents.findFirst({
      where: eq(schoolEvents.id, eventId),
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event is in the future
    const eventDate = new Date(event.startDate);
    if (eventDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot register for past events" },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingRegistration = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, user.id)
      ),
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      );
    }

    // Check max participants (stored in JSONB in the table)
    const maxParticipants = (event as any).maxParticipants;
    if (maxParticipants) {
      const currentRegistrations = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            eq(eventRegistrations.status, "registered")
          )
        );
      const currentCount = currentRegistrations[0]?.count || 0;
      if (currentCount >= maxParticipants) {
        return NextResponse.json(
          { error: "Event is fully booked" },
          { status: 400 }
        );
      }
    }

    // For students, get parent info if needed
    let guardianNameToUse = guardianName;
    let guardianContactToUse = guardianContact;

    if (user.type === "student" && !guardianName && !guardianContact && user.parentId) {
      const parent = await db.query.users.findFirst({
        where: eq(users.id, user.parentId),
        columns: { firstName: true, lastName: true, phone: true },
      });
      if (parent) {
        guardianNameToUse = `${parent.firstName} ${parent.lastName}`.trim();
        guardianContactToUse = parent.phone;
      }
    }

    // Create registration
    const now = new Date();
    const registrationId = `reg_${nanoid(12)}`;
    const [registration] = await db.insert(eventRegistrations).values({
      id: registrationId,
      eventId,
      userId: user.id,
      schoolId: event.schoolId,
      status: "registered",
      registrationType: "rsvp",
      notes: notes || "",
      attendees: attendees || 1,
      guardianName: guardianNameToUse,
      guardianContact: guardianContactToUse,
      responses: responses || {},
      createdAt: now,
      updatedAt: now,
    }).returning();

    logger.info("Event registration created", {
      registrationId,
      eventId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      registration: registration[0] || registration,
      message: "Successfully registered for the event",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events/[id]/register", method: "POST" });
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update registration status (admin/teacher only)
// ============================================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const body = await request.json();
    const { registrationId, status, checkedIn } = body;

    // Verify event exists
    const event = await db.query.schoolEvents.findFirst({
      where: eq(schoolEvents.id, eventId),
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canEdit = user.type === "admin" || (user.schoolId && event.schoolId === user.schoolId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to update registrations for this event" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: {
      updatedAt: Date;
      status?: string;
      checkedInAt?: Date | null;
      checkedInBy?: string | null;
    } = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    if (checkedIn !== undefined) {
      if (checkedIn) {
        updateData.checkedInAt = new Date();
        updateData.checkedInBy = user.id;
        updateData.status = "attended";
      } else {
        updateData.checkedInAt = null;
        updateData.checkedInBy = null;
      }
    }

    // Update registration
    const [updatedRegistration] = await db.update(eventRegistrations)
      .set(updateData)
      .where(eq(eventRegistrations.id, registrationId))
      .returning();

    if (!updatedRegistration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    logger.info("Event registration updated", {
      registrationId,
      eventId,
      updatedBy: user.id,
      updateData,
    });

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
      message: "Registration updated successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events/[id]/register", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cancel registration
// ============================================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;
  try {
    const authResult = await requireAuth(['student', 'teacher', 'parent', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get("registrationId");

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }

    // Find registration
    const registration = await db.query.eventRegistrations.findFirst({
      where: eq(eventRegistrations.id, registrationId),
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const canCancel =
      user.type === "admin" ||
      user.type === "school_admin" ||
      registration.userId === user.id;

    if (!canCancel) {
      return NextResponse.json(
        { error: "You don't have permission to cancel this registration" },
        { status: 403 }
      );
    }

    // Update status to cancelled instead of deleting
    const [updatedRegistration] = await db.update(eventRegistrations)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(eventRegistrations.id, registrationId))
      .returning();

    logger.info("Event registration cancelled", {
      registrationId,
      eventId,
      cancelledBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/events/[id]/register", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
}
