/**
 * LEAVE MANAGEMENT API ROUTE
 *
 * Handles leave request CRUD operations for students and teachers
 *
 * Endpoints:
 * - GET: List leave requests (filtered by user role)
 * - POST: Create new leave request
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { leaveRequests, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { nanoid } from "nanoid";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
type LeaveType = "sick" | "vacation" | "emergency" | "family" | "other" | "casual" | "official";
type ApplicantType = "student" | "teacher" | "staff";

interface LeaveRequestResponse {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  applicantId: string;
  applicantType: ApplicantType;
  substituteTeacherId?: string | null;
  leaveHandoverNotes?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  documents?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  applicant?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  approver?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

interface LeaveBalanceInfo {
  total: number;
  used: number;
  remaining: number;
  byType: Record<string, { total: number; used: number; remaining: number }>;
}

const DEFAULT_LEAVE_BALANCE: Record<string, number> = {
  sick: 10,
  vacation: 15,
  emergency: 5,
  family: 7,
  other: 5,
  casual: 10,
  official: 30,
};

/**
 * GET /api/leave
 * List leave requests with optional filtering
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    // Get current user
    const currentUserList = await db
      .select({
        id: users.id,
        type: users.type,
        schoolId: users.schoolId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const currentUser = currentUserList[0] || null;

    if (!currentUser) {
      return errorResponse("User not found", 404);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    // Build query conditions
    const conditions: any[] = [];

    // Filter by user role
    const isAdmin = currentUser.role === "school-admin" || currentUser.role === "admin";
    if (isAdmin && currentUser.schoolId) {
      conditions.push(eq(leaveRequests.schoolId, currentUser.schoolId));
    } else if (!isAdmin) {
      conditions.push(eq(leaveRequests.applicantId, currentUser.id));
    }

    // Filter by status if provided
    if (status) {
      conditions.push(eq(leaveRequests.status, status));
    }

    // Filter by applicant type if provided
    if (type) {
      conditions.push(eq(leaveRequests.applicantType, type));
    }

    // Fetch leave requests
    const leaveDataRaw = await db
      .select()
      .from(leaveRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leaveRequests.createdAt));

    // Get related users via individual lookups
    const leaveData = await Promise.all(
      leaveDataRaw.map(async (lr) => {
        // Fetch applicant
        let applicant = null;
        if (lr.applicantId) {
          const applicantList = await db
            .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
            .from(users)
            .where(eq(users.id, lr.applicantId))
            .limit(1);
          applicant = applicantList[0] || null;
        }

        // Fetch approver
        let approver = null;
        if (lr.approvedBy) {
          const approverList = await db
            .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
            .from(users)
            .where(eq(users.id, lr.approvedBy))
            .limit(1);
          approver = approverList[0] || null;
        }

        // Fetch substitute teacher
        let substituteTeacher = null;
        if (lr.substituteTeacherId) {
          const subList = await db
            .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
            .from(users)
            .where(eq(users.id, lr.substituteTeacherId))
            .limit(1);
          substituteTeacher = subList[0] || null;
        }

        return {
          ...lr,
          applicant,
          approver,
          substituteTeacher,
        };
      })
    );

    // Filter by year (client-side for approved leaves)
    const filteredByYear = leaveData.filter((req) => {
      if (!year) return true;
      const reqYear = new Date(req.startDate as string).getFullYear();
      return reqYear === parseInt(year, 10);
    });

    // Calculate leave balance for non-admin users
    let leaveBalance: LeaveBalanceInfo | undefined;
    if (!isAdmin) {
      leaveBalance = await calculateLeaveBalance(userId, year);
    }

    logger.info("Leave requests fetched", {
      route: "/api/leave",
      method: "GET",
      userId,
      count: filteredByYear.length,
    });

    return successResponse({
      leaveRequests: filteredByYear,
      leaveBalance,
      currentUser: {
        id: currentUser.id,
        type: currentUser.type,
        role: currentUser.role,
        canApprove: isAdmin,
      },
    });
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

/**
 * POST /api/leave
 * Create a new leave request
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const currentUserList = await db
      .select({
        id: users.id,
        type: users.type,
        role: users.role,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const currentUser = currentUserList[0] || null;

    if (!currentUser) {
      return errorResponse("User not found", 404);
    }

    // Only students and teachers can create leave requests
    if (currentUser.type !== "student" && currentUser.type !== "teacher") {
      return errorResponse("Only students and teachers can create leave requests", 403);
    }

    const body = await request.json();
    const {
      type,
      reason,
      startDate,
      endDate,
      documents,
      substituteTeacherId,
      leaveHandoverNotes,
    } = body as {
      type?: string;
      reason?: string;
      startDate?: string;
      endDate?: string;
      documents?: string[];
      substituteTeacherId?: string;
      leaveHandoverNotes?: string;
    };

    // Validate required fields
    if (!type || !reason || !startDate || !endDate) {
      return badRequestResponse("Missing required fields: type, reason, startDate, endDate");
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return badRequestResponse("End date must be after start date");
    }

    // Calculate number of days
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance for non-emergency leaves
    if (type !== "emergency") {
      const currentBalance = await calculateLeaveBalance(userId, new Date().getFullYear().toString());
      const typeBalance = currentBalance.byType[type] || { remaining: 0 };
      if (typeBalance.remaining < numberOfDays) {
        return badRequestResponse(`Insufficient leave balance. You have ${typeBalance.remaining} ${type} days remaining.`);
      }
    }

    // Generate unique ID
    const leaveId = `leave_${nanoid()}`;

    // Create leave request
    const [leaveRequest] = await db.insert(leaveRequests).values({
      id: leaveId,
      schoolId: currentUser.schoolId || "",
      applicantId: currentUser.id,
      applicantType: currentUser.type,
      type,
      startDate,
      endDate,
      reason,
      status: "pending",
      substituteTeacherId: currentUser.type === "teacher" ? substituteTeacherId || null : null,
      leaveHandoverNotes: leaveHandoverNotes || null,
      documents: documents || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Leave request created", {
      route: "/api/leave",
      method: "POST",
      userId,
      leaveId,
      type,
      numberOfDays,
    });

    return successResponse({
      success: true,
      leaveRequest,
    }, 201);
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

/**
 * Helper function to calculate leave balance for a user
 */
async function calculateLeaveBalance(
  userId: string,
  year: string
): Promise<LeaveBalanceInfo> {
  // Get all approved leave requests for the user in the given year
  const approvedLeaves = await db
    .select()
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.applicantId, userId),
        eq(leaveRequests.status, "approved")
      )
    );

  // Filter by year and calculate days used
  const yearNumber = parseInt(year, 10);
  const usedByType: Record<string, number> = {};

  for (const leave of approvedLeaves) {
    const leaveYear = new Date(leave.startDate as string).getFullYear();
    if (leaveYear === yearNumber) {
      const start = new Date(leave.startDate as string);
      const end = new Date(leave.endDate as string);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      usedByType[leave.type as string] = (usedByType[leave.type as string] || 0) + days;
    }
  }

  // Calculate remaining for each type
  const byType: Record<string, { total: number; used: number; remaining: number }> = {};
  let totalUsed = 0;
  let totalRemaining = 0;

  for (const [type, defaultValue] of Object.entries(DEFAULT_LEAVE_BALANCE)) {
    const used = usedByType[type] || 0;
    const remaining = Math.max(0, defaultValue - used);
    byType[type] = {
      total: defaultValue,
      used,
      remaining,
    };
    totalUsed += used;
    totalRemaining += remaining;
  }

  return {
    total: Object.values(DEFAULT_LEAVE_BALANCE).reduce((a, b) => a + b, 0),
    used: totalUsed,
    remaining: totalRemaining,
    byType,
  };
}
