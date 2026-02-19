import { logger } from "@/lib/logger";
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

    // DAILY LIMIT: Check if user already has an entry for today
    const today = new Date().toISOString().split('T')[0];
    const existingToday = entries.find((e: any) => {
      const entryDate = new Date(e.date).toISOString().split('T')[0];
      return entryDate === today;
    });

    if (existingToday) {
      return NextResponse.json({
        success: false,
        error: "You can only write one journal entry per day. Come back tomorrow!",
        existingEntry: existingToday
      }, { status: 400 });
    }

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
    logger.apiError(error, { route: "/api/journal", method: "POST" });
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
