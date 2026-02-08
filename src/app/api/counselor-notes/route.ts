import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { counselorNotes, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/counselor-notes - Get counselor notes
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const counselorId = searchParams.get("counselorId");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only counselors and admins can view notes
    if (!["admin", "counselor"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conditions = [];
    if (counselorId) {
      conditions.push(eq(counselorNotes.counselorId, counselorId));
    }
    if (studentId) {
      conditions.push(eq(counselorNotes.studentId, studentId));
    }

    // Counselors can only see their own notes (unless admin)
    if (currentUser.type === "counselor") {
      conditions.push(eq(counselorNotes.counselorId, currentUser.id));
    }

    let notes;
    if (conditions.length > 0) {
      notes = await db.query.counselorNotes.findMany({
        where: conditions.length === 1 ? conditions[0] : and(...conditions),
        orderBy: [counselorNotes.createdAt, "desc"],
      });
    } else {
      notes = [];
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Counselor notes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST /api/counselor-notes - Create counselor note
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, note, isPrivate } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only counselors can create notes
    if (currentUser.type !== "counselor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [newNote] = await db
      .insert(counselorNotes)
      .values({
        id: `note_${Date.now()}`,
        counselorId: currentUser.id,
        studentId,
        note,
        isPrivate: isPrivate ? 1 : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("Counselor note creation error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
