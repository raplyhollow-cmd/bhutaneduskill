import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
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

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/tuition/sessions/[id] - Get session details
export async function GET(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const resolvedParams = await params;
    id = resolvedParams.id;
    const session = await db.query.liveSessions.findFirst({
      where: eq(liveSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    logger.error(error, { route: "/api/tuition/sessions/[id]", method: "GET", id });
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}

// POST /api/tuition/sessions/[id]/join - Generate join link
export async function POST(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user: currentUser } = authResult;

    const resolvedParams = await params;
    id = resolvedParams.id;
    const session = await db.query.liveSessions.findFirst({
      where: eq(liveSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if ((session as LiveSession & { status?: string }).status !== "scheduled") {
      return NextResponse.json({ error: "Session is not available" }, { status: 400 });
    }

    // Check if session is full
    if (session.maxParticipants && (session.currentParticipants || 0) >= session.maxParticipants) {
      return NextResponse.json({ error: "Session is full" }, { status: 400 });
    }

    // Increment participant count
    await db.update(liveSessions)
      .set({
        currentParticipants: (session.currentParticipants || 0) + 1,
      })
      .where(eq(liveSessions.id, id));

    return NextResponse.json({
      meetingLink: session.meetingLink,
      meetingPassword: (session as LiveSession & { meetingPassword?: string }).meetingPassword,
      platform: (session as LiveSession & { platform?: string }).platform,
      scheduledDate: (session as LiveSession & { scheduledDate?: string }).scheduledDate,
      startTime: session.startTime,
      endTime: (session as LiveSession & { endTime?: string }).endTime,
    });
  } catch (error) {
    logger.error(error, { route: "/api/tuition/sessions/[id]", method: "POST", id, action: "join" });
    return NextResponse.json({ error: "Failed to join session" }, { status: 500 });
  }
}

// PUT /api/tuition/sessions/[id]/start - Start session
export async function PUT(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user: currentUser } = authResult;

    const resolvedParams = await params;
    id = resolvedParams.id;
    const session = await db.query.liveSessions.findFirst({
      where: eq(liveSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only tutor can start session
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.id, session.tutorId),
    });

    if (!tutor || (tutor as Tutor & { userId?: string }).userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(liveSessions)
      .set({
        status: "in_progress",
        actualStart: new Date(),
        actualStartTime: new Date(),
      })
      .where(eq(liveSessions.id, id))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    logger.error(error, { route: "/api/tuition/sessions/[id]", method: "PUT", id, action: "start" });
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}

// PATCH /api/tuition/sessions/[id]/end - End session
export async function PATCH(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user: currentUser } = authResult;

    const resolvedParams = await params;
    id = resolvedParams.id;
    const session = await db.query.liveSessions.findFirst({
      where: eq(liveSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only tutor can end session
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.id, session.tutorId),
    });

    if (!tutor || (tutor as Tutor & { userId?: string }).userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(liveSessions)
      .set({
        status: "completed",
        actualEnd: new Date(),
        actualEndTime: new Date(),
      })
      .where(eq(liveSessions.id, id))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    logger.error(error, { route: "/api/tuition/sessions/[id]", method: "PATCH", id, action: "end" });
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}

// DELETE /api/tuition/sessions/[id] - Cancel session
export async function DELETE(request: NextRequest, { params }: Params) {
  let id: string | undefined;
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user: currentUser } = authResult;

    const resolvedParams = await params;
    id = resolvedParams.id;
    const session = await db.query.liveSessions.findFirst({
      where: eq(liveSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only tutor can cancel session
    const tutor = await db.query.tutors.findFirst({
      where: eq(tutors.id, session.tutorId),
    });

    if (!tutor || (tutor as Tutor & { userId?: string }).userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [deleted] = await db.delete(liveSessions)
      .where(eq(liveSessions.id, id))
      .returning();

    return NextResponse.json({ session: deleted });
  } catch (error) {
    logger.error(error, { route: "/api/tuition/sessions/[id]", method: "DELETE", id });
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
