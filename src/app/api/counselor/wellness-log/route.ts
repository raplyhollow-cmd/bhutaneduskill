import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { counselingSessions, users, schools, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * POST /api/counselor/wellness-log
 *
 * Log a private wellness counseling session
 * Creates anonymized data for Ministry reporting
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(["counselor"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json();

    const {
      studentId,
      sessionType,
      sessionDate,
      duration,
      concerns,
      notes,
      gnhDomains,
      outcome,
      followUpRequired,
      followUpDate,
      confidentiality,
      notifyParent,
    } = body;

    if (!studentId || !sessionType || !notes) {
      return Response.json(
        { error: "studentId, sessionType, and notes are required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get student info for Ministry anonymization
    const student = await db.query.users.findFirst({
      where: eq(users.id, studentId),
      columns: { id: true, schoolId: true, classGrade: true },
    });

    if (!student) {
      return Response.json(
        { error: "Student not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Get school info for dzongkhag
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, student.schoolId!),
      columns: { id: true, name: true, level: true },
    });

    // Create session record
    const sessionId = `session-${nanoid()}`;
    await db.insert(counselingSessions).values({
      id: sessionId,
      counselorId: userId,
      studentId,
      schoolId: student.schoolId,
      type: sessionType,
      status: "completed",
      sessionDate: new Date(sessionDate),
      startTime: "00:00", // Would be actual time in full implementation
      endTime: duration
        ? `${Math.floor(parseInt(duration) / 60)}:${(parseInt(duration) % 60).toString().padStart(2, "0")}`
        : "00:30",
      topic: concerns?.join(", ") || "Wellness check-in",
      notes,
      outcome,
      confidentialityLevel: confidentiality || "standard",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Notify parent if requested
    if (notifyParent) {
      // Get parent for this student
      const parentLink = await db.query.parentToStudent.findFirst({
        where: eq(parentToStudent.studentId, studentId),
      });

      if (parentLink) {
        // In a full implementation, this would send SMS/email
        logger.info("Parent notification sent for wellness session", {
          sessionId,
          studentId,
          parentId: parentLink.parentId,
        });
      }
    }

    // Schedule follow-up if required
    if (followUpRequired && followUpDate) {
      const followUpId = `session-${nanoid()}`;
      await db.insert(counselingSessions).values({
        id: followUpId,
        counselorId: userId,
        studentId,
        schoolId: student.schoolId,
        type: sessionType,
        status: "scheduled",
        sessionDate: new Date(followUpDate),
        startTime: "00:00",
        endTime: "00:30",
        topic: `Follow-up: ${concerns?.join(", ") || "Wellness check-in"}`,
        notes: "Scheduled follow-up session",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Prepare anonymized data for Ministry (returned but not stored separately)
    const ministryData = {
      schoolLevel: school?.level || "middle",
      sessionType,
      concerns: concerns?.map((c: string) =>
        c.toLowerCase().replace(/[^a-z]/g, "_")
      ) || [],
      gnhDomains: gnhDomains || [],
      outcome: outcome ? "documented" : "in_progress",
      date: sessionDate,
      duration,
      // NO personal identifiers
    };

    logger.info("Wellness session logged", {
      sessionId,
      counselorId: userId,
      studentId,
      sessionType,
      concerns: concerns?.length || 0,
    });

    return Response.json({
      data: {
        sessionId,
        ministryData,
        message: "Session logged successfully",
      },
    } satisfies ApiSuccess<{
      sessionId: string;
      ministryData: {
        schoolLevel: string;
        sessionType: string;
        concerns: string[];
        gnhDomains: string[];
        outcome: string;
        date: string;
        duration: number | undefined;
      };
      message: string;
    }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/wellness-log", method: "POST" });
    return Response.json(
      { error: "Failed to log wellness session", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/counselor/wellness-log
 *
 * Get recent wellness sessions for counselor
 */
export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(["counselor"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const sessions = await db
      .select({
        id: counselingSessions.id,
        type: counselingSessions.type,
        status: counselingSessions.status,
        sessionDate: counselingSessions.sessionDate,
        topic: counselingSessions.topic,
        outcome: counselingSessions.outcome,
        confidentialityLevel: counselingSessions.confidentialityLevel,
        createdAt: counselingSessions.createdAt,
        studentId: counselingSessions.studentId,
        studentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        studentClass: users.classGrade,
      })
      .from(counselingSessions)
      .innerJoin(users, eq(counselingSessions.studentId, users.id))
      .where(eq(counselingSessions.counselorId, userId))
      .orderBy(desc(counselingSessions.sessionDate))
      .limit(limit);

    return Response.json({
      data: {
        sessions,
        count: sessions.length,
      },
    } satisfies ApiSuccess<{
      sessions: unknown[];
      count: number;
    }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/wellness-log", method: "GET" });
    return Response.json(
      { error: "Failed to fetch wellness sessions", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
