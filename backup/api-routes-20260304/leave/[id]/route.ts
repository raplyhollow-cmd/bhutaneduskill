/**
 * LEAVE REQUEST [id] API ROUTE
 *
 * Handles individual leave request operations (approve, reject, cancel)
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { leaveRequests, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type LeaveAction = "approve" | "reject" | "cancel";
type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

interface PatchRequestBody {
  action: LeaveAction;
  rejectionReason?: string;
  substituteTeacherId?: string;
  leaveHandoverNotes?: string;
}

/**
 * PATCH /api/leave/[id]
 * Update a leave request (approve, reject, cancel)
 */
export const PATCH = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { userId } = auth;

    const currentUser = await db
      .select({
        id: users.id,
        type: users.type,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(r => r[0]);

    if (!currentUser) {
      return { error: "User not found", status: 404 };
    }

    const isAdmin = currentUser.role === "school-admin" || currentUser.role === "admin";

    // Get the leave request ID
    const { id } = await context!.params!;

    // Get the leave request
    const [leaveRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!leaveRequest) {
      return { error: "Leave request not found", status: 404 };
    }

    const isOwner = leaveRequest.applicantId === currentUser.id;

    const body = await request.json() as PatchRequestBody;
    const { action, rejectionReason, substituteTeacherId, leaveHandoverNotes } = body;

    // Handle different actions
    switch (action) {
      case "approve": {
        if (!isAdmin) {
          return { error: "You don't have permission to approve leave requests", status: 403 };
        }

        await db.update(leaveRequests)
          .set({
            status: "approved",
            approvedBy: currentUser.id,
            approvedAt: new Date(),
            substituteTeacherId: substituteTeacherId || leaveRequest.substituteTeacherId,
            leaveHandoverNotes: leaveHandoverNotes || leaveRequest.leaveHandoverNotes,
            updatedAt: new Date(),
          })
          .where(eq(leaveRequests.id, id));

        logger.info("Leave request approved", {
          route: "/api/leave/[id]",
          method: "PATCH",
          userId,
          leaveId: id,
          applicantId: leaveRequest.applicantId,
        });

        return {
          success: true,
          message: "Leave request approved",
        };
      }

      case "reject": {
        if (!isAdmin) {
          return { error: "You don't have permission to reject leave requests", status: 403 };
        }

        if (!rejectionReason) {
          return { error: "Rejection reason is required", status: 400 };
        }

        await db.update(leaveRequests)
          .set({
            status: "rejected",
            approvedBy: currentUser.id,
            approvedAt: new Date(),
            rejectionReason,
            updatedAt: new Date(),
          })
          .where(eq(leaveRequests.id, id));

        logger.info("Leave request rejected", {
          route: "/api/leave/[id]",
          method: "PATCH",
          userId,
          leaveId: id,
          applicantId: leaveRequest.applicantId,
          reason: rejectionReason,
        });

        return {
          success: true,
          message: "Leave request rejected",
        };
      }

      case "cancel": {
        if (!isOwner && !isAdmin) {
          return { error: "You don't have permission to cancel this leave request", status: 403 };
        }

        // Only pending requests can be cancelled
        if (leaveRequest.status !== "pending") {
          return { error: "Can only cancel pending leave requests", status: 400 };
        }

        await db.update(leaveRequests)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(leaveRequests.id, id));

        logger.info("Leave request cancelled", {
          route: "/api/leave/[id]",
          method: "PATCH",
          userId,
          leaveId: id,
        });

        return {
          success: true,
          message: "Leave request cancelled",
        };
      }

      default:
        return { error: "Invalid action. Use: approve, reject, or cancel", status: 400 };
    }
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

/**
 * DELETE /api/leave/[id]
 * Delete a leave request (only pending or rejected)
 */
export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { userId } = auth;

    const currentUser = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(r => r[0]);

    if (!currentUser) {
      return { error: "User not found", status: 404 };
    }

    const isAdmin = currentUser.role === "school-admin" || currentUser.role === "admin";

    // Get the leave request ID
    const { id } = await context!.params!;

    // Get the leave request
    const [leaveRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!leaveRequest) {
      return { error: "Leave request not found", status: 404 };
    }

    // Check ownership or admin
    const isOwner = leaveRequest.applicantId === currentUser.id;

    if (!isOwner && !isAdmin) {
      return { error: "You don't have permission to delete this leave request", status: 403 };
    }

    // Only allow deletion of pending or rejected requests
    if (leaveRequest.status === "approved") {
      return { error: "Cannot delete approved leave requests. Use cancel action instead.", status: 400 };
    }

    await db.delete(leaveRequests)
      .where(eq(leaveRequests.id, id));

    logger.info("Leave request deleted", {
      route: "/api/leave/[id]",
      method: "DELETE",
      userId,
      leaveId: id,
    });

    return {
      success: true,
      message: "Leave request deleted",
    };
  },
  ['student', 'teacher', 'admin', 'school-admin']
);
