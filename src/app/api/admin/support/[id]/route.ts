import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { supportTickets, users, schools, supportTicketResponses } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { eq, and, desc } from "drizzle-orm";

// ============================================================================
// GET - Get a single support ticket with responses
// ============================================================================
export const GET = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { id: ticketId } = await (context?.params || Promise.resolve({ id: "" }));

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
      return { error: "Ticket not found", status: 404 };
    }

    const ticket = ticketResult[0];

    // Get responses
    const responses = await db
      .select()
      .from(supportTicketResponses)
      .where(eq(supportTicketResponses.ticketId, ticketId))
      .orderBy(desc(supportTicketResponses.createdAt));

    logger.info("Support ticket fetched", { route: `/api/admin/support/${ticketId}`, userId, ticketId });

    return { data: { ticket, responses } };
  },
  ["admin"]
);

// ============================================================================
// PATCH - Update a support ticket (status, assignment, etc.)
// ============================================================================
export const PATCH = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { id: ticketId } = await (context?.params || Promise.resolve({ id: "" }));
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
      return { error: "Ticket not found", status: 404 };
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      const validStatuses = ["open", "in_progress", "waiting", "resolved", "closed"];
      if (!validStatuses.includes(status)) {
        return { error: "Invalid status", status: 400 };
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
        return { error: "Invalid priority", status: 400 };
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

    return { data: updatedTicket };
  },
  ["admin"]
);

// ============================================================================
// DELETE - Soft delete a support ticket
// ============================================================================
export const DELETE = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { id: ticketId } = await (context?.params || Promise.resolve({ id: "" }));

    // Soft delete by setting isActive to false
    await db
      .update(supportTickets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));

    logger.info("Support ticket deleted", { route: `/api/admin/support/${ticketId}`, userId, ticketId });

    return { data: { message: "Ticket deleted successfully" } };
  },
  ["admin"]
);
