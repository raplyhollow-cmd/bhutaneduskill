import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  updatedAt?: string;
}

interface UserSettings {
  journalEntries?: JournalEntry[];
  [key: string]: unknown;
}

// GET /api/journal/[id] - Get a single journal entry
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { id } = await params;

    const settings = (user?.settings as UserSettings) || {};
    const entries = settings.journalEntries || [];

    const entry = entries.find((e: JournalEntry) => e.id === id);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

// PUT /api/journal/[id] - Update a journal entry
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { id } = await params;
    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const settings = (user?.settings as UserSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    const entryIndex = entries.findIndex((e: JournalEntry) => e.id === id);

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    entries[entryIndex] = {
      ...entries[entryIndex],
      title,
      content,
      mood,
      tags,
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: entries },
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ entry: entries[entryIndex] });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

// DELETE /api/journal/[id] - Delete a journal entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { id } = await params;

    const settings = (user?.settings as UserSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    const filteredEntries = entries.filter((e: JournalEntry) => e.id !== id);

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: filteredEntries },
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
