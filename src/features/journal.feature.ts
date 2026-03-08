/**
 * JOURNAL FEATURE
 *
 * Student journal entries stored in user.settings
 * Each student can write one journal entry per day
 */

import { defineFeature } from "@/lib/features/define-feature";
import { z } from "zod";

/**
 * Journal entry structure
 */
export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  updatedAt?: string;
}

/**
 * User settings with journal entries
 */
export interface UserJournalSettings {
  journalEntries?: JournalEntry[];
  [key: string]: unknown;
}

/**
 * Journal Feature Configuration
 *
 * Note: This is different from other features as it stores data
 * in the user's settings JSONB field rather than a separate table.
 */
export const JournalFeature = {
  name: "journal",
  tableName: "users", // Uses users table for settings storage

  // Get all journal entries for a user
  getEntries: async (userId: string, db: any): Promise<JournalEntry[]> => {
    const { users } = await import("@/lib/db/schema");
    const { eq: eqFn } = await import("drizzle-orm");

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eqFn(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserJournalSettings) || {};
    return settings.journalEntries || [];
  },

  // Get a single journal entry
  getEntry: async (userId: string, entryId: string, db: any): Promise<JournalEntry | null> => {
    const entries = await JournalFeature.getEntries(userId, db);
    return entries.find(e => e.id === entryId) || null;
  },

  // Create a new journal entry
  createEntry: async (
    userId: string,
    data: { title: string; content: string; mood: string; tags: string[]; date?: string },
    db: any
  ): Promise<{ success: boolean; entry?: JournalEntry; error?: string; existingEntry?: JournalEntry }> => {
    const { users } = await import("@/lib/db/schema");
    const { eq: eqFn } = await import("drizzle-orm");
    const { nanoid } = await import("nanoid");

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eqFn(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserJournalSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    // Check daily limit - one entry per day
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
      };
    }

    const newEntry: JournalEntry = {
      id: `journal-${nanoid()}`,
      date: data.date || new Date().toISOString(),
      title: data.title,
      content: data.content,
      mood: data.mood,
      tags: data.tags || [],
    };

    entries.push(newEntry);

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: entries },
        updatedAt: new Date(),
      })
      .where(eqFn(users.id, userId));

    return { success: true, entry: newEntry };
  },

  // Update a journal entry
  updateEntry: async (
    userId: string,
    entryId: string,
    data: { title: string; content: string; mood: string; tags: string[] },
    db: any
  ): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> => {
    const { users } = await import("@/lib/db/schema");
    const { eq: eqFn } = await import("drizzle-orm");

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eqFn(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserJournalSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    const entryIndex = entries.findIndex((e: JournalEntry) => e.id === entryId);

    if (entryIndex === -1) {
      return { success: false, error: "Entry not found" };
    }

    entries[entryIndex] = {
      ...entries[entryIndex],
      title: data.title,
      content: data.content,
      mood: data.mood,
      tags: data.tags,
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: entries },
        updatedAt: new Date(),
      })
      .where(eqFn(users.id, userId));

    return { success: true, entry: entries[entryIndex] };
  },

  // Delete a journal entry
  deleteEntry: async (
    userId: string,
    entryId: string,
    db: any
  ): Promise<{ success: boolean; error?: string }> => {
    const { users } = await import("@/lib/db/schema");
    const { eq: eqFn } = await import("drizzle-orm");

    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eqFn(users.id, userId))
      .limit(1);

    const settings = (user?.settings as UserJournalSettings) || {};
    const entries: JournalEntry[] = settings.journalEntries || [];

    const filteredEntries = entries.filter((e: JournalEntry) => e.id !== entryId);

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: filteredEntries },
        updatedAt: new Date(),
      })
      .where(eqFn(users.id, userId));

    return { success: true };
  },

  // Get AI insights for journal entries
  getAIInsights: async (
    userId: string,
    db: any
  ): Promise<{ success: boolean; insights?: string; error?: string }> => {
    // This would call an AI service to analyze journal entries
    // For now, return a placeholder
    return {
      success: true,
      insights: "AI journal analysis is not yet implemented.",
    };
  },
};

// Also export for compatibility
export { JournalFeature as JournalEntriesFeature };

// Types for use in components
