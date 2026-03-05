/**
 * Single Commission Management API
 *
 * PATCH /api/admin/partners/[partnerId]/commissions/[commissionId] - Update commission
 * DELETE /api/admin/partners/[partnerId]/commissions/[commissionId] - Delete commission
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
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

export const PATCH = createApiRoute(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ partnerId: string; commissionId: string }> }
  ) => {
    const { partnerId, commissionId } = await params;

    if (!partnerId || !commissionId) {
      return { error: "Partner ID and Commission ID are required", status: 400 };
    }

    // Verify partner exists
    const partnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);
    const partner = partnerResult[0];

    if (!partner) {
      return { error: "Partner not found", status: 404 };
    }

    // Check if commission exists
    const existingCommissionResult = await db
      .select()
      .from(partnerCommissions)
      .where(and(
        eq(partnerCommissions.id, commissionId),
        eq(partnerCommissions.partnerId, partnerId)
      ))
      .limit(1);
    const existingCommission = existingCommissionResult[0];

    if (!existingCommission) {
      return { error: "Commission not found", status: 404 };
    }

    const body = await request.json();

    // Validate input
    const validation = validateUpdateInput(body);
    if (!validation.valid) {
      return {
        error: "Validation failed",
        details: validation.errors,
        status: 400,
      };
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
      userId: auth.userId,
      partnerId,
      commissionId,
      updatedFields: Object.keys(body),
    });

    return {
      data: updatedCommission,
      message: "Commission updated successfully",
    };
  },
  ["admin"]
);

// ============================================================================
// DELETE - Delete Commission
// ============================================================================

export const DELETE = createApiRoute(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ partnerId: string; commissionId: string }> }
  ) => {
    const { partnerId, commissionId } = await params;

    if (!partnerId || !commissionId) {
      return { error: "Partner ID and Commission ID are required", status: 400 };
    }

    // Verify commission exists
    const existingCommissionResult = await db
      .select()
      .from(partnerCommissions)
      .where(and(
        eq(partnerCommissions.id, commissionId),
        eq(partnerCommissions.partnerId, partnerId)
      ))
      .limit(1);
    const existingCommission = existingCommissionResult[0];

    if (!existingCommission) {
      return { error: "Commission not found", status: 404 };
    }

    // Delete commission
    await db
      .delete(partnerCommissions)
      .where(and(
        eq(partnerCommissions.id, commissionId),
        eq(partnerCommissions.partnerId, partnerId)
      ));

    logger.info("Commission deleted", {
      userId: auth.userId,
      partnerId,
      commissionId,
      amount: existingCommission.amount,
    });

    return {
      message: "Commission deleted successfully",
      data: {
        id: commissionId,
        deleted: true,
      },
    };
  },
  ["admin"]
);
