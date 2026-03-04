import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { liveSessions, users, tutors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LiveSession {
  id: string;
  tutorId: string;
  meetingLink?: string | null;
  status?: string | null;
  maxParticipants?: number | null;
  currentParticipants?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
}

interface Tutor {
  id: string;
  userId?: string;
}

// GET /api/tuition/sessions/[id] - Get session details
export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, id))
      .limit(1);

    if (!session[0]) {
      return { error: "Session not found", status: 404 };
    }

    return { session: session[0] };
  },
  ['admin', 'school-admin', 'teacher']
);

// POST /api/tuition/sessions/[id]/join - Generate join link
export const POST = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user: currentUser } = auth;

    const { id } = await context!.params!;
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, id))
      .limit(1);

    if (!session[0]) {
      return { error: "Session not found", status: 404 };
    }

    if ((session as LiveSession & { status?: string }).status !== "scheduled") {
      return { error: "Session is not available", status: 400 };
    }

    // Check if session is full
    if (session.maxParticipants && (session.currentParticipants || 0) >= session.maxParticipants) {
      return { error: "Session is full", status: 400 };
    }

    // Increment participant count
    await db.update(liveSessions)
      .set({
        currentParticipants: (session.currentParticipants || 0) + 1,
      })
      .where(eq(liveSessions.id, id));

    return {
      meetingLink: session.meetingLink,
      meetingPassword: (session as LiveSession & { meetingPassword?: string }).meetingPassword,
      platform: (session as LiveSession & { platform?: string }).platform,
      scheduledDate: (session as LiveSession & { scheduledDate?: string }).scheduledDate,
      startTime: session.startTime,
      endTime: (session as LiveSession & { endTime?: string }).endTime,
    };
  },
  ['admin', 'school-admin', 'teacher']
);

// PUT /api/tuition/sessions/[id]/start - Start session
export const PUT = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user: currentUser } = auth;

    const { id } = await context!.params!;
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, id))
      .limit(1);

    if (!session[0]) {
      return { error: "Session not found", status: 404 };
    }

    // Only tutor can start session
    const [tutor] = await db
      .select()
      .from(tutors)
      .where(eq(tutors.id, session[0].tutorId))
      .limit(1);

    if (!tutor || (tutor as Tutor & { userId?: string }).userId !== currentUser.id) {
      return { error: "Forbidden", status: 403 };
    }

    const [updated] = await db.update(liveSessions)
      .set({
        status: "in_progress",
        actualStart: new Date(),
        actualStartTime: new Date(),
      })
      .where(eq(liveSessions.id, id))
      .returning();

    return { session: updated };
  },
  ['admin', 'school-admin', 'teacher']
);

// PATCH /api/tuition/sessions/[id]/end - End session
export const PATCH = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user: currentUser } = auth;

    const { id } = await context!.params!;
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, id))
      .limit(1);

    if (!session[0]) {
      return { error: "Session not found", status: 404 };
    }

    // Only tutor can end session
    const [tutor] = await db
      .select()
      .from(tutors)
      .where(eq(tutors.id, session[0].tutorId))
      .limit(1);

    if (!tutor || (tutor as Tutor & { userId?: string }).userId !== currentUser.id) {
      return { error: "Forbidden", status: 403 };
    }

    const [updated] = await db.update(liveSessions)
      .set({
        status: "completed",
        actualEnd: new Date(),
        actualEndTime: new Date(),
      })
      .where(eq(liveSessions.id, id))
      .returning();

    return { session: updated };
  },
  ['admin', 'school-admin', 'teacher']
);

// DELETE /api/tuition/sessions/[id] - Cancel session
export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user: currentUser } = auth;

    const { id } = await context!.params!;
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, id))
      .limit(1);

    if (!session[0]) {
      return { error: "Session not found", status: 404 };
    }

    // Only tutor can cancel session
    const [tutor] = await db
      .select()
      .from(tutors)
      .where(eq(tutors.id, session[0].tutorId))
      .limit(1);

    if (!tutor || (tutor as Tutor & { userId?: string }).userId !== currentUser.id) {
      return { error: "Forbidden", status: 403 };
    }

    const [deleted] = await db.delete(liveSessions)
      .where(eq(liveSessions.id, id))
      .returning();

    return { session: deleted };
  },
  ['admin', 'school-admin', 'teacher']
);
