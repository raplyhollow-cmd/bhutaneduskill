/**
 * PAYROLL MANAGEMENT API
 *
 * GET /api/school-admin/payroll - List payroll records with filters
 * POST /api/school-admin/payroll - Create manual payroll entry
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools, teachers } from "@/lib/db/schema";
import type { PayrollRecord, Teacher } from "@/lib/db/payroll-schema";
import {
  payrollRecords,
  payrollRuns,
  employeeSalaries,
  salaryStructures,
  allowanceTypes,
  deductionTypes,
} from "@/lib/db/payroll-schema";
import { eq, and, desc, sql, like, or, gte, lte } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

interface PayrollAllowanceInput {
  allowanceTypeId?: string;
  code?: string;
  name?: string;
  amount: number;
  isPercentage?: boolean;
  percentage?: number;
}

interface PayrollDeductionInput {
  deductionTypeId?: string;
  code?: string;
  name?: string;
  amount: number;
  isPercentage?: boolean;
  percentage?: number;
}

interface CreatePayrollRequest {
  employeeId: string;
  month: string;
  year: string;
  basicSalary: number;
  gradePay?: number;
  allowances?: PayrollAllowanceInput[];
  deductions?: PayrollDeductionInput[];
  bonus?: number;
  arrears?: number;
  paymentMethod?: string;
  notes?: string;
}

interface PayrollSummary {
  totalRecords: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
}

interface PayrollListResponse {
  success: true;
  records: PayrollRecord[];
  summary: PayrollSummary;
}

interface PayrollCreateResponse {
  success: true;
  record: PayrollRecord;
}

// GET /api/school-admin/payroll - List payroll records
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Get school ID from current user
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { schoolId: true },
    });

    const schoolId = currentUserData?.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Build conditions
    const conditions = [eq(payrollRecords.schoolId, schoolId)];

    if (month) {
      conditions.push(eq(payrollRecords.payrollMonth, parseInt(month)));
    }
    if (year) {
      conditions.push(eq(payrollRecords.payrollYear, parseInt(year)));
    }
    if (status) {
      conditions.push(eq(payrollRecords.paymentStatus, status));
    }

    // Fetch payroll records
    const records = await db.query.payrollRecords.findMany({
      where: and(...conditions),
      orderBy: [desc(payrollRecords.createdAt)],
    });

    // Filter by search if provided
    let filteredRecords = records;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRecords = records.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(searchLower) ||
          r.employeeCode?.toLowerCase().includes(searchLower) ||
          r.designation?.toLowerCase().includes(searchLower)
      );
    }

    // Get summary statistics
    const summary: PayrollSummary = {
      totalRecords: filteredRecords.length,
      totalAmount: filteredRecords.reduce((sum, r) => sum + (r.netPay || 0), 0),
      paidCount: filteredRecords.filter((r) => r.paymentStatus === "paid").length,
      pendingCount: filteredRecords.filter((r) => r.paymentStatus === "pending").length,
    };

    const response: PayrollListResponse = {
      success: true,
      records: filteredRecords,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/payroll", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch payroll records" }, { status: 500 });
  }
}

// POST /api/school-admin/payroll - Create manual payroll entry
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const body = await request.json() as CreatePayrollRequest;
    const {
      employeeId,
      month,
      year,
      basicSalary,
      gradePay = 0,
      allowances = [],
      deductions = [],
      bonus = 0,
      arrears = 0,
      paymentMethod = "bank_transfer",
      notes,
    } = body;

    // Validate required fields
    if (!employeeId || !month || !year || basicSalary === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: employeeId, month, year, basicSalary" },
        { status: 400 }
      );
    }

    // Get school ID
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { schoolId: true },
    });

    const schoolId = currentUserData?.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get employee details
    const employee = await db.query.users.findFirst({
      where: eq(users.id, employeeId),
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get teacher details for designation and department
    const teacherRecord = await db.query.teachers.findFirst({
      where: eq(teachers.userId, employeeId),
    });

    const designation = teacherRecord?.designation || "Teacher";
    const department = teacherRecord?.department || employee.department || "Teaching";

    // Calculate totals
    const totalAllowances = allowances.reduce((sum: number, a) => sum + (a.amount || 0), 0);
    const totalDeductions = deductions.reduce((sum: number, d) => sum + (d.amount || 0), 0);
    const totalEarnings = basicSalary + gradePay + totalAllowances + bonus + arrears;
    const netPay = totalEarnings - totalDeductions;

    // Check if payroll already exists for this employee/month/year
    const existing = await db.query.payrollRecords.findFirst({
      where: and(
        eq(payrollRecords.employeeId, employeeId),
        eq(payrollRecords.payrollMonth, parseInt(month)),
        eq(payrollRecords.payrollYear, parseInt(year))
      ),
    });

    if (existing) {
      return NextResponse.json({ error: "Payroll already exists for this period" }, { status: 400 });
    }

    // Create payroll record
    const [newRecord] = await db
      .insert(payrollRecords)
      .values({
        id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        schoolId,
        employeeId,
        payrollMonth: parseInt(month),
        payrollYear: parseInt(year),
        employeeName: employee.name || `${employee.firstName} ${employee.lastName}`.trim(),
        employeeCode: employee.employeeId,
        designation,
        department,
        basicSalary,
        gradePay,
        grossEarnings: basicSalary + gradePay,
        allowances: allowances.map((a) => ({
          allowanceTypeId: a.allowanceTypeId || "custom",
          allowanceCode: a.code || "CUSTOM",
          allowanceName: a.name || "Custom Allowance",
          amount: a.amount || 0,
          isPercentage: a.isPercentage || false,
          percentage: a.percentage,
        })),
        totalAllowances,
        bonus,
        arrears,
        otherEarnings: 0,
        totalEarnings,
        deductions: deductions.map((d) => ({
          deductionTypeId: d.deductionTypeId || "custom",
          deductionCode: d.code || "CUSTOM",
          deductionName: d.name || "Custom Deduction",
          amount: d.amount || 0,
          isPercentage: d.isPercentage || false,
          percentage: d.percentage,
          employeeShare: d.amount || 0,
        })),
        totalDeductions,
        pfDeduction: deductions.find((d) => d.code === "PF")?.amount || 0,
        taxDeduction: deductions.find((d) => d.code === "TAX")?.amount || 0,
        insuranceDeduction: deductions.find((d) => d.code === "INS")?.amount || 0,
        loanDeduction: deductions.find((d) => d.code === "LOAN")?.amount || 0,
        otherDeductions: 0,
        netPay,
        paymentMethod,
        paymentStatus: "pending",
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Manual payroll entry created", {
      route: "/api/school-admin/payroll",
      payrollId: newRecord.id,
      employeeId,
      month,
      year,
    });

    const response: PayrollCreateResponse = {
      success: true,
      record: newRecord,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/payroll", method: "POST" });
    return NextResponse.json({ error: "Failed to create payroll entry" }, { status: 500 });
  }
}
