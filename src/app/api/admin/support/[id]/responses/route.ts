import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { supportTickets, supportTicketResponses, users } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// GET - Get all responses for a ticket
// ============================================================================
export const GET = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { id: ticketId } = await (context?.params || Promise.resolve({ id: "" }));

    // Verify ticket exists
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!ticket.length) {
      return { error: "Ticket not found", status: 404 };
    }

    // Get responses
    const responses = await db
      .select({
        id: supportTicketResponses.id,
        ticketId: supportTicketResponses.ticketId,
        userId: supportTicketResponses.userId,
        userRole: supportTicketResponses.userRole,
        userName: supportTicketResponses.userName,
        message: supportTicketResponses.message,
        isInternal: supportTicketResponses.isInternal,
        attachments: supportTicketResponses.attachments,
        createdAt: supportTicketResponses.createdAt,
        responderEmail: users.email,
      })
      .from(supportTicketResponses)
      .leftJoin(users, eq(supportTicketResponses.userId, users.id))
      .where(eq(supportTicketResponses.ticketId, ticketId))
      .orderBy(desc(supportTicketResponses.createdAt));

    logger.info("Support ticket responses fetched", {
      route: `/api/admin/support/${ticketId}/responses`,
      userId,
      ticketId,
      count: responses.length,
    });

    return { data: responses };
  },
  ["admin"]
);

// ============================================================================
// POST - Add a response to a ticket
// ============================================================================
export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId, user } = auth;
    const { id: ticketId } = await (context?.params || Promise.resolve({ id: "" }));

    const body = await req.json();
    const { message, isInternal = false, attachments = [] } = body;

    if (!message || message.trim() === "") {
      return { error: "Message is required", status: 400 };
    }

    // Verify ticket exists
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!ticket.length) {
      return { error: "Ticket not found", status: 404 };
    }

    // Determine user role for response
    let userRole = "agent";
    if (user.type === "admin") {
      userRole = "admin";
    }

    // Create response
    const responseId = `response-${nanoid()}`;
    const userName = ((user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : undefined) || "Support Agent";

    const [newResponse] = await db
      .insert(supportTicketResponses)
      .values({
        id: responseId,
        ticketId: ticketId,
        userId: userId,
        userRole: userRole,
        userName: userName,
        message: message.trim(),
        isInternal,
        attachments,
        createdAt: new Date(),
      })
      .returning();

    // Update ticket's response count and last response time
    await db
      .update(supportTickets)
      .set({
        responseCount: (ticket[0].responseCount || 0) + 1,
        lastResponseAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));

    logger.info("Support ticket response created", {
      route: `/api/admin/support/${ticketId}/responses`,
      userId,
      ticketId,
      responseId,
    });

    return { data: newResponse };
  },
  ["admin"]
);
