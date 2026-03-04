import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { supportAgents, users } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// GET - List all support agents
// ============================================================================
export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    // Get all agents with their current ticket load
    const agents = await db
      .select({
        id: supportAgents.id,
        userId: supportAgents.userId,
        name: supportAgents.name,
        role: supportAgents.role,
        team: supportAgents.team,
        specialties: supportAgents.specialties,
        isActive: supportAgents.isActive,
        maxConcurrentTickets: supportAgents.maxConcurrentTickets,
        currentTicketCount: supportAgents.currentTicketCount,
        averageResponseTime: supportAgents.averageResponseTime,
        totalTicketsResolved: supportAgents.totalTicketsResolved,
        satisfactionScore: supportAgents.satisfactionScore,
        createdAt: supportAgents.createdAt,
        updatedAt: supportAgents.updatedAt,
      })
      .from(supportAgents)
      .where(eq(supportAgents.isActive, true))
      .orderBy(desc(supportAgents.totalTicketsResolved));

    logger.info("Support agents fetched", { route: "/api/admin/support/agents", userId, count: agents.length });

    return { data: agents };
  },
  ["admin"]
);

// ============================================================================
// POST - Create a new support agent
// ============================================================================
export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { agentUserId, name, role = "agent", team = "Support", specialties, maxConcurrentTickets = 10 } = body;

    // Validate required fields
    if (!agentUserId || !name || !team) {
      return { error: "Missing required fields", status: 400 };
    }

    // Validate role
    const validRoles = ["agent", "lead", "manager"];
    if (!validRoles.includes(role)) {
      return { error: "Invalid role", status: 400 };
    }

    // Check if user exists
    const userExists = await db.select().from(users).where(eq(users.id, agentUserId)).limit(1);
    if (!userExists.length) {
      return { error: "User not found", status: 404 };
    }

    // Check if agent already exists
    const existingAgent = await db.select().from(supportAgents).where(eq(supportAgents.userId, agentUserId)).limit(1);
    if (existingAgent.length) {
      return { error: "Agent already exists for this user", status: 400 };
    }

    const agentId = `agent-${nanoid()}`;

    const [newAgent] = await db
      .insert(supportAgents)
      .values({
        id: agentId,
        userId: agentUserId,
        name,
        role,
        team,
        specialties: specialties || [],
        isActive: true,
        maxConcurrentTickets,
        currentTicketCount: 0,
        totalTicketsResolved: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Support agent created", { route: "/api/admin/support/agents", userId, agentId });

    return { data: newAgent };
  },
  ["admin"]
);
