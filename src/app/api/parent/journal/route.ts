/**
 * PARENT JOURNAL API - Privacy-Filtered Child Journal Access
 *
 * FERPA COMPLIANCE:
 * - Only returns children linked via parent_to_student join table
 * - Privacy-filtered: Shows mood, topics, entry count, but NOT full content
 * - Parents can see wellness trends, not private thoughts
 *
 * Endpoint: GET /api/parent/journal?studentId=xxx
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

interface JournalSummary {
  studentId: string;
  studentName: string;
  totalEntries: number;
  moodTrend: Array<{ date: string; mood: string }>;
  commonTopics: string[];
  lastEntryDate: string | null;
  averageMood: string | null;
}

// GET /api/parent/journal - Get child's journal summary (privacy-filtered)
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return { error: "Student ID is required", status: 400 } satisfies ApiErrorResponse;
    }

    // Verify parent-child relationship
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, userId),
          eq(parentToStudent.studentId, studentId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("Unauthorized journal access attempt", {
        parentId: userId,
        studentId,
      });
      return { error: "Not authorized to view this student's journal", status: 403 } satisfies ApiErrorResponse;
    }

    // Get student's journal data from settings
    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        settings: users.settings,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      return { error: "Student not found", status: 404 } satisfies ApiErrorResponse;
    }

    // Extract journal entries (privacy-filtered)
    const settings = (student.settings as Record<string, unknown>) || {};
    const journalEntries = (settings.journalEntries as Array<{
      date: string;
      mood?: string;
      tags?: string[];
      title?: string;
    }>) || [];

    // Build privacy-filtered summary
    const sortedEntries = [...journalEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const moodTrend = sortedEntries
      .slice(-7) // Last 7 entries
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString(),
        mood: e.mood || "unknown",
      }));

    const allTags = sortedEntries.flatMap((e) => e.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonTopics = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Calculate average mood
    const moodCounts = moodTrend.reduce((acc, { mood }) => {
      if (mood && mood !== "unknown") {
        acc[mood] = (acc[mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const averageMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const data: JournalSummary = {
      studentId: student.id,
      studentName: student.name || "Unknown",
      totalEntries: journalEntries.length,
      moodTrend,
      commonTopics,
      lastEntryDate: sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].date : null,
      averageMood,
    };

    logger.info("Parent viewed child journal summary", {
      parentId: userId,
      studentId,
      entryCount: data.totalEntries,
    });

    return { data } satisfies ApiSuccess<JournalSummary>;
  },
  ["parent"]
);
