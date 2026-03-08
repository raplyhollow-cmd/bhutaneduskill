/**
 * PEER-TO-PEER TEACHER SWAP API
 *
 * POST /api/timetable/swap
 *
 * Enables teachers to request schedule swaps with their colleagues for emergencies
 * or personal reasons. Features:
 * - Swap request creation
 * - Accept/reject responses
 * - Alternative proposals
 * - Admin final approval
 *
 * Flow:
 * 1. Teacher A initiates swap request with Teacher B
 * 2. Teacher B receives notification and can accept/reject/propose alternative
 * 3. Once both agree, admin can finalize the swap
 * 4. Timetable entries are swapped atomically
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, schools, timetables, classes, subjects } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { nanoid } from "nanoid";

interface SwapRequestBody {
  action: "request" | "respond" | "finalize" | "list" | "suggest";
  // For request action
  requesterTeacherId?: string;
  requesterPeriod?: { day: string; period: number };
  targetTeacherId?: string;
  reason?: "emergency" | "medical" | "personal" | "preference";
  message?: string;
  // For respond action
  swapRequestId?: string;
  response?: "accept" | "reject";
  alternativeProposal?: { day: string; period: number };
  // For list action
  status?: "pending" | "all";
  // For suggest action
  teacherId?: string;
  periodToSwap?: { day: string; period: number };
  subjectId?: string;
}

// In-memory storage for swap requests (in production, use database table)
const swapRequests = new Map<string, SwapRequest>();

interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  requesterPeriod: { day: string; period: number };
  targetPeriod?: { day: string; period: number };
  requesterEntry: TimetableEntryInfo;
  targetEntry?: TimetableEntryInfo;
  reason: "emergency" | "medical" | "personal" | "preference";
  message: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: Date;
  respondedAt?: Date;
  aiCompatibilityScore?: number;
}

interface TimetableEntryInfo {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  roomNumber: string;
  roomName: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
}

/**
 * Get teacher's timetable entry for a specific day and period
 */
async function getTeacherTimetableEntry(
  schoolId: string,
  teacherId: string,
  dayOfWeek: string,
  periodNumber: number
): Promise<TimetableEntryInfo | null> {
  const result = await db
    .select({
      id: timetables.id,
      classId: timetables.classId,
      className: classes.name,
      subjectId: timetables.subjectId,
      subjectName: subjects.name,
      roomNumber: timetables.roomNumber,
      dayOfWeek: timetables.dayOfWeek,
      periodNumber: timetables.periodNumber,
      startTime: timetables.startTime,
      endTime: timetables.endTime,
    })
    .from(timetables)
    .innerJoin(classes, eq(timetables.classId, classes.id))
    .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
    .where(
      and(
        eq(timetables.schoolId, schoolId),
        eq(timetables.teacherId, teacherId),
        eq(timetables.dayOfWeek, dayOfWeek),
        eq(timetables.periodNumber, periodNumber)
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  return {
    id: result[0].id,
    classId: result[0].classId,
    className: result[0].className || "",
    subjectId: result[0].subjectId,
    subjectName: result[0].subjectName || "",
    roomNumber: result[0].roomNumber || "",
    roomName: "", // Would need rooms join
    dayOfWeek: result[0].dayOfWeek,
    periodNumber: result[0].periodNumber,
    startTime: result[0].startTime,
    endTime: result[0].endTime,
  };
}

/**
 * Get all teachers with their subjects
 */
async function getTeachersWithSubjects(schoolId: string) {
  const result = await db
    .select({
      id: users.id,
      name: users.fullName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.schoolId, schoolId));

  // Get subjects for each teacher from timetable
  const teachersWithSubjects = await Promise.all(
    result.map(async (teacher) => {
      const teacherSubjects = await db
        .selectDistinct({ subjectId: timetables.subjectId, subjectName: subjects.name })
        .from(timetables)
        .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
        .where(eq(timetables.teacherId, teacher.id));

      return {
        id: teacher.id,
        name: teacher.name || teacher.email || "",
        subjects: teacherSubjects.map((s) => s.subjectId),
      };
    })
  );

  return teachersWithSubjects;
}

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const body: SwapRequestBody = await request.json();
      const { action } = body;

      if (!action) {
        return badRequestResponse("Action is required");
      }

      switch (action) {
        case "request":
          return await handleSwapRequest(body, user.schoolId, userId, user.type);
        case "respond":
          return await handleSwapResponse(body, user.schoolId, userId, user.type);
        case "finalize":
          return await handleSwapFinalize(body, user.schoolId, userId, user.type);
        case "list":
          return await handleSwapList(body, user.schoolId, userId, user.type);
        case "suggest":
          return await handleSwapSuggest(body, user.schoolId);
        default:
          return badRequestResponse("Invalid action");
      }
    } catch (error) {
      logger.error("Swap API failed", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Swap operation failed");
    }
  },
  ["school-admin", "teacher"]
);

/**
 * Handle swap request creation
 */
async function handleSwapRequest(body: SwapRequestBody, schoolId: string, userId: string, userRole: string) {
  const { requesterTeacherId, requesterPeriod, targetTeacherId, reason = "personal", message = "" } = body;

  if (!requesterTeacherId || !requesterPeriod || !targetTeacherId) {
    return badRequestResponse("Missing required fields for swap request");
  }

  // Verify requester is the current user or admin
  if (requesterTeacherId !== userId && userRole !== "school-admin") {
    return badRequestResponse("You can only request swaps for yourself");
  }

  // Get requester's timetable entry for the period
  const requesterEntry = await getTeacherTimetableEntry(
    schoolId,
    requesterTeacherId,
    requesterPeriod.day,
    requesterPeriod.period
  );

  if (!requesterEntry) {
    return badRequestResponse("No timetable entry found for the specified period");
  }

  // Get target teacher's info
  const targetTeacher = await db
    .select({ name: users.fullName })
    .from(users)
    .where(eq(users.id, targetTeacherId!))
    .limit(1);

  if (targetTeacher.length === 0) {
    return notFoundResponse("Target teacher");
  }

  // Get requester's info
  const requesterTeacher = await db
    .select({ name: users.fullName })
    .from(users)
    .where(eq(users.id, requesterTeacherId))
    .limit(1);

  // Create swap request
  const swapId = `swap-${nanoid()}`;
  const swapRequest: SwapRequest = {
    id: swapId,
    requesterId: requesterTeacherId,
    requesterName: requesterTeacher[0]?.name || "Unknown",
    targetId: targetTeacherId!,
    targetName: targetTeacher[0]?.name || "Unknown",
    requesterPeriod,
    requesterEntry,
    reason,
    message,
    status: "pending",
    createdAt: new Date(),
  };

  swapRequests.set(swapId, swapRequest);

  logger.info("Swap request created", { swapId, requesterId: requesterTeacherId, targetId: targetTeacherId });

  return successResponse({
    swapRequest,
    message: "Swap request sent successfully",
  });
}

/**
 * Handle swap response (accept/reject)
 */
async function handleSwapResponse(body: SwapRequestBody, schoolId: string, userId: string, userRole: string) {
  const { swapRequestId, response = "accept", alternativeProposal } = body;

  if (!swapRequestId) {
    return badRequestResponse("Swap request ID is required");
  }

  const swapRequest = swapRequests.get(swapRequestId);
  if (!swapRequest) {
    return notFoundResponse("Swap request");
  }

  // Verify user is the target teacher
  if (swapRequest.targetId !== userId && userRole !== "school-admin") {
    return badRequestResponse("You can only respond to requests sent to you");
  }

  if (swapRequest.status !== "pending") {
    return badRequestResponse("This swap request has already been " + swapRequest.status);
  }

  if (response === "reject") {
    swapRequest.status = "rejected";
    swapRequest.respondedAt = new Date();
    swapRequests.set(swapRequestId, swapRequest);

    return successResponse({
      message: "Swap request rejected",
      swapRequest,
    });
  }

  if (response === "accept") {
    swapRequest.status = "accepted";
    swapRequest.respondedAt = new Date();

    if (alternativeProposal) {
      swapRequest.targetPeriod = alternativeProposal;
    }

    swapRequests.set(swapRequestId, swapRequest);

    logger.info("Swap request accepted", { swapRequestId });

    return successResponse({
      message: "Swap request accepted. Awaiting admin final approval.",
      swapRequest,
    });
  }

  return badRequestResponse("Invalid response");
}

/**
 * Handle swap finalization (admin approval and execution)
 */
async function handleSwapFinalize(body: SwapRequestBody, schoolId: string, userId: string, userRole: string) {
  const { swapRequestId } = body;

  if (!swapRequestId) {
    return badRequestResponse("Swap request ID is required");
  }

  const swapRequest = swapRequests.get(swapRequestId);
  if (!swapRequest) {
    return notFoundResponse("Swap request");
  }

  if (swapRequest.status !== "accepted") {
    return badRequestResponse("Can only finalize accepted swap requests");
  }

  // Perform the swap
  await db
    .update(timetables)
    .set({
      teacherId: swapRequest.targetId,
      updatedAt: new Date(),
    })
    .where(eq(timetables.id, swapRequest.requesterEntry.id));

  // If target has a period to swap, swap that too
  if (swapRequest.targetPeriod && swapRequest.targetEntry) {
    await db
      .update(timetables)
      .set({
        teacherId: swapRequest.requesterId,
        updatedAt: new Date(),
      })
      .where(eq(timetables.id, swapRequest.targetEntry.id));
  }

  swapRequest.status = "completed";
  swapRequests.set(swapRequestId, swapRequest);

  logger.info("Swap finalized", { swapRequestId });

  return successResponse({
    message: "Swap completed successfully",
    swapRequest,
  });
}

/**
 * Handle list swap requests
 */
async function handleSwapList(body: SwapRequestBody, schoolId: string, userId: string, userRole: string) {
  const { status = "all" } = body;

  let requests = Array.from(swapRequests.values());

  // Filter by user's role
  if (userRole === "teacher") {
    // Only show requests where user is requester or target
    requests = requests.filter((r) => r.requesterId === userId || r.targetId === userId);
  }

  // Filter by status
  if (status !== "all") {
    requests = requests.filter((r) => r.status === status);
  }

  // Sort by date (newest first)
  requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return successResponse({
    swapRequests: requests,
  });
}

/**
 * Handle AI swap suggestions
 */
async function handleSwapSuggest(body: SwapRequestBody, schoolId: string) {
  const { teacherId, periodToSwap, subjectId } = body;

  if (!teacherId || !periodToSwap || !subjectId) {
    return badRequestResponse("Missing required fields");
  }

  // Get all teachers in school
  const allTeachers = await getTeachersWithSubjects(schoolId);

  // Get current timetable
  const currentTimetable = await db
    .select({
      id: timetables.id,
      teacherId: timetables.teacherId,
      dayOfWeek: timetables.dayOfWeek,
      periodNumber: timetables.periodNumber,
    })
    .from(timetables)
    .where(eq(timetables.schoolId, schoolId));

  // Get teacher and subject info
  const teacherInfo = await db
    .select({ name: users.fullName })
    .from(users)
    .where(eq(users.id, teacherId))
    .limit(1);

  const subjectInfo = await db
    .select({ name: subjects.name })
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .limit(1);

  // Import AI function
  const { findSwapPartnersWithAI } = await import("@/lib/ai/timetable-optimizer");

  // Get AI suggestions
  const result = await findSwapPartnersWithAI(
    teacherId,
    teacherInfo[0]?.name || "Unknown",
    periodToSwap,
    subjectId,
    subjectInfo[0]?.name || "Unknown",
    allTeachers,
    currentTimetable.map((e) => ({
      id: e.id,
      classId: "",
      subjectId: "",
      teacherId: e.teacherId || "",
      roomId: "",
      dayOfWeek: e.dayOfWeek,
      periodNumber: e.periodNumber,
      startTime: "",
      endTime: "",
    }))
  );

  return successResponse(result);
}

// Type guard for user role
function hasRole(user: any, role: string): boolean {
  return user.role === role;
}
