/**
 * Single Commission Management API
 *
 * PATCH /api/admin/partners/[partnerId]/commissions/[commissionId] - Update commission
 * DELETE /api/admin/partners/[partnerId]/commissions/[commissionId] - Delete commission
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners, partnerCommissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

type CommissionStatus = "pending" | "paid" | "overdue";

interface UpdateCommissionInput {
  period?: string;
  amount?: number;
  description?: string;
  status?: CommissionStatus;
  paidDate?: string | null;
  dueDate?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validatePeriod(period: string): boolean {
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return periodRegex.test(period);
}

function validateUpdateInput(data: UpdateCommissionInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.period !== undefined && !validatePeriod(data.period)) {
    errors.push("Period must be in format YYYY-MM (e.g., 2025-12)");
  }

  if (data.amount !== undefined && (typeof data.amount !== "number" || data.amount < 0)) {
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
// PATCH - Update Commission
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string; commissionId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId, commissionId } = await params;

    if (!partnerId || !commissionId) {
      return NextResponse.json({ error: "Partner ID and Commission ID are required" }, { status: 400 });
    }

    // Verify partner exists
    const partner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Check if commission exists
    const existingCommission = await db.query.partnerCommissions.findFirst({
      where: and(
        eq(partnerCommissions.id, commissionId),
        eq(partnerCommissions.partnerId, partnerId)
      ),
    });

    if (!existingCommission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateUpdateInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<UpdateCommissionInput> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.period !== undefined) updateData.period = body.period;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.paidDate !== undefined) updateData.paidDate = body.paidDate;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    // Update commission
    const [updatedCommission] = await db
      .update(partnerCommissions)
      .set(updateData)
      .where(and(
        eq(partnerCommissions.id, commissionId),
        eq(partnerCommissions.partnerId, partnerId)
      ))
      .returning();

    logger.info("Commission updated", {
      userId: authResult.userId,
      partnerId,
      commissionId,
      updatedFields: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      data: updatedCommission,
      message: "Commission updated successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]/commissions/[commissionId]", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update commission", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Commission
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string; commissionId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId, commissionId } = await params;

    if (!partnerId || !commissionId) {
      return NextResponse.json({ error: "Partner ID and Commission ID are required" }, { status: 400 });
    }

    // Verify commission exists
    const existingCommission = await db.query.partnerCommissions.findFirst({
      where: and(
        eq(partnerCommissions.id, commissionId),
        eq(partnerCommissions.partnerId, partnerId)
      ),
    });

    if (!existingCommission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    // Delete commission
    await db
      .delete(partnerCommissions)
      .where(and(
        eq(partnerCommissions.id, commissionId),
        eq(partnerCommissions.partnerId, partnerId)
      ));

    logger.info("Commission deleted", {
      userId: authResult.userId,
      partnerId,
      commissionId,
      amount: existingCommission.amount,
    });

    return NextResponse.json({
      success: true,
      message: "Commission deleted successfully",
      data: {
        id: commissionId,
        deleted: true,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]/commissions/[commissionId]", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete commission", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
