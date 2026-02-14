import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { counselorNotes, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/counselor-notes - Get counselor notes
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin', 'counselor']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser } = authResult;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const counselorId = searchParams.get("counselorId");

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

  let notes: any[];
  if (conditions.length > 0) {
    notes = await db.query.counselorNotes.findMany({
      where: conditions.length === 1 ? conditions[0] : and(...conditions),
      orderBy: desc(counselorNotes.createdAt),
    });
  } else {
    notes = [];
  }

  return NextResponse.json({ notes });
}

// POST /api/counselor-notes - Create counselor note
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['counselor']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser } = authResult;
  const body = await request.json();
  const { studentId, note, isPrivate, title, noteType = "session" } = body;

  // Validate required fields
  if (!studentId || !note) {
    return NextResponse.json({ error: "Missing required fields: studentId and note are required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const [newNote] = await db
    .insert(counselorNotes)
    .values({
      id: `note_${Date.now()}`,
      counselorId: currentUser.id,
      studentId,
      noteType, // "session" | "observation" | "intervention" | "follow_up"
      title: title || `Counseling Note - ${new Date().toLocaleDateString()}`,
      note,
      content: note, // Both note and content are stored
      isPrivate: !!isPrivate,
      isConfidential: false,
      sessionDate: now.split('T')[0], // YYYY-MM-DD format
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ note: newNote }, { status: 201 });
}
