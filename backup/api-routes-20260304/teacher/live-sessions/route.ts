import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { liveSessions, classes } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";

// ============================================================================
// TYPES
// ============================================================================

type LiveSessionStatus = "scheduled" | "live" | "completed" | "cancelled";
type MeetingPlatform = "zoom" | "google_meet" | "teams" | "in_app";

interface LiveSessionResponse {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  platform: MeetingPlatform | null;
  meetingLink: string | null;
  meetingPassword: string | null;
  status: LiveSessionStatus;
  maxParticipants: number | null;
  currentParticipants: number;
  isRecorded: boolean;
  recordingUrl: string | null;
  courseId: string | null;
  tutorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createLiveSessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  subject: z.string().optional(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  platform: z.enum(["zoom", "google_meet", "teams", "in_app"]).default("google_meet"),
  meetingLink: z.string().url().optional().or(z.literal("")),
  meetingPassword: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  isRecorded: z.boolean().default(false),
  courseId: z.string().optional(),
});

const updateLiveSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  scheduledDate: z.string().min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  platform: z.enum(["zoom", "google_meet", "teams", "in_app"]).optional(),
  meetingLink: z.string().url().or(z.literal("")).optional(),
  meetingPassword: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  status: z.enum(["scheduled", "live", "completed", "cancelled"]).optional(),
  recordingUrl: z.string().url().or(z.literal("")).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate duration in minutes from start and end time strings
 */
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return Math.max(0, endMinutes - startMinutes);
}

/**
 * Format date for database storage
 */
function formatDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * Transform database live session to API response format
 */
function transformLiveSession(session: typeof liveSessions.$inferSelect): LiveSessionResponse {
  return {
    id: session.id,
    title: session.title,
    description: session.description || null,
    subject: session.subject || null,
    scheduledDate: session.scheduledStart?.split("T")[0] || session.scheduledDate || "",
    startTime: session.scheduledStart?.split("T")[1]?.substring(0, 5) || session.startTime || "",
    endTime: session.scheduledEnd?.split("T")[1]?.substring(0, 5) || session.endTime || "",
    duration: calculateDuration(
      session.scheduledStart?.split("T")[1]?.substring(0, 5) || session.startTime || "00:00",
      session.scheduledEnd?.split("T")[1]?.substring(0, 5) || session.endTime || "00:00"
    ),
    platform: session.platform as MeetingPlatform | null,
    meetingLink: session.meetingLink || null,
    meetingPassword: session.meetingPassword || null,
    status: session.status as LiveSessionStatus,
    maxParticipants: session.maxParticipants || null,
    currentParticipants: session.currentParticipants || session.participants || 0,
    isRecorded: !!session.recordingUrl,
    recordingUrl: session.recordingUrl || null,
    courseId: session.courseId || null,
    tutorId: session.tutorId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/teacher/live-sessions
 * List all live sessions for the teacher
 */
export const GET = createApiRoute(
  async (req, { userId }) => {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") as LiveSessionStatus | null;
    const upcoming = searchParams.get("upcoming") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    logger.info("Fetching live sessions", { userId, status, upcoming });

    // Build query conditions
    const conditions = [];

    // Only show sessions for this teacher
    conditions.push(eq(liveSessions.tutorId, userId));

    if (status) {
      conditions.push(eq(liveSessions.status, status));
    }

    if (upcoming) {
      const now = new Date().toISOString();
      conditions.push(sql`${liveSessions.scheduledStart} >= ${now}`);
    }

    // Fetch sessions
    let sessions = await db.select().from(liveSessions);
    if (conditions.length > 0) {
      sessions = await db.select().from(liveSessions).where(and(...conditions)).orderBy(desc(liveSessions.scheduledStart)).limit(limit);
    } else {
      sessions = await db.select().from(liveSessions).orderBy(desc(liveSessions.scheduledStart)).limit(limit);
    }

    // Transform sessions
    const transformedSessions = sessions.map(transformLiveSession);

    logger.info("Live sessions fetched successfully", {
      userId,
      count: transformedSessions.length,
    });

    return {
      success: true,
      data: {
        sessions: transformedSessions,
        pagination: {
          page,
          limit,
          total: transformedSessions.length,
        },
      },
    };
  },
  ["teacher", "admin"]
);

/**
 * POST /api/teacher/live-sessions
 * Create a new live session
 */
export const POST = createApiRoute(
  async (req, { userId }) => {
    const body = await req.json();

    // Validate request body
    const validatedData = createLiveSessionSchema.parse(body);

    // Calculate duration
    const duration = calculateDuration(validatedData.startTime, validatedData.endTime);

    // Generate session ID
    const sessionId = `live_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Format dates for database
    const scheduledStart = formatDateTime(validatedData.scheduledDate, validatedData.startTime);
    const scheduledEnd = formatDateTime(validatedData.scheduledDate, validatedData.endTime);

    // Create live session
    const [newSession] = await db.insert(liveSessions).values({
      id: sessionId,
      tutorId: userId,
      courseId: validatedData.courseId || null,
      title: validatedData.title,
      description: validatedData.description || "",
      scheduledStart,
      scheduledEnd,
      meetingLink: validatedData.meetingLink || null,
      meetingId: null,
      meetingPassword: validatedData.meetingPassword || null,
      platform: validatedData.platform,
      subject: validatedData.subject || null,
      status: "scheduled",
      participants: 0,
      maxParticipants: validatedData.maxParticipants || null,
      recordingUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Live session created", {
      sessionId,
      userId,
      title: validatedData.title,
    });

    // Transform and return
    const transformedSession = transformLiveSession(newSession);

    return {
      success: true,
      data: {
        session: transformedSession,
      },
      status: 201
    };
  },
  ["teacher", "admin"]
);

/**
 * PATCH /api/teacher/live-sessions
 * Update an existing live session
 */
export const PATCH = createApiRoute(
  async (req, { userId }) => {
    const body = await req.json();

    const { sessionId, ...updateData } = body;

    if (!sessionId) {
      return {
        error: "sessionId is required",
        status: 400
      };
    }

    // Validate update data
    const validatedData = updateLiveSessionSchema.parse(updateData);

    // Fetch existing session
    const [existingSession] = await db.select().from(liveSessions).where(eq(liveSessions.id, sessionId)).limit(1);

    if (!existingSession) {
      return {
        error: "Session not found",
        status: 404
      };
    }

    // Verify ownership (unless admin)
    if (existingSession.tutorId !== userId) {
      return {
        error: "You can only update your own sessions",
        status: 403
      };
    }

    // Prepare update values
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined) updateValues.title = validatedData.title;
    if (validatedData.description !== undefined) updateValues.description = validatedData.description;
    if (validatedData.subject !== undefined) updateValues.subject = validatedData.subject;
    if (validatedData.platform !== undefined) updateValues.platform = validatedData.platform;
    if (validatedData.meetingLink !== undefined) updateValues.meetingLink = validatedData.meetingLink;
    if (validatedData.meetingPassword !== undefined) updateValues.meetingPassword = validatedData.meetingPassword;
    if (validatedData.maxParticipants !== undefined) updateValues.maxParticipants = validatedData.maxParticipants;
    if (validatedData.status !== undefined) updateValues.status = validatedData.status;
    if (validatedData.recordingUrl !== undefined) updateValues.recordingUrl = validatedData.recordingUrl;

    // Update scheduled dates if provided
    if (validatedData.scheduledDate && validatedData.startTime && validatedData.endTime) {
      updateValues.scheduledStart = formatDateTime(validatedData.scheduledDate, validatedData.startTime);
      updateValues.scheduledEnd = formatDateTime(validatedData.scheduledDate, validatedData.endTime);
    }

    // Update session
    const [updatedSession] = await db.update(liveSessions)
      .set(updateValues)
      .where(eq(liveSessions.id, sessionId))
      .returning();

    logger.info("Live session updated", {
      sessionId,
      userId,
      updates: Object.keys(updateValues),
    });

    // Transform and return
    const transformedSession = transformLiveSession(updatedSession);

    return {
      success: true,
      data: {
        session: transformedSession,
      },
    };
  },
  ["teacher", "admin"]
);

/**
 * DELETE /api/teacher/live-sessions
 * Cancel/delete a live session
 */
export const DELETE = createApiRoute(
  async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return {
        error: "sessionId is required",
        status: 400
      };
    }

    // Fetch existing session
    const [existingSession] = await db.select().from(liveSessions).where(eq(liveSessions.id, sessionId)).limit(1);

    if (!existingSession) {
      return {
        error: "Session not found",
        status: 404
      };
    }

    // Verify ownership (unless admin)
    if (existingSession.tutorId !== userId) {
      return {
        error: "You can only cancel your own sessions",
        status: 403
      };
    }

    // Cancel session by updating status
    const [cancelledSession] = await db.update(liveSessions)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(liveSessions.id, sessionId))
      .returning();

    logger.info("Live session cancelled", {
      sessionId,
      userId,
    });

    // Transform and return
    const transformedSession = transformLiveSession(cancelledSession);

    return {
      success: true,
      data: {
        session: transformedSession,
      },
      message: "Session cancelled successfully",
    };
  },
  ["teacher", "admin"]
);
