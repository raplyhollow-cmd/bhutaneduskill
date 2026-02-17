/**
 * LEAVE REQUEST [id] API ROUTE
 *
 * Handles individual leave request operations (approve, reject, cancel)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
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
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "school_admin" || currentUser.role === "admin";

    // Get the leave request ID
    const { id } = await params;

    // Get the leave request
    const leaveRequest = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const isOwner = leaveRequest.applicantId === currentUser.id;

    const body = await request.json() as PatchRequestBody;
    const { action, rejectionReason, substituteTeacherId, leaveHandoverNotes } = body;

    // Handle different actions
    switch (action) {
      case "approve": {
        if (!isAdmin) {
          return NextResponse.json(
            { error: "You don't have permission to approve leave requests" },
            { status: 403 }
          );
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

        return NextResponse.json({
          success: true,
          message: "Leave request approved",
        });
      }

      case "reject": {
        if (!isAdmin) {
          return NextResponse.json(
            { error: "You don't have permission to reject leave requests" },
            { status: 403 }
          );
        }

        if (!rejectionReason) {
          return NextResponse.json(
            { error: "Rejection reason is required" },
            { status: 400 }
          );
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

        return NextResponse.json({
          success: true,
          message: "Leave request rejected",
        });
      }

      case "cancel": {
        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            { error: "You don't have permission to cancel this leave request" },
            { status: 403 }
          );
        }

        // Only pending requests can be cancelled
        if (leaveRequest.status !== "pending") {
          return NextResponse.json(
            { error: "Can only cancel pending leave requests" },
            { status: 400 }
          );
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

        return NextResponse.json({
          success: true,
          message: "Leave request cancelled",
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: approve, reject, or cancel" },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.apiError(error, { route: "/api/leave/[id]", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leave/[id]
 * Delete a leave request (only pending or rejected)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "school_admin" || currentUser.role === "admin";

    // Get the leave request ID
    const { id } = await params;

    // Get the leave request
    const leaveRequest = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Check ownership or admin
    const isOwner = leaveRequest.applicantId === currentUser.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this leave request" },
        { status: 403 }
      );
    }

    // Only allow deletion of pending or rejected requests
    if (leaveRequest.status === "approved") {
      return NextResponse.json(
        { error: "Cannot delete approved leave requests. Use cancel action instead." },
        { status: 400 }
      );
    }

    await db.delete(leaveRequests)
      .where(eq(leaveRequests.id, id));

    logger.info("Leave request deleted", {
      route: "/api/leave/[id]",
      method: "DELETE",
      userId,
      leaveId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Leave request deleted",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/leave/[id]", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete leave request" },
      { status: 500 }
    );
  }
}
