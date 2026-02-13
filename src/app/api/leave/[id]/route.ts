/**
 * LEAVE REQUEST [id] API ROUTE
 *
 * Handles individual leave request operations (approve, reject, cancel)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leaveRequests, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user can approve/reject
    const canApprove = currentUser.role === "school_admin" || currentUser.role === "admin";

    // Await params and get the leave request ID
    const { id } = await params;

    // Get the leave request
    const leaveRequest = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
      with: {
        applicant: {
          columns: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Check ownership for cancellation
    const isOwner = leaveRequest.applicantId === currentUser.id;

    const body = await request.json();
    const { action, rejectionReason, substituteTeacherId, leaveHandoverNotes } = body;

    // Handle different actions
    switch (action) {
      case "approve":
        if (!canApprove) {
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

        return NextResponse.json({
          success: true,
          message: "Leave request approved",
        });

      case "reject":
        if (!canApprove) {
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

        return NextResponse.json({
          success: true,
          message: "Leave request rejected",
        });

      case "cancel":
        if (!isOwner && !canApprove) {
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

        return NextResponse.json({
          success: true,
          message: "Leave request cancelled",
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: approve, reject, or cancel" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Await params and get the leave request ID
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
    const isAdmin = currentUser.role === "school_admin" || currentUser.role === "admin";

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

    return NextResponse.json({
      success: true,
      message: "Leave request deleted",
    });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    return NextResponse.json(
      { error: "Failed to delete leave request" },
      { status: 500 }
    );
  }
}
