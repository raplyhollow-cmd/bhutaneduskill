import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { counselorNotes, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/counselor-notes/[id] - Get single note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await db.query.counselorNotes.findFirst({
      where: eq(counselorNotes.id, params.id),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Counselor note fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

// PUT /api/counselor-notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const note = await db.query.counselorNotes.findFirst({
      where: eq(counselorNotes.id, params.id),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author can update
    if (note.counselorId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedNote] = await db
      .update(counselorNotes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(counselorNotes.id, params.id))
      .returning();

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("Counselor note update error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE /api/counselor-notes/[id] - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const note = await db.query.counselorNotes.findFirst({
      where: eq(counselorNotes.id, params.id),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author can delete
    if (note.counselorId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(counselorNotes).where(eq(counselorNotes.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Counselor note delete error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
