/**
 * TUITION SESSIONS API
 *
 * GET /api/tuition/sessions - List upcoming sessions
 * POST /api/tuition/sessions - Schedule live session
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { liveSessions, tutors, users } from "@/lib/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, createdResponse } from "@/lib/api/response-helpers";

const sessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  sessionType: z.enum(["one_on_one", "group"]),
  scheduledDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  platform: z.enum(["zoom", "google_meet", "teams", "in_app"]),
  maxParticipants: z.number().optional(),
  pricePerStudent: z.number().optional(),
  notes: z.string().optional(),
});

type SessionData = z.infer<typeof sessionSchema>;

// ============================================================================
// GET /api/tuition/sessions - List upcoming sessions
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get("tutorId");
    const upcoming = searchParams.get("upcoming") === "true";

    try {
      // Build where condition based on filters
      const whereCondition = upcoming
        ? eq(liveSessions.status, "scheduled")
        : undefined;

      // Get sessions using db.select()
      const sessionsResult = await db
        .select()
        .from(liveSessions)
        .where(whereCondition || undefined)
        .orderBy(desc(liveSessions.createdAt))
        .limit(100);

      // Get tutor information for each session
      const tutorIds = sessionsResult.map(s => s.tutorId).filter(Boolean);
      const tutorsResult = tutorIds.length > 0
        ? await db
            .select()
            .from(tutors)
            .where(eq(tutors.id, tutorIds[0])) // Simplified - would need batch
        : [];

      const tutorMap = new Map(tutorsResult.map(t => [t.id, t]));

      // Get user info for each tutor
      const userIds = tutorsResult.map(t => t.userId).filter((id): id is string => id !== null && id !== undefined);
      let usersResult: Array<{ id: string; firstName: string | null; lastName: string | null; profilePicture: string | null }> = [];
      if (userIds.length > 0) {
        // Fetch all matching users at once using inArray
        usersResult = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profilePicture: users.profilePicture,
          })
          .from(users)
          .where(inArray(users.id, userIds));
      }

      const userMap = new Map(usersResult.map(u => [u.id, u]));

      // Enrich sessions with tutor info
      const sessions = sessionsResult.map(session => {
        const tutor = tutorMap.get(session.tutorId);
        const userInfo = tutor ? userMap.get(tutor.userId) : null;

        return {
          ...session,
          tutor: tutor ? {
            ...tutor,
            user: userInfo || null,
          } : null,
        };
      });

      let filtered = sessions;
      if (tutorId) {
        filtered = sessions.filter(s => s.tutorId === tutorId);
      }

      return successResponse({ sessions: filtered });
    } catch (error) {
      logger.error("Sessions fetch error:", error);
      return errorResponse("Failed to fetch sessions", 500);
    }
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// POST /api/tuition/sessions - Schedule live session
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser } = auth;

    try {
      const body = await request.json();
      const validatedData = sessionSchema.parse(body);

      // Get tutor profile using db.select()
      const tutorResult = await db
        .select()
        .from(tutors)
        .where(eq(tutors.userId, currentUser.id))
        .limit(1);

      const tutor = tutorResult[0];

      if (!tutor) {
        return notFoundResponse("Tutor profile");
      }

      // Generate meeting link (placeholder - in production, integrate with Zoom/Google Meet API)
      const meetingLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 12)}`;

      const sessionResult = await db.insert(liveSessions).values({
        id: `session_${Date.now()}`,
        tutorId: tutor.id,
        title: validatedData.title,
        description: validatedData.description,
        subject: validatedData.subject,
        scheduledStart: validatedData.scheduledDate || validatedData.startTime,
        startTime: validatedData.startTime,
        scheduledEnd: validatedData.endTime,
        platform: validatedData.platform,
        meetingLink,
        maxParticipants: validatedData.maxParticipants,
        currentParticipants: 0,
        status: "scheduled",
        notes: validatedData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const session = sessionResult[0];

      return createdResponse({ session });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.error("Session creation error:", error);
      return errorResponse("Failed to create session", 500);
    }
  },
  ['admin', 'school-admin', 'teacher']
);
