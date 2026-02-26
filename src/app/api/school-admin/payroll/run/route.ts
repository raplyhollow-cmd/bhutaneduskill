/**
 * PAYROLL RUN API
 *
 * POST /api/school-admin/payroll/run - Run payroll for all employees in a month
 * GET /api/school-admin/payroll/run - List payroll runs
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import {
  payrollRecords,
  payrollRuns,
  payrollAttendance,
  employeeSalaries,
  salaryStructures,
  allowanceTypes,
  deductionTypes,
} from "@/lib/db/payroll-schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { calculateSalary } from "@/lib/payroll/calculator";

// ============================================================================
// TYPES
// ============================================================================

interface ProcessedRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  netPay: number;
  [key: string]: unknown;
}

interface PayrollError {
  employeeId: string;
  employeeName: string | null;
  error: string;
}

interface TeacherWithDesignation {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  employeeId: string | null;
  designation?: string;
  department?: string;
}

// POST /api/school-admin/payroll/run - Process payroll for a month
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const body = await request.json();
    const { month, year, runType = "monthly", runNumber = 1, notes } = body;

    // Validate required fields
    if (!month || !year) {
      return NextResponse.json({ error: "Missing required fields: month, year" }, { status: 400 });
    }

    const payrollMonth = parseInt(month);
    const payrollYear = parseInt(year);

    // Get school ID
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { schoolId: true },
    });

    const schoolId = currentUserData?.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if payroll run already exists for this period
    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.schoolId, schoolId),
        eq(payrollRuns.month, payrollMonth),
        eq(payrollRuns.year, payrollYear),
        eq(payrollRuns.runNumber, runNumber)
      ),
    });

    if (existingRun && existingRun.status === "completed") {
      return NextResponse.json({ error: "Payroll already completed for this period" }, { status: 400 });
    }

    // Create or update payroll run
    const runId = existingRun?.id || `payrun-${nanoid()}`;

    if (!existingRun) {
      await db.insert(payrollRuns).values({
        id: runId,
        schoolId,
        month: payrollMonth,
        year: payrollYear,
        runType,
        runNumber,
        status: "processing",
        initiatedBy: user.id,
        initiatedAt: new Date(),
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(payrollRuns)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(payrollRuns.id, runId));
    }

    // Get all teachers for this school
    const teachers = await db.query.users.findMany({
      where: and(eq(users.schoolId, schoolId), eq(users.type, "teacher"), eq(users.isActive, true)),
    });

    // Get allowance and deduction types for the school
    const schoolAllowanceTypes = await db.query.allowanceTypes.findMany({
      where: eq(allowanceTypes.schoolId, schoolId),
    });

    const schoolDeductionTypes = await db.query.deductionTypes.findMany({
      where: eq(deductionTypes.schoolId, schoolId),
    });

    // Process each employee
    const processedRecords: ProcessedRecord[] = [];
    const errors: PayrollError[] = [];
    let totalBasicSalary = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;

    for (const teacher of teachers) {
      try {
        // Get employee salary configuration
        const employeeSalary = await db.query.employeeSalaries.findFirst({
          where: and(
            eq(employeeSalaries.employeeId, teacher.id),
            sql`${employeeSalaries.effectiveFrom} <= CURRENT_DATE`,
            sql`${employeeSalaries.effectiveTo} IS NULL OR ${employeeSalaries.effectiveTo} >= CURRENT_DATE`
          ),
        });

        if (!employeeSalary) {
          errors.push({
            employeeId: teacher.id,
            employeeName: teacher.name,
            error: "No salary configuration found",
          });
          continue;
        }

        // Get payroll attendance
        const attendance = await db.query.payrollAttendance.findFirst({
          where: and(
            eq(payrollAttendance.employeeId, teacher.id),
            eq(payrollAttendance.month, payrollMonth),
            eq(payrollAttendance.year, payrollYear)
          ),
        });

        // Get salary structure
        let salaryStructure;
        if (employeeSalary.salaryStructureId) {
          salaryStructure = await db.query.salaryStructures.findFirst({
            where: eq(salaryStructures.id, employeeSalary.salaryStructureId),
          });
        }

        // Calculate salary
        const calculation = calculateSalary({
          employeeSalary,
          attendance,
          salaryStructure,
          allowanceTypes: schoolAllowanceTypes,
          deductionTypes: schoolDeductionTypes,
        });

        // Check if payroll record already exists
        const existingRecord = await db.query.payrollRecords.findFirst({
          where: and(
            eq(payrollRecords.employeeId, teacher.id),
            eq(payrollRecords.payrollMonth, payrollMonth),
            eq(payrollRecords.payrollYear, payrollYear)
          ),
        });

        if (existingRecord) {
          // Update existing record
          const [updated] = await db
            .update(payrollRecords)
            .set({
              ...calculation,
              employeeName: teacher.name || `${teacher.firstName} ${teacher.lastName}`.trim(),
              employeeCode: teacher.employeeId,
              designation: (teacher as TeacherWithDesignation).designation || "Teacher",
              department: (teacher as TeacherWithDesignation).department || "Teaching",
              bankName: employeeSalary.bankName,
              bankAccountNumber: employeeSalary.bankAccountNumber,
              bankAccountType: employeeSalary.bankAccountType,
              ifscCode: employeeSalary.ifscCode,
              payrollRunId: runId,
              updatedAt: new Date(),
            })
            .where(eq(payrollRecords.id, existingRecord.id))
            .returning();

          processedRecords.push(updated);
        } else {
          // Create new payroll record
          const [newRecord] = await db
            .insert(payrollRecords)
            .values({
              id: `pr-${nanoid()}`,
              schoolId,
              employeeId: teacher.id,
              attendanceId: attendance?.id,
              payrollMonth,
              payrollYear,
              payrollRunId: runId,
              employeeName: teacher.name || `${teacher.firstName} ${teacher.lastName}`.trim(),
              employeeCode: teacher.employeeId,
              designation: (teacher as TeacherWithDesignation).designation || "Teacher",
              department: (teacher as TeacherWithDesignation).department || "Teaching",
              ...calculation,
              bankName: employeeSalary.bankName,
              bankAccountNumber: employeeSalary.bankAccountNumber,
              bankAccountType: employeeSalary.bankAccountType,
              ifscCode: employeeSalary.ifscCode,
              paymentStatus: "pending",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          processedRecords.push(newRecord);
        }

        // Update totals
        totalBasicSalary += calculation.basicSalary;
        totalAllowances += calculation.totalAllowances;
        totalDeductions += calculation.totalDeductions;
        totalNetPay += calculation.netPay;
      } catch (error) {
        logger.error(`Error processing payroll for employee ${teacher.id}:`, error);
        errors.push({
          employeeId: teacher.id,
          employeeName: teacher.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update payroll run with results
    const processingTime = Math.floor((Date.now() - new Date().getTime()) / 1000);
    const completedAt = new Date();

    await db
      .update(payrollRuns)
      .set({
        status: "completed",
        totalEmployees: teachers.length,
        processedEmployees: processedRecords.length,
        failedEmployees: errors.length,
        totalBasicSalary,
        totalAllowances,
        totalDeductions,
        totalNetPay,
        completedAt,
        processingTime,
        errors: errors.length > 0 ? errors : undefined,
        updatedAt: completedAt,
      })
      .where(eq(payrollRuns.id, runId));

    logger.info("Payroll run completed", {
      route: "/api/school-admin/payroll/run",
      runId,
      month: payrollMonth,
      year: payrollYear,
      processed: processedRecords.length,
      failed: errors.length,
    });

    return NextResponse.json({
      success: true,
      runId,
      summary: {
        month: payrollMonth,
        year: payrollYear,
        totalEmployees: teachers.length,
        processedEmployees: processedRecords.length,
        failedEmployees: errors.length,
        totalBasicSalary,
        totalAllowances,
        totalDeductions,
        totalNetPay,
      },
      records: processedRecords,
      errors,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/payroll/run", method: "POST" });
    return NextResponse.json({ error: "Failed to process payroll" }, { status: 500 });
  }
}

// GET /api/school-admin/payroll/run - List payroll runs
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    // Get school ID
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { schoolId: true },
    });

    const schoolId = currentUserData?.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Fetch payroll runs
    const runs = await db.query.payrollRuns.findMany({
      where: eq(payrollRuns.schoolId, schoolId),
      orderBy: [desc(payrollRuns.year), desc(payrollRuns.month), desc(payrollRuns.runNumber)],
    });

    return NextResponse.json({
      success: true,
      runs,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/payroll/run", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch payroll runs" }, { status: 500 });
  }
}
