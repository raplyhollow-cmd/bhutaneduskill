/**
 * JOURNAL [id] API
 *
 * GET /api/journal/[id] - Get a single journal entry
 * PUT /api/journal/[id] - Update a journal entry
 * DELETE /api/journal/[id] - Delete a journal entry
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api/response-helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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
export const GET = createApiRoute<{ id: string }>(
  async (req: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context.params;

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserSettings) || {};
    const entries = settings.journalEntries || [];

    const entry = entries.find((e: JournalEntry) => e.id === id);

    if (!entry) {
      return notFoundResponse("Entry not found");
    }

    return successResponse({ entry });
  },
  ['student']
);

// PUT /api/journal/[id] - Update a journal entry
export const PUT = createApiRoute<{ id: string }>(
  async (req: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context.params;

    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    const entryIndex = entries.findIndex((e: JournalEntry) => e.id === id);

    if (entryIndex === -1) {
      return notFoundResponse("Entry not found");
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
      .where(eq(users.id, userId));

    return successResponse({ entry: entries[entryIndex] });
  },
  ['student']
);

// DELETE /api/journal/[id] - Delete a journal entry
export const DELETE = createApiRoute<{ id: string }>(
  async (req: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context.params;

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    const filteredEntries = entries.filter((e: JournalEntry) => e.id !== id);

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: filteredEntries },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return successResponse({ success: true });
  },
  ['student']
);
