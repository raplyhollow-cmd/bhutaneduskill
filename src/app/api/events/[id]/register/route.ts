/**
 * EVENT REGISTRATION API ROUTE
 *
 * Handles event registrations / RSVPs
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schoolEvents, eventRegistrations, users } from "@/lib/db/schema";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

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

export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id: eventId } = await context!.params!;
    const { user } = auth;

    // Verify event exists
    const event = await db.select().from(schoolEvents).where(eq(schoolEvents.id, eventId)).limit(1).then(r => r[0]);

    if (!event) {
      return { error: "Event not found", status: 404 };
    }

    // Check permissions
    const canView = user.type === "admin" || (user.schoolId && event.schoolId === user.schoolId);
    if (!canView) {
      return { error: "You don't have permission to view registrations for this event", status: 403 };
    }

    // Fetch registrations
    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId))
      .orderBy(desc(eventRegistrations.createdAt));

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

    return {
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
    };
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// POST - Register for an event
// ============================================================================

export const POST = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id: eventId } = await context!.params!;
    const { user } = auth;

    const body: CreateRegistrationInput = await request.json();
    const { notes, attendees, guardianName, guardianContact, responses } = body;

    // Verify event exists
    const event = await db.select().from(schoolEvents).where(eq(schoolEvents.id, eventId)).limit(1).then(r => r[0]);

    if (!event) {
      return { error: "Event not found", status: 404 };
    }

    // Check if event is in the future
    const eventDate = new Date(event.startDate);
    if (eventDate < new Date()) {
      return { error: "Cannot register for past events", status: 400 };
    }

    // Check if user is already registered
    const existingRegistration = await db.select().from(eventRegistrations).where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, user.id)
      )).limit(1).then(r => r[0]);

    if (existingRegistration) {
      return { error: "You are already registered for this event", status: 400 };
    }

    // Check max participants (stored in JSONB in the table)
    const maxParticipants = (event as typeof schoolEvents.$inferSelect & { maxParticipants?: number }).maxParticipants;
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
        return { error: "Event is fully booked", status: 400 };
      }
    }

    // For students, get parent info if needed
    let guardianNameToUse = guardianName;
    let guardianContactToUse = guardianContact;

    if (user.type === "student" && !guardianName && !guardianContact) {
      // Fetch full user record to get parentId (not in auth user object)
      const [studentRecord] = await db
        .select({
          parentId: users.parentId,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (studentRecord?.parentId) {
        const [parent] = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
          })
          .from(users)
          .where(eq(users.id, studentRecord.parentId))
          .limit(1);
        if (parent) {
          guardianNameToUse = `${parent.firstName} ${parent.lastName}`.trim();
          guardianContactToUse = parent.phone;
        }
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

    return {
      success: true,
      registration: registration[0] || registration,
      message: "Successfully registered for the event",
    };
  },
  ['student', 'teacher', 'parent', 'admin', 'school-admin']
);

// ============================================================================
// PATCH - Update registration status (admin/teacher only)
// ============================================================================

export const PATCH = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id: eventId } = await context!.params!;
    const { user } = auth;

    const body = await request.json();
    const { registrationId, status, checkedIn } = body;

    // Verify event exists
    const event = await db.select().from(schoolEvents).where(eq(schoolEvents.id, eventId)).limit(1).then(r => r[0]);

    if (!event) {
      return { error: "Event not found", status: 404 };
    }

    // Check permissions
    const canEdit = user.type === "admin" || (user.schoolId && event.schoolId === user.schoolId);
    if (!canEdit) {
      return { error: "You don't have permission to update registrations for this event", status: 403 };
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
      return { error: "Registration not found", status: 404 };
    }

    logger.info("Event registration updated", {
      registrationId,
      eventId,
      updatedBy: user.id,
      updateData,
    });

    return {
      success: true,
      registration: updatedRegistration,
      message: "Registration updated successfully",
    };
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// DELETE - Cancel registration
// ============================================================================

export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id: eventId } = await context!.params!;
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get("registrationId");

    if (!registrationId) {
      return { error: "Registration ID is required", status: 400 };
    }

    // Find registration
    const registration = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, registrationId)).limit(1).then(r => r[0]);

    if (!registration) {
      return { error: "Registration not found", status: 404 };
    }

    // Check ownership or admin
    const canCancel =
      user.type === "admin" ||
      user.type === "school-admin" ||
      registration.userId === user.id;

    if (!canCancel) {
      return { error: "You don't have permission to cancel this registration", status: 403 };
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

    return {
      success: true,
      message: "Registration cancelled successfully",
    };
  },
  ['student', 'teacher', 'parent', 'admin', 'school-admin']
);
