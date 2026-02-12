import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/counselor/sessions - Get counselor sessions
// Note: This returns empty array for now as sessions table doesn't exist in schema
// When counseling_sessions table is added to schema, this will be updated
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true },
    });

    if (!currentUser || currentUser.type !== "counselor") {
      return NextResponse.json({ error: "Forbidden - counselors only" }, { status: 403 });
    }

    // Return empty array - sessions feature not implemented in database yet
    // When counseling_sessions table is added, this will query it
    return NextResponse.json({
      sessions: [],
      stats: {
        upcomingSessions: 0,
        completedToday: 0,
        totalHours: 0,
        groupSessions: 0,
      },
    });
  } catch (error) {
    console.error("Counselor sessions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

// POST /api/counselor/sessions - Create a new counseling session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, type, date, startTime, endTime, location, topic, notes } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true },
    });

    if (!currentUser || currentUser.type !== "counselor") {
      return NextResponse.json({ error: "Forbidden - counselors only" }, { status: 403 });
    }

    // Return mock response - sessions feature not implemented in database yet
    return NextResponse.json({
      session: {
        id: `session_${Date.now()}`,
        counselorId: currentUser.id,
        studentId: studentId || null,
        type: type || "individual",
        status: "scheduled",
        date,
        startTime,
        endTime,
        location: location || "Counseling Office",
        topic: topic || "Counseling Session",
        notes: notes || null,
        isRecurring: false,
      },
      message: "Session scheduling feature coming soon - sessions table not yet in database schema",
    }, { status: 201 });
  } catch (error) {
    console.error("Counselor session creation error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
