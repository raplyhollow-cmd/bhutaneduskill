/**
 * Partner Commissions API
 *
 * GET /api/admin/partners/[partnerId]/commissions - Get partner commissions
 * POST /api/admin/partners/[partnerId]/commissions - Create commission record
 * PATCH /api/admin/partners/[partnerId]/commissions/[id] - Update commission
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners, partnerCommissions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

type CommissionStatus = "pending" | "paid" | "overdue";

interface CommissionRecord {
  id: string;
  partnerId: string;
  period: string;
  amount: number;
  status: CommissionStatus;
  description: string;
  paidDate: string | null;
  dueDate: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCommissionInput {
  period: string;
  amount: number;
  description?: string;
  status?: CommissionStatus;
  paidDate?: string;
  dueDate?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validatePeriod(period: string): boolean {
  // Period should be in format YYYY-MM
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return periodRegex.test(period);
}

function validateCommissionInput(data: CreateCommissionInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.period) {
    errors.push("Period is required");
  } else if (!validatePeriod(data.period)) {
    errors.push("Period must be in format YYYY-MM (e.g., 2025-12)");
  }

  if (data.amount === undefined || data.amount === null) {
    errors.push("Amount is required");
  } else if (typeof data.amount !== "number" || data.amount < 0) {
    errors.push("Amount must be a non-negative number");
  }

  if (data.status && !["pending", "paid", "overdue"].includes(data.status)) {
    errors.push("Status must be one of: pending, paid, overdue");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// GET - Get Partner Commissions
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId } = await params;
    const { searchParams } = new URL(request.url);

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    // Verify partner exists
    const partner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Get status filter
    const statusFilter = searchParams.get("status");

    // Build where conditions
    const conditions = [eq(partnerCommissions.partnerId, partnerId)];
    if (statusFilter) {
      conditions.push(eq(partnerCommissions.status, statusFilter as CommissionStatus));
    }

    // Fetch commissions from database
    const commissionsData = await db
      .select()
      .from(partnerCommissions)
      .where(and(...conditions))
      .orderBy(desc(partnerCommissions.period));

    // Calculate totals
    const totalAmount = commissionsData.reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = commissionsData
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);
    const pendingAmount = commissionsData
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0);
    const overdueAmount = commissionsData
      .filter((c) => c.status === "overdue")
      .reduce((sum, c) => sum + c.amount, 0);

    logger.info("Partner commissions fetched", {
      userId: authResult.userId,
      partnerId,
      count: commissionsData.length,
    });

    return NextResponse.json({
      success: true,
      data: commissionsData,
      meta: {
        total: commissionsData.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]/commissions", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch commissions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Commission Record
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId } = await params;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    // Verify partner exists
    const partner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateCommissionInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Generate commission ID
    const commissionId = `comm-${nanoid(10)}`;
    const now = new Date();

    // Insert commission into database
    const [newCommission] = await db
      .insert(partnerCommissions)
      .values({
        id: commissionId,
        partnerId,
        period: body.period,
        amount: body.amount,
        status: (body.status || "pending") as CommissionStatus,
        description: body.description || "Commission payment",
        paidDate: body.paidDate || null,
        dueDate: body.dueDate || null,
        metadata: body.metadata || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info("Commission created", {
      userId: authResult.userId,
      partnerId,
      commissionId,
      amount: body.amount,
      period: body.period,
    });

    return NextResponse.json(
      {
        success: true,
        data: newCommission,
        message: "Commission record created",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]/commissions", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create commission", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
