import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createApiRoute } from "@/lib/api/route-handler";
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

// GET /api/journal - Get user's journal entries
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user } = auth;

    const settings = (user?.settings as UserSettings) || {};
    const entries = settings.journalEntries || [];

    return { entries };
  },
  ['student']
);

// POST /api/journal - Create a new journal entry
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user } = auth;

    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const settings = (user?.settings as UserSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    // DAILY LIMIT: Check if user already has an entry for today
    const today = new Date().toISOString().split('T')[0];
    const existingToday = entries.find((e: JournalEntry) => {
      const entryDate = new Date(e.date).toISOString().split('T')[0];
      return entryDate === today;
    });

    if (existingToday) {
      return {
        success: false,
        error: "You can only write one journal entry per day. Come back tomorrow!",
        existingEntry: existingToday,
        status: 400
      };
    }

    const newEntry: JournalEntry = {
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

    return { success: true, entry: newEntry };
  },
  ['student']
);
