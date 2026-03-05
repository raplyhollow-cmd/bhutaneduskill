/**
 * SALES LEADS API
 * POST /api/admin/sales/leads - Create new lead
 * GET /api/admin/sales/leads - List all leads
 * PATCH /api/admin/sales/leads/[id] - Update lead
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { salesLeads, salesActivities } from "@/lib/db/schema/sales-schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    let leads;
    if (status && status !== "all") {
      leads = await db
        .select()
        .from(salesLeads)
        .where(eq(salesLeads.status, status as any))
        .orderBy(desc(salesLeads.createdAt))
        .limit(limit);
    } else {
      leads = await db
        .select()
        .from(salesLeads)
        .orderBy(desc(salesLeads.createdAt))
        .limit(limit);
    }

    return { leads };
  },
  ["admin"]
);

export const POST = createApiRoute(
  async (req: NextRequest) => {
    const body = await req.json();

    const lead = await db.insert(salesLeads).values({
      id: nanoid(),
      schoolName: body.schoolName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      role: body.role,
      district: body.district,
      schoolType: body.schoolType,
      studentCount: body.studentCount,
      source: body.source || "website",
      tier: body.tier || "undetermined",
      estimatedBudget: body.estimatedBudget,
      createdBy: body.createdBy,
    }).returning();

    return { lead: lead[0] };
  },
  ["admin"]
);
