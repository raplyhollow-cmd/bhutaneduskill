import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { counselorNotes, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/counselor-notes/[id] - Get single note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth(['counselor', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const note = await db.query.counselorNotes.findFirst({
      where: eq(counselorNotes.id, id),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor-notes/[id]", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

// PUT /api/counselor-notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth(['counselor', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();

    const note = await db.query.counselorNotes.findFirst({
      where: eq(counselorNotes.id, id),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author can update
    if (note.counselorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedNote] = await db
      .update(counselorNotes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(counselorNotes.id, id))
      .returning();

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor-notes/[id]", method: "PUT" });
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE /api/counselor-notes/[id] - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth(['counselor', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const note = await db.query.counselorNotes.findFirst({
      where: eq(counselorNotes.id, id),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author can delete
    if (note.counselorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(counselorNotes).where(eq(counselorNotes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor-notes/[id]", method: "DELETE" });
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
