/**
 * JOURNAL [id] API
 *
 * GET /api/journal/[id] - Get a single journal entry
 * PUT /api/journal/[id] - Update a journal entry
 * DELETE /api/journal/[id] - Delete a journal entry
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

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
export const GET = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing entry ID", status: 400 };
    }

    const settings = (user?.settings as UserSettings) || {};
    const entries = settings.journalEntries || [];

    const entry = entries.find((e: JournalEntry) => e.id === id);

    if (!entry) {
      return { error: "Entry not found", status: 404 };
    }

    return { entry };
  },
  ['student']
);

// PUT /api/journal/[id] - Update a journal entry
export const PUT = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing entry ID", status: 400 };
    }

    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const settings = (user?.settings as UserSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    const entryIndex = entries.findIndex((e: JournalEntry) => e.id === id);

    if (entryIndex === -1) {
      return { error: "Entry not found", status: 404 };
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

    return { entry: entries[entryIndex] };
  },
  ['student']
);

// DELETE /api/journal/[id] - Delete a journal entry
export const DELETE = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing entry ID", status: 400 };
    }

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

    return { success: true };
  },
  ['student']
);
