import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { supportTickets, users, schools, supportTicketResponses } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { eq, and, desc } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { NextResponse } from "next/server";

// ============================================================================
// GET - Get a single support ticket with responses
// ============================================================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: 401 } satisfies ApiErrorResponse,
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const { id: ticketId } = await params;

    // Get ticket details
    const ticketResult = await db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        subject: supportTickets.subject,
        description: supportTickets.description,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        resolution: supportTickets.resolution,
        satisfactionRating: supportTickets.satisfactionRating,
        satisfactionFeedback: supportTickets.satisfactionFeedback,
        responseCount: supportTickets.responseCount,
        attachments: supportTickets.attachments,
        assignedToId: supportTickets.assignedToId,
        assignedToName: supportTickets.assignedToName,
        resolutionTime: supportTickets.resolutionTime,
        resolvedAt: supportTickets.resolvedAt,
        closedAt: supportTickets.closedAt,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        // Creator info
        createdById: supportTickets.createdById,
        createdByRole: supportTickets.createdByRole,
        creatorName: users.name,
        creatorEmail: users.email,
        // School info
        schoolId: supportTickets.schoolId,
        schoolName: schools.name,
        schoolCode: schools.code,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.createdById, users.id))
      .leftJoin(schools, eq(supportTickets.schoolId, schools.id))
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!ticketResult.length) {
      return NextResponse.json(
        { error: "Ticket not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const ticket = ticketResult[0];

    // Get responses
    const responses = await db
      .select()
      .from(supportTicketResponses)
      .where(eq(supportTicketResponses.ticketId, ticketId))
      .orderBy(desc(supportTicketResponses.createdAt));

    logger.info("Support ticket fetched", { route: `/api/admin/support/${ticketId}`, userId, ticketId });

    const responseData = { ticket, responses };
    return NextResponse.json({
      data: responseData,
    } satisfies ApiSuccess<typeof responseData>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/support/[id]", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch support ticket", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a support ticket (status, assignment, etc.)
// ============================================================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: 401 } satisfies ApiErrorResponse,
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const { id: ticketId } = await params;
    const body = await req.json();
    const {
      status,
      priority,
      assignedToId,
      assignedToName,
      resolution,
      satisfactionRating,
      satisfactionFeedback,
    } = body;

    // Check if ticket exists
    const existingTicket = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!existingTicket.length) {
      return NextResponse.json(
        { error: "Ticket not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      const validStatuses = ["open", "in_progress", "waiting", "resolved", "closed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status", status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set resolved/closed timestamps
      if (status === "resolved" && !existingTicket[0].resolvedAt) {
        updateData.resolvedAt = new Date();
        // Calculate resolution time in minutes
        const createdTime = new Date(existingTicket[0].createdAt).getTime();
        const resolvedTime = new Date().getTime();
        updateData.resolutionTime = Math.floor((resolvedTime - createdTime) / (1000 * 60));
      }
      if (status === "closed" && !existingTicket[0].closedAt) {
        updateData.closedAt = new Date();
      }
    }

    if (priority !== undefined) {
      const validPriorities = ["critical", "high", "medium", "low"];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: "Invalid priority", status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
    }
    if (assignedToName !== undefined) {
      updateData.assignedToName = assignedToName;
    }
    if (resolution !== undefined) {
      updateData.resolution = resolution;
    }
    if (satisfactionRating !== undefined) {
      updateData.satisfactionRating = satisfactionRating;
    }
    if (satisfactionFeedback !== undefined) {
      updateData.satisfactionFeedback = satisfactionFeedback;
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .returning();

    logger.info("Support ticket updated", { route: `/api/admin/support/${ticketId}`, userId, ticketId, updateData });

    return NextResponse.json({
      data: updatedTicket,
    } satisfies ApiSuccess<typeof updatedTicket>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/support/[id]", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update support ticket", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Soft delete a support ticket
// ============================================================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: 401 } satisfies ApiErrorResponse,
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const { id: ticketId } = await params;

    // Soft delete by setting isActive to false
    await db
      .update(supportTickets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));

    logger.info("Support ticket deleted", { route: `/api/admin/support/${ticketId}`, userId, ticketId });

    return NextResponse.json({
      data: { message: "Ticket deleted successfully" },
    } satisfies ApiSuccess<{ message: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/support/[id]", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete support ticket", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
