/**
 * Counselor Sessions API
 *
 * GET /api/counselor/sessions - Get counselor sessions
 * POST /api/counselor/sessions - Create a new counseling session
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { counselingSessions, users } from "@/lib/db/schema";
import { eq, and, gte, desc, count, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, createdResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";
import type { SessionStats } from "@/types";

// ============================================================================
// GET - Get counselor sessions with statistics
// ============================================================================

export const GET = createApiRoute(
  async (request, auth) => {
    const { user } = auth;
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // scheduled, in_progress, completed, cancelled, no-show
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // Build query conditions
    const conditions = user.type === 'admin'
      ? undefined
      : eq(counselingSessions.counselorId, user.id);

    // Get sessions using the correct field name: sessionDate
    const sessions = await db.query.counselingSessions.findMany({
      where: conditions,
      orderBy: [desc(counselingSessions.sessionDate)],
      limit,
    });

    // Get statistics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [upcomingCount, completedTodayCount, totalCount, groupSessionsCount] = await Promise.all([
      // Upcoming sessions (scheduled and in the future)
      db.select({ count: count() })
        .from(counselingSessions)
        .where(
          and(
            eq(counselingSessions.counselorId, user.id),
            eq(counselingSessions.status, 'scheduled'),
            gte(counselingSessions.sessionDate, now.toISOString())
          )
        ),

      // Completed today
      db.select({ count: count() })
        .from(counselingSessions)
        .where(
          and(
            eq(counselingSessions.counselorId, user.id),
            eq(counselingSessions.status, 'completed'),
            gte(counselingSessions.sessionDate, todayStart.toISOString()),
            sql`${counselingSessions.sessionDate} < ${todayEnd.toISOString()}`
          )
        ),

      // Total sessions
      db.select({ count: count() })
        .from(counselingSessions)
        .where(eq(counselingSessions.counselorId, user.id)),

      // Group sessions
      db.select({ count: count() })
        .from(counselingSessions)
        .where(
          and(
            eq(counselingSessions.counselorId, user.id),
            eq(counselingSessions.type, 'group')
          )
        ),
    ]);

    // Calculate total hours (based on session duration from startTime/endTime)
    const allSessions = await db.query.counselingSessions.findMany({
      where: eq(counselingSessions.counselorId, user.id),
      columns: { startTime: true, endTime: true },
    });

    let totalHours = 0;
    for (const session of allSessions) {
      if (session.startTime && session.endTime) {
        const start = new Date(`2000-01-01T${session.startTime}`);
        const end = new Date(`2000-01-01T${session.endTime}`);
        const diffMs = end.getTime() - start.getTime();
        totalHours += diffMs / (1000 * 60 * 60); // Convert to hours
      }
    }

    const stats: SessionStats = {
      upcomingSessions: upcomingCount[0]?.count || 0,
      completedToday: completedTodayCount[0]?.count || 0,
      totalHours: Math.round(totalHours * 10) / 10,
      groupSessions: groupSessionsCount[0]?.count || 0,
    };

    return successResponse({
      sessions,
      stats,
    });
  },
  ['counselor', 'admin']
);

// ============================================================================
// POST - Create a new counseling session
// ============================================================================

export const POST = createApiRoute(
  async (request, auth) => {
    const { user } = auth;
    const body = await request.json();
    const {
      studentId,
      type = 'individual',
      sessionDate,
      startTime,
      endTime,
      location = 'Counseling Office',
      topic,
      notes,
    } = body;

    // Validate required fields
    if (!sessionDate || !startTime || !endTime) {
      return badRequestResponse("Session date, start time, and end time are required");
    }

    if (type === 'individual' && !studentId) {
      return badRequestResponse("Student ID is required for individual sessions");
    }

    // Verify student exists for individual sessions
    if (type === 'individual' && studentId) {
      const student = await db.query.users.findFirst({
        where: eq(users.id, studentId),
      });

      if (!student || student.type !== 'student') {
        return notFoundResponse("Student");
      }
    }

    const sessionId = `session_${nanoid()}`;
    const now = new Date();

    // Create session with correct schema fields
    const newSessionResult = await db.insert(counselingSessions).values({
      id: sessionId,
      counselorId: user.id,
      studentId: type === 'individual' ? studentId : null,
      type,
      status: 'scheduled',
      sessionDate: new Date(sessionDate).toISOString(),
      startTime,
      endTime,
      location,
      topic,
      notes,
      outcome: null,
      isRecurring: false,
      schoolId: user.schoolId || null,
      tags: [],
      createdAt: now,
      updatedAt: now,
    }).returning();

    const newSession = Array.isArray(newSessionResult) ? newSessionResult[0] : newSessionResult;

    logger.info("Counseling session created", {
      userId: user.id,
      sessionId,
      type,
      studentId,
    });

    return createdResponse({ session: newSession });
  },
  ['counselor', 'admin']
);
