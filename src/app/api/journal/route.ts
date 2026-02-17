import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

// GET /api/journal - Get user's journal entries
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(['student']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user } = authResult;

  const settings = (user?.settings as any) || {};
  const entries = settings.journalEntries || [];

  return NextResponse.json({ entries });
}

// POST /api/journal - Create a new journal entry
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(['student']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user } = authResult;

  try {
    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const settings = (user?.settings as any) || {};
    const entries = settings.journalEntries || [];

    const newEntry = {
      id: `journal-${Date.now()}`,
      date: date || new Date().toISOString(),
      title,
      content,
      mood,
      tags: tags || [],
    };

    entries.push(newEntry);

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: entries },
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    console.error("Error saving journal entry:", error);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
