import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { liveSessions, users, tutors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/tuition/sessions/[id] - Get session details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const session = await db.query.liveSessions.findFirst({
      where: eq(liveSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session get error:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}

// POST /api/tuition/sessions/[id]/join - Generate join link
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const session = await db.query.liveSessions.findFirst({
      where: eq(liveSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "scheduled") {
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
      meetingPassword: session.meetingPassword,
      platform: session.platform,
      scheduledDate: session.scheduledDate,
      startTime: session.startTime,
      endTime: session.endTime,
    });
  } catch (error) {
    console.error("Session join error:", error);
    return NextResponse.json({ error: "Failed to join session" }, { status: 500 });
  }
}

// PUT /api/tuition/sessions/[id]/start - Start session
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
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

    if (!tutor || tutor.userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(liveSessions)
      .set({
        status: "in_progress",
        actualStartTime: new Date(),
      })
      .where(eq(liveSessions.id, id))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Session start error:", error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}

// PATCH /api/tuition/sessions/[id]/end - End session
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
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

    if (!tutor || tutor.userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(liveSessions)
      .set({
        status: "completed",
        actualEndTime: new Date(),
      })
      .where(eq(liveSessions.id, id))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Session end error:", error);
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}

// DELETE /api/tuition/sessions/[id] - Cancel session
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
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

    if (!tutor || tutor.userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [deleted] = await db.delete(liveSessions)
      .where(eq(liveSessions.id, id))
      .returning();

    return NextResponse.json({ session: deleted });
  } catch (error) {
    console.error("Session delete error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
