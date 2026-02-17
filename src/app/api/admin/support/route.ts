import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { supportTickets, users, schools } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { eq, and, desc, sql, count, or } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

// ============================================================================
// GET - List all support tickets with filtering
// ============================================================================
export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: 401 } satisfies ApiErrorResponse,
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: Array<ReturnType<typeof sql> | ReturnType<typeof eq>> = [sql`${supportTickets.isActive} = true`];

    if (status) {
      conditions.push(eq(supportTickets.status, status));
    }
    if (priority) {
      conditions.push(eq(supportTickets.priority, priority));
    }
    if (category) {
      conditions.push(eq(supportTickets.category, category));
    }
    if (search) {
      conditions.push(
        or(
          sql`${supportTickets.subject} ILIKE ${"%" + search + "%"}`,
          sql`${supportTickets.description} ILIKE ${"%" + search + "%"}`
        )!
      );
    }

    // Get tickets with creator and school info
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
        assignedToId: supportTickets.assignedToId,
        assignedToName: supportTickets.assignedToName,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        createdById: supportTickets.createdById,
        createdByRole: supportTickets.createdByRole,
        // Creator info
        creatorName: users.name,
        creatorEmail: users.email,
        // School info
        schoolId: supportTickets.schoolId,
        schoolName: schools.name,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.createdById, users.id))
      .leftJoin(schools, eq(supportTickets.schoolId, schools.id))
      .where(and(...conditions))
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(supportTickets)
      .where(and(...conditions));

    const totalCount = totalCountResult[0]?.count || 0;

    // Get stats
    const statsResult = await db
      .select({
        status: supportTickets.status,
        priority: supportTickets.priority,
        count: count(),
      })
      .from(supportTickets)
      .where(sql`${supportTickets.isActive} = true`)
      .groupBy(supportTickets.status, supportTickets.priority);

    const stats = {
      total: totalCount,
      open: statsResult.filter((s) => s.status === "open").reduce((sum, s) => sum + Number(s.count), 0),
      inProgress: statsResult.filter((s) => s.status === "in_progress").reduce((sum, s) => sum + Number(s.count), 0),
      waiting: statsResult.filter((s) => s.status === "waiting").reduce((sum, s) => sum + Number(s.count), 0),
      resolved: statsResult.filter((s) => s.status === "resolved").reduce((sum, s) => sum + Number(s.count), 0),
      closed: statsResult.filter((s) => s.status === "closed").reduce((sum, s) => sum + Number(s.count), 0),
      critical: statsResult.filter((s) => s.priority === "critical").reduce((sum, s) => sum + Number(s.count), 0),
      high: statsResult.filter((s) => s.priority === "high").reduce((sum, s) => sum + Number(s.count), 0),
    };

    // Get category counts
    const categoryResult = await db
      .select({
        category: supportTickets.category,
        count: count(),
      })
      .from(supportTickets)
      .where(sql`${supportTickets.isActive} = true`)
      .groupBy(supportTickets.category);

    const categories = categoryResult.map((c) => ({
      id: c.category,
      name: c.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count: Number(c.count),
    }));

    logger.info("Support tickets fetched", { route: "/api/admin/support", userId, count: tickets.length });

    const responseData = {
      tickets,
      stats,
      categories,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
    return NextResponse.json({
      data: responseData,
    } satisfies ApiSuccess<typeof responseData>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/support", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch support tickets", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new support ticket
// ============================================================================
export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: 401 } satisfies ApiErrorResponse,
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const body = await req.json();
    const {
      subject,
      description,
      category,
      priority = "medium",
      schoolId,
      createdById,
      createdByRole,
      attachments,
      tags,
    } = body;

    // Validate required fields
    if (!subject || !description || !category || !createdById || !createdByRole) {
      return NextResponse.json(
        { error: "Missing required fields", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["bug", "feature_request", "question", "billing", "technical", "account"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["critical", "high", "medium", "low"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

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
        subject,
        description,
        category,
        priority,
        status: "open",
        schoolId,
        createdById,
        createdByRole,
        attachments: attachments || [],
        tags: tags || [],
        source: "portal",
        responseCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Support ticket created", { route: "/api/admin/support", userId, ticketId });

    return NextResponse.json({
      data: newTicket,
    } satisfies ApiSuccess<typeof newTicket>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/support", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create support ticket", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
