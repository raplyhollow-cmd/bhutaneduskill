/**
 * PAYROLL RUN API
 *
 * POST /api/school-admin/payroll/run - Run payroll for all employees in a month
 * GET /api/school-admin/payroll/run - List payroll runs
 */

import { NextRequest } from "next/server";
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
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
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

interface PayrollRunRequest {
  month: string;
  year: string;
  runType?: string;
  runNumber?: number;
  notes?: string;
}

interface PayrollRunSummary {
  month: number;
  year: number;
  totalEmployees: number;
  processedEmployees: number;
  failedEmployees: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetPay: number;
}

interface PayrollRunResponse {
  success: true;
  runId: string;
  summary: PayrollRunSummary;
  records: ProcessedRecord[];
  errors?: PayrollError[];
}

interface PayrollRunsResponse {
  success: true;
  runs: unknown[];
}

// POST /api/school-admin/payroll/run - Process payroll for a month
export const POST = createApiRoute<{}, PayrollRunResponse>(
  async (req, { user }) => {
    const body: PayrollRunRequest = await req.json();
    const { month, year, runType = "monthly", runNumber = 1, notes } = body;

    // Validate required fields
    if (!month || !year) {
      return { error: "Missing required fields: month, year", status: 400 };
    }

    const payrollMonth = parseInt(month);
    const payrollYear = parseInt(year);

    // Get school ID
    const currentUserData = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(rows => rows[0]);

    const schoolId = currentUserData?.schoolId;
    if (!schoolId) {
      return { error: "School not found", status: 404 };
    }

    // Check if payroll run already exists for this period
    const existingRun = await db
      .select()
      .from(payrollRuns)
      .where(and(
        eq(payrollRuns.schoolId, schoolId),
        eq(payrollRuns.month, payrollMonth),
        eq(payrollRuns.year, payrollYear),
        eq(payrollRuns.runNumber, runNumber)
      ))
      .limit(1)
      .then(rows => rows[0]);

    if (existingRun && existingRun.status === "completed") {
      return { error: "Payroll already completed for this period", status: 400 };
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
    const teachers = await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.type, "teacher"), eq(users.isActive, true)));

    // Get allowance and deduction types for the school
    const schoolAllowanceTypes = await db
      .select()
      .from(allowanceTypes)
      .where(eq(allowanceTypes.schoolId, schoolId));

    const schoolDeductionTypes = await db
      .select()
      .from(deductionTypes)
      .where(eq(deductionTypes.schoolId, schoolId));

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
        const employeeSalary = await db
          .select()
          .from(employeeSalaries)
          .where(and(
            eq(employeeSalaries.employeeId, teacher.id),
            sql`${employeeSalaries.effectiveFrom} <= CURRENT_DATE`,
            sql`${employeeSalaries.effectiveTo} IS NULL OR ${employeeSalaries.effectiveTo} >= CURRENT_DATE`
          ))
          .limit(1)
          .then(rows => rows[0]);

        if (!employeeSalary) {
          errors.push({
            employeeId: teacher.id,
            employeeName: teacher.name,
            error: "No salary configuration found",
          });
          continue;
        }

        // Get payroll attendance
        const attendance = await db
          .select()
          .from(payrollAttendance)
          .where(and(
            eq(payrollAttendance.employeeId, teacher.id),
            eq(payrollAttendance.month, payrollMonth),
            eq(payrollAttendance.year, payrollYear)
          ))
          .limit(1)
          .then(rows => rows[0]);

        // Get salary structure
        let salaryStructure;
        if (employeeSalary.salaryStructureId) {
          salaryStructure = await db
            .select()
            .from(salaryStructures)
            .where(eq(salaryStructures.id, employeeSalary.salaryStructureId))
            .limit(1)
            .then(rows => rows[0]);
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
        const existingRecord = await db
          .select()
          .from(payrollRecords)
          .where(and(
            eq(payrollRecords.employeeId, teacher.id),
            eq(payrollRecords.payrollMonth, payrollMonth),
            eq(payrollRecords.payrollYear, payrollYear)
          ))
          .limit(1)
          .then(rows => rows[0]);

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

          processedRecords.push(updated as ProcessedRecord);
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

          processedRecords.push(newRecord as ProcessedRecord);
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
      runId,
      month: payrollMonth,
      year: payrollYear,
      processed: processedRecords.length,
      failed: errors.length,
    });

    return {
      data: {
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
        errors: errors.length > 0 ? errors : undefined,
      }
    };
  },
  ["admin", "school-admin"]
);

// GET /api/school-admin/payroll/run - List payroll runs
export const GET = createApiRoute<{}, PayrollRunsResponse>(
  async (req, { user }) => {
    // Get school ID
    const currentUserData = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(rows => rows[0]);

    const schoolId = currentUserData?.schoolId;
    if (!schoolId) {
      return { error: "School not found", status: 404 };
    }

    // Fetch payroll runs
    const runs = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.schoolId, schoolId))
      .orderBy(desc(payrollRuns.year), desc(payrollRuns.month), desc(payrollRuns.runNumber));

    return { data: { success: true, runs } };
  },
  ["admin", "school-admin"]
);
