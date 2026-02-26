/**
 * INDIVIDUAL PAYROLL RECORD API
 *
 * GET /api/school-admin/payroll/[id] - Get a single payroll record
 * PATCH /api/school-admin/payroll/[id] - Update payroll record
 * DELETE /api/school-admin/payroll/[id] - Delete payroll record
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { payrollRecords } from "@/lib/db/payroll-schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PayrollUpdateData {
  basicSalary?: number;
  gradePay?: number;
  allowances?: Array<{ amount?: number; [key: string]: unknown }>;
  deductions?: Array<{ amount?: number; [key: string]: unknown }>;
  bonus?: number;
  arrears?: number;
  otherEarnings?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  updatedAt: Date;
  paidAt?: Date;
  grossEarnings?: number;
  totalAllowances?: number;
  totalDeductions?: number;
  totalEarnings?: number;
  netPay?: number;
}

interface AllowanceItem {
  amount?: number;
  [key: string]: unknown;
}

interface DeductionItem {
  amount?: number;
  [key: string]: unknown;
}

// GET /api/school-admin/payroll/[id] - Get a single payroll record
export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const authResult = await requireAuth(["admin", "school-admin", "teacher"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { id } = params;

    // Get payroll record
    const record = await db.query.payrollRecords.findFirst({
      where: eq(payrollRecords.id, id),
    });

    if (!record) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // Check permission: teachers can only view their own records
    if (user.type === "teacher" && record.employeeId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // For school-admin, verify same school
    if (user.type === "school-admin") {
      const currentUserData = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { schoolId: true },
      });

      if (currentUserData?.schoolId !== record.schoolId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error) {
    logger.apiError(error, { route: `/api/school-admin/payroll/${params.id}`, method: "GET" });
    return NextResponse.json({ error: "Failed to fetch payroll record" }, { status: 500 });
  }
}

// PATCH /api/school-admin/payroll/[id] - Update payroll record
export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { id } = params;
    const body = await request.json();

    // Get existing record
    const existing = await db.query.payrollRecords.findFirst({
      where: eq(payrollRecords.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // Check if locked
    if (existing.isLocked) {
      return NextResponse.json({ error: "Payroll record is locked and cannot be modified" }, { status: 400 });
    }

    // Verify school access
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { schoolId: true },
    });

    if (currentUserData?.schoolId !== existing.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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

    const updateData: PayrollUpdateData = { updatedAt: new Date() };
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
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
          ? allowances.reduce((sum: number, a: AllowanceItem) => sum + (a.amount || 0), 0)
          : existing.totalAllowances;

      const totalDeductions =
        typeof deductions === "object" && Array.isArray(deductions)
          ? deductions.reduce((sum: number, d: DeductionItem) => sum + (d.amount || 0), 0)
          : existing.totalDeductions;

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
      (updateData as Record<string, unknown>).paidAt = new Date();
    }

    const [updated] = await db
      .update(payrollRecords)
      .set(updateData)
      .where(eq(payrollRecords.id, id))
      .returning();

    logger.info("Payroll record updated", {
      route: `/api/school-admin/payroll/${id}`,
      payrollId: id,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      record: updated,
    });
  } catch (error) {
    logger.apiError(error, { route: `/api/school-admin/payroll/${params.id}`, method: "PATCH" });
    return NextResponse.json({ error: "Failed to update payroll record" }, { status: 500 });
  }
}

// DELETE /api/school-admin/payroll/[id] - Delete payroll record
export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { id } = params;

    // Get existing record
    const existing = await db.query.payrollRecords.findFirst({
      where: eq(payrollRecords.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // Check if locked
    if (existing.isLocked) {
      return NextResponse.json({ error: "Payroll record is locked and cannot be deleted" }, { status: 400 });
    }

    // Check if already paid
    if (existing.paymentStatus === "paid") {
      return NextResponse.json({ error: "Cannot delete paid payroll record" }, { status: 400 });
    }

    // Verify school access
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { schoolId: true },
    });

    if (currentUserData?.schoolId !== existing.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await db.delete(payrollRecords).where(eq(payrollRecords.id, id));

    logger.info("Payroll record deleted", {
      route: `/api/school-admin/payroll/${id}`,
      payrollId: id,
      deletedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Payroll record deleted successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: `/api/school-admin/payroll/${params.id}`, method: "DELETE" });
    return NextResponse.json({ error: "Failed to delete payroll record" }, { status: 500 });
  }
}
