import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { supportTickets, supportTicketResponses, users } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { eq, and, desc } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

// ============================================================================
// GET - Get all responses for a ticket
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

    // Verify ticket exists
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!ticket.length) {
      return NextResponse.json(
        { error: "Ticket not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
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

    return NextResponse.json({
      data: responses,
    } satisfies ApiSuccess<typeof responses>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/support/[id]/responses", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch responses", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Add a response to a ticket
// ============================================================================
export async function POST(
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

    const { userId, user } = authResult;
    const { id: ticketId } = await params;

    const body = await req.json();
    const { message, isInternal = false, attachments = [] } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Verify ticket exists
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!ticket.length) {
      return NextResponse.json(
        { error: "Ticket not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Determine user role for response
    let userRole = "agent";
    if (user.type === "admin") {
      userRole = "admin";
    }

    // Create response
    const responseId: string = `response-${nanoid()}`;
    const userName: string = (user.name as string) || "Support Agent";

    const [newResponse] = await db
      .insert(supportTicketResponses)
      .values({
        id: responseId as string,
        ticketId: ticketId as string,
        userId: userId as string,
        userRole: userRole as string,
        userName: userName as string,
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

    return NextResponse.json({
      data: newResponse,
    } satisfies ApiSuccess<typeof newResponse>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/support/[id]/responses", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create response", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
