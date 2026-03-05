/**
 * JOURNAL API ROUTE
 *
 * Handles student journal entries stored in user.settings
 *
 * Endpoints:
 * - GET: Get user's journal entries
 * - POST: Create a new journal entry
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createApiRoute } from "@/lib/api/route-handler";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { nanoid } from "nanoid";

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
    const { userId } = auth;

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserSettings) || {};
    const entries = settings.journalEntries || [];

    return successResponse({ entries });
  },
  ['student']
);

// POST /api/journal - Create a new journal entry
export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    // DAILY LIMIT: Check if user already has an entry for today
    const today = new Date().toISOString().split('T')[0];
    const existingToday = entries.find((e: JournalEntry) => {
      const entryDate = new Date(e.date).toISOString().split('T')[0];
      return entryDate === today;
    });

    if (existingToday) {
      return badRequestResponse(
        "You can only write one journal entry per day. Come back tomorrow!"
      );
    }

    const newEntry: JournalEntry = {
      id: `journal-${nanoid()}`,
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
      .where(eq(users.id, userId));

    return successResponse({
      success: true,
      entry: newEntry,
    }, 201);
  },
  ['student']
);
