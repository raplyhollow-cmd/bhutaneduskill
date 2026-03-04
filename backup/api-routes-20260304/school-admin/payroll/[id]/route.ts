/**
 * INDIVIDUAL PAYROLL RECORD API
 *
 * GET /api/school-admin/payroll/[id] - Get a single payroll record
 * PATCH /api/school-admin/payroll/[id] - Update payroll record
 * DELETE /api/school-admin/payroll/[id] - Delete payroll record
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { payrollRecords } from "@/lib/db/payroll-schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface PayrollUpdateData {
  basicSalary?: number | null;
  gradePay?: number | null;
  allowances?: Array<{ amount?: number; [key: string]: unknown }> | null;
  deductions?: Array<{ amount?: number; [key: string]: unknown }> | null;
  bonus?: number | null;
  arrears?: number | null;
  otherEarnings?: number | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  notes?: string | null;
  updatedAt: Date;
  paidAt?: Date | null;
  grossEarnings?: number | null;
  totalAllowances?: number | null;
  totalDeductions?: number | null;
  totalEarnings?: number | null;
  netPay?: number | null;
}

interface AllowanceItem {
  amount?: number;
  [key: string]: unknown;
}

interface DeductionItem {
  amount?: number;
  [key: string]: unknown;
}

interface PayrollResponse {
  success: true;
  record: unknown;
}

interface PayrollDeleteResponse {
  success: true;
  message: string;
}

// GET /api/school-admin/payroll/[id] - Get a single payroll record
export const GET = createApiRoute<{ id: string }, PayrollResponse>(
  async (req, { user }, context) => {
    const { id } = await context!.params;

    // Get payroll record
    const record = await db
      .select()
      .from(payrollRecords)
      .where(eq(payrollRecords.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!record) {
      return { error: "Payroll record not found", status: 404 };
    }

    // Check permission: teachers can only view their own records
    if (user.type === "teacher" && record.employeeId !== user.id) {
      return { error: "Access denied", status: 403 };
    }

    // For school-admin, verify same school
    if (user.type === "school-admin") {
      const currentUserData = await db
        .select({ schoolId: users.schoolId })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
        .then(rows => rows[0]);

      if (currentUserData?.schoolId !== record.schoolId) {
        return { error: "Access denied", status: 403 };
      }
    }

    return { data: { success: true, record } };
  },
  ["admin", "school-admin", "teacher"]
);

// PATCH /api/school-admin/payroll/[id] - Update payroll record
export const PATCH = createApiRoute<{ id: string }, PayrollResponse>(
  async (req, { user }, context) => {
    const { id } = await context!.params;
    const body = await req.json();

    // Get existing record
    const existing = await db
      .select()
      .from(payrollRecords)
      .where(eq(payrollRecords.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!existing) {
      return { error: "Payroll record not found", status: 404 };
    }

    // Check if locked
    if (existing.isLocked) {
      return { error: "Payroll record is locked and cannot be modified", status: 400 };
    }

    // Verify school access
    const currentUserData = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(rows => rows[0]);

    if (currentUserData?.schoolId !== existing.schoolId) {
      return { error: "Access denied", status: 403 };
    }

    // Allowed fields to update
    const allowedUpdates = [
      "basicSalary",
      "gradePay",
      "allowances",
      "deductions",
      "bonus",
      "arrears",
      "otherEarnings",
      "paymentMethod",
      "paymentStatus",
      "notes",
    ];

    // Build update data object with proper typing
    const updateData: PayrollUpdateData = { updatedAt: new Date() };

    // Copy allowed fields
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        (updateData as unknown as Record<string, unknown>)[field] = body[field];
      }
    }

    // Recalculate totals if provided
    if (body.basicSalary !== undefined || body.allowances !== undefined || body.deductions !== undefined) {
      const basicSalary = body.basicSalary ?? existing.basicSalary;
      const gradePay = body.gradePay ?? existing.gradePay;
      const allowances = body.allowances ?? existing.allowances;
      const deductions = body.deductions ?? existing.deductions;

      const totalAllowances =
        typeof allowances === "object" && Array.isArray(allowances)
          ? allowances.reduce((sum: number, a: AllowanceItem) => sum + (typeof a.amount === "number" ? a.amount : 0), 0)
          : existing.totalAllowances ?? 0;

      const totalDeductions =
        typeof deductions === "object" && Array.isArray(deductions)
          ? deductions.reduce((sum: number, d: DeductionItem) => sum + (typeof d.amount === "number" ? d.amount : 0), 0)
          : existing.totalDeductions ?? 0;

      const bonus = body.bonus ?? existing.bonus ?? 0;
      const arrears = body.arrears ?? existing.arrears ?? 0;
      const otherEarnings = body.otherEarnings ?? existing.otherEarnings ?? 0;

      updateData.basicSalary = basicSalary;
      updateData.gradePay = gradePay;
      updateData.grossEarnings = basicSalary + gradePay;
      updateData.totalAllowances = totalAllowances;
      updateData.totalDeductions = totalDeductions;
      updateData.totalEarnings = basicSalary + gradePay + totalAllowances + bonus + arrears + otherEarnings;
      updateData.netPay = updateData.totalEarnings - totalDeductions;
    }

    // Update payment status timestamp
    if (body.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
      updateData.paidAt = new Date();
    }

    const [updated] = await db
      .update(payrollRecords)
      .set(updateData as unknown)
      .where(eq(payrollRecords.id, id))
      .returning();

    logger.info("Payroll record updated", {
      payrollId: id,
      updatedBy: user.id,
    });

    return { data: { success: true, record: updated } };
  },
  ["admin", "school-admin"]
);

// DELETE /api/school-admin/payroll/[id] - Delete payroll record
export const DELETE = createApiRoute<{ id: string }, PayrollDeleteResponse>(
  async (req, { user }, context) => {
    const { id } = await context!.params;

    // Get existing record
    const existing = await db
      .select()
      .from(payrollRecords)
      .where(eq(payrollRecords.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!existing) {
      return { error: "Payroll record not found", status: 404 };
    }

    // Check if locked
    if (existing.isLocked) {
      return { error: "Payroll record is locked and cannot be deleted", status: 400 };
    }

    // Check if already paid
    if (existing.paymentStatus === "paid") {
      return { error: "Cannot delete paid payroll record", status: 400 };
    }

    // Verify school access
    const currentUserData = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(rows => rows[0]);

    if (currentUserData?.schoolId !== existing.schoolId) {
      return { error: "Access denied", status: 403 };
    }

    await db.delete(payrollRecords).where(eq(payrollRecords.id, id));

    logger.info("Payroll record deleted", {
      payrollId: id,
      deletedBy: user.id,
    });

    return {
      data: {
        success: true,
        message: "Payroll record deleted successfully"
      }
    };
  },
  ["admin", "school-admin"]
);
