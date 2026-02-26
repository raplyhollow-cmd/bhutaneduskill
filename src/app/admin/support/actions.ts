"use server";

import { logger } from "@/lib/logger";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { supportTickets, supportTicketResponses, supportAgents, users, schools } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// Types
// ============================================================================

export type SupportTicketData = {
  subject: string;
  description: string;
  category: "bug" | "feature_request" | "question" | "billing" | "technical" | "account";
  priority: "critical" | "high" | "medium" | "low";
  schoolId?: string;
  createdById: string;
  createdByRole: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  tags?: string[];
};

export type TicketUpdateData = {
  status?: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority?: "critical" | "high" | "medium" | "low";
  assignedToId?: string;
  assignedToName?: string;
  resolution?: string;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
};

export type TicketResponseData = {
  message: string;
  isInternal?: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
};

export type SupportAgentData = {
  agentUserId: string;
  name: string;
  role?: "agent" | "lead" | "manager";
  team?: string;
  specialties?: string[];
  maxConcurrentTickets?: number;
};

// ============================================================================
// Ticket CRUD Operations
// ============================================================================

/**
 * Create a new support ticket
 */
export async function createSupportTicket(data: SupportTicketData) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    // Generate ticket number
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const ticketNumber = `TKT-${year}-${randomNum}`;

    const ticketId = `ticket-${nanoid()}`;

    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        id: ticketId,
        ticketNumber,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority || "medium",
        status: "open",
        schoolId: data.schoolId,
        createdById: data.createdById,
        createdByRole: data.createdByRole,
        attachments: data.attachments || [],
        tags: data.tags || [],
        source: "portal",
        responseCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/admin/support");
    return { success: true, data: newTicket };
  } catch (error) {
    logger.error("Error creating support ticket:", error);
    return { error: "Failed to create support ticket" };
  }
}

/**
 * Get all support tickets with optional filtering
 */
export async function getSupportTickets(filters?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const conditions: unknown[] = [sql`${supportTickets.isActive} = true`];

    if (filters?.status) {
      conditions.push(sql`${supportTickets.status} = ${filters.status}`);
    }
    if (filters?.priority) {
      conditions.push(sql`${supportTickets.priority} = ${filters.priority}`);
    }
    if (filters?.category) {
      conditions.push(sql`${supportTickets.category} = ${filters.category}`);
    }
    if (filters?.search) {
      conditions.push(
        sql`(${supportTickets.subject} ILIKE ${"%" + filters.search + "%"} OR ${supportTickets.description} ILIKE ${
          "%" + filters.search + "%"
        })`
      );
    }

    // Get tickets with related info
    const tickets = await db
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
        responseCount: supportTickets.responseCount,
        attachments: supportTickets.attachments,
        tags: supportTickets.tags,
        assignedToId: supportTickets.assignedToId,
        assignedToName: supportTickets.assignedToName,
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
      .where(and(...conditions))
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true, data: tickets };
  } catch (error) {
    logger.error("Error fetching support tickets:", error);
    return { error: "Failed to fetch support tickets" };
  }
}

/**
 * Get a single support ticket by ID
 */
export async function getSupportTicketById(ticketId: string) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    // Get ticket with related info
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
        tags: supportTickets.tags,
        source: supportTickets.source,
        assignedToId: supportTickets.assignedToId,
        assignedToName: supportTickets.assignedToName,
        resolutionTime: supportTickets.resolutionTime,
        resolvedAt: supportTickets.resolvedAt,
        closedAt: supportTickets.closedAt,
        lastResponseAt: supportTickets.lastResponseAt,
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
      return { error: "Ticket not found" };
    }

    const ticket = ticketResult[0];

    // Get responses
    const responses = await db
      .select()
      .from(supportTicketResponses)
      .where(eq(supportTicketResponses.ticketId, ticketId))
      .orderBy(desc(supportTicketResponses.createdAt));

    return { success: true, data: { ticket, responses } };
  } catch (error) {
    logger.error("Error fetching support ticket:", error);
    return { error: "Failed to fetch support ticket" };
  }
}

/**
 * Update a support ticket
 */
export async function updateSupportTicket(ticketId: string, data: TicketUpdateData) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    // Get existing ticket
    const existingTicketResult = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!existingTicketResult.length) {
      return { error: "Ticket not found" };
    }

    const existingTicket = existingTicketResult[0];

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) {
      updateData.status = data.status;

      // Set resolved/closed timestamps
      if (data.status === "resolved" && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date();
        const createdTime = new Date(existingTicket.createdAt).getTime();
        const resolvedTime = new Date().getTime();
        updateData.resolutionTime = Math.floor((resolvedTime - createdTime) / (1000 * 60));
      }
      if (data.status === "closed" && !existingTicket.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.assignedToId !== undefined) {
      updateData.assignedToId = data.assignedToId;
    }
    if (data.assignedToName !== undefined) {
      updateData.assignedToName = data.assignedToName;
    }
    if (data.resolution !== undefined) {
      updateData.resolution = data.resolution;
    }
    if (data.satisfactionRating !== undefined) {
      updateData.satisfactionRating = data.satisfactionRating;
    }
    if (data.satisfactionFeedback !== undefined) {
      updateData.satisfactionFeedback = data.satisfactionFeedback;
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .returning();

    revalidatePath("/admin/support");
    revalidatePath(`/admin/support/${ticketId}`);
    return { success: true, data: updatedTicket };
  } catch (error) {
    logger.error("Error updating support ticket:", error);
    return { error: "Failed to update support ticket" };
  }
}

/**
 * Delete (soft delete) a support ticket
 */
export async function deleteSupportTicket(ticketId: string) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    await db
      .update(supportTickets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));

    revalidatePath("/admin/support");
    return { success: true, data: { message: "Ticket deleted successfully" } };
  } catch (error) {
    logger.error("Error deleting support ticket:", error);
    return { error: "Failed to delete support ticket" };
  }
}

// ============================================================================
// Ticket Response Operations
// ============================================================================

/**
 * Add a response to a ticket
 */
export async function addTicketResponse(ticketId: string, data: TicketResponseData) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId, user } = authResult;

  try {
    // Verify ticket exists
    const ticketResult = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.isActive, true)))
      .limit(1);

    if (!ticketResult.length) {
      return { error: "Ticket not found" };
    }

    const ticket = ticketResult[0];

    // Determine user role
    let userRole = "agent";
    if (user.type === "admin") {
      userRole = "admin";
    }

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
        message: data.message.trim(),
        isInternal: data.isInternal || false,
        attachments: data.attachments || [],
        createdAt: new Date(),
      })
      .returning();

    // Update ticket
    await db
      .update(supportTickets)
      .set({
        responseCount: (ticket.responseCount || 0) + 1,
        lastResponseAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));

    revalidatePath("/admin/support");
    revalidatePath(`/admin/support/${ticketId}`);
    return { success: true, data: newResponse };
  } catch (error) {
    logger.error("Error adding ticket response:", error);
    return { error: "Failed to add response" };
  }
}

/**
 * Get all responses for a ticket
 */
export async function getTicketResponses(ticketId: string) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    const responses = await db
      .select()
      .from(supportTicketResponses)
      .where(eq(supportTicketResponses.ticketId, ticketId))
      .orderBy(desc(supportTicketResponses.createdAt));

    return { success: true, data: responses };
  } catch (error) {
    logger.error("Error fetching ticket responses:", error);
    return { error: "Failed to fetch responses" };
  }
}

// ============================================================================
// Support Agent Operations
// ============================================================================

/**
 * Get all support agents
 */
export async function getSupportAgents() {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    const agents = await db
      .select()
      .from(supportAgents)
      .where(eq(supportAgents.isActive, true))
      .orderBy(desc(supportAgents.totalTicketsResolved));

    return { success: true, data: agents };
  } catch (error) {
    logger.error("Error fetching support agents:", error);
    return { error: "Failed to fetch support agents" };
  }
}

/**
 * Create a new support agent
 */
export async function createSupportAgent(data: SupportAgentData) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    const agentId = `agent-${nanoid()}`;

    const [newAgent] = await db
      .insert(supportAgents)
      .values({
        id: agentId,
        userId: data.agentUserId,
        name: data.name,
        role: data.role || "agent",
        team: data.team || "Support",
        specialties: data.specialties || [],
        isActive: true,
        maxConcurrentTickets: data.maxConcurrentTickets || 10,
        currentTicketCount: 0,
        totalTicketsResolved: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/admin/support");
    return { success: true, data: newAgent };
  } catch (error) {
    logger.error("Error creating support agent:", error);
    return { error: "Failed to create support agent" };
  }
}

/**
 * Update a support agent
 */
export async function updateSupportAgent(agentId: string, data: Partial<SupportAgentData>) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.team !== undefined) {
      updateData.team = data.team;
    }
    if (data.specialties !== undefined) {
      updateData.specialties = data.specialties;
    }
    if (data.maxConcurrentTickets !== undefined) {
      updateData.maxConcurrentTickets = data.maxConcurrentTickets;
    }

    const [updatedAgent] = await db
      .update(supportAgents)
      .set(updateData)
      .where(eq(supportAgents.id, agentId))
      .returning();

    revalidatePath("/admin/support");
    return { success: true, data: updatedAgent };
  } catch (error) {
    logger.error("Error updating support agent:", error);
    return { error: "Failed to update support agent" };
  }
}

/**
 * Delete a support agent
 */
export async function deleteSupportAgent(agentId: string) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    await db
      .update(supportAgents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(supportAgents.id, agentId));

    revalidatePath("/admin/support");
    return { success: true, data: { message: "Agent deleted successfully" } };
  } catch (error) {
    logger.error("Error deleting support agent:", error);
    return { error: "Failed to delete support agent" };
  }
}

// ============================================================================
// Stats & Summary Operations
// ============================================================================

/**
 * Get support ticket statistics
 */
export async function getSupportStats() {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  const { userId } = authResult;

  try {
    const tickets = await db
      .select({
        status: supportTickets.status,
        priority: supportTickets.priority,
        category: supportTickets.category,
      })
      .from(supportTickets)
      .where(eq(supportTickets.isActive, true));

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      waiting: tickets.filter((t) => t.status === "waiting").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
      critical: tickets.filter((t) => t.priority === "critical").length,
      high: tickets.filter((t) => t.priority === "high").length,
    };

    // Category breakdown
    const categoryMap = new Map<string, number>();
    tickets.forEach((t) => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
    });

    const categories = Array.from(categoryMap.entries()).map(([id, count]) => ({
      id,
      name: id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));

    return { success: true, data: { stats, categories } };
  } catch (error) {
    logger.error("Error fetching support stats:", error);
    return { error: "Failed to fetch support stats" };
  }
}
