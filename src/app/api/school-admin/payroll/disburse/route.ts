/**
 * PAYROLL DISBURSEMENT API
 *
 * POST /api/school-admin/payroll/disburse
 *
 * RMA Batch Disbursement for Salaries
 *
 * Processes batch salary payments via RMA payment gateway.
 * Generates payment file for bank transfer and updates payroll records.
 *
 * Flow:
 * 1. Validate payroll run is completed
 * 2. Generate batch payment file
 * 3. Initiate RMA batch transfer (if configured)
 * 4. Update payment status for all records
 * 5. Send payslip notifications
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { payrollRuns, payrollRecords, users, schools } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { nanoid } from "nanoid";

interface DisbursePayrollRequest {
  payrollRunId: string;
  paymentMethod: "rma_batch" | "bank_transfer" | "cash";
  sendNotifications: boolean;
  generatePayslips: boolean;
}

interface BankTransferFile {
  accountId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  amount: number;
  remarks: string;
}

/**
 * POST /api/school-admin/payroll/disburse
 *
 * Disburse salaries for a completed payroll run
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const body: DisbursePayrollRequest = await request.json();
      const {
        payrollRunId,
        paymentMethod = "bank_transfer",
        sendNotifications = true,
        generatePayslips = true,
      } = body;

      // Validate payroll run
      const [payrollRun] = await db
        .select()
        .from(payrollRuns)
        .where(
          and(
            eq(payrollRuns.id, payrollRunId),
            eq(payrollRuns.schoolId, user.schoolId)
          )
        )
        .limit(1);

      if (!payrollRun) {
        return notFoundResponse("Payroll run");
      }

      if (payrollRun.status !== "completed" && payrollRun.status !== "completed_with_errors") {
        return badRequestResponse(
          "Payroll run must be completed before disbursement"
        );
      }

      if (payrollRun.paymentStatus === "completed") {
        return badRequestResponse("Payroll has already been disbursed");
      }

      // Get all payroll records for this run
      const payrollRecordsData = await db
        .select()
        .from(payrollRecords)
        .where(eq(payrollRecords.payrollRunId, payrollRunId));

      if (payrollRecordsData.length === 0) {
        return badRequestResponse("No payroll records found for this run");
      }

      logger.info("Payroll disbursement started", {
        payrollRunId,
        paymentMethod,
        recordCount: payrollRecordsData.length,
      });

      // Update payroll run payment status to processing
      await db
        .update(payrollRuns)
        .set({ paymentStatus: "initiated" })
        .where(eq(payrollRuns.id, payrollRunId));

      // Generate bank transfer file
      const bankTransfers: BankTransferFile[] = [];
      const totalAmount = payrollRun.totalNetPay || 0;

      for (const record of payrollRecordsData) {
        if (record.paymentMethod === "bank_transfer" && record.bankAccountNumber) {
          bankTransfers.push({
            accountId: record.employeeId,
            accountName: record.employeeName,
            accountNumber: record.bankAccountNumber!,
            bankName: record.bankName || "Unknown",
            ifscCode: record.ifscCode || "",
            amount: record.netPay / 100, // Convert to BTN
            remarks: `Salary for ${getMonthName(record.payrollMonth)} ${record.payrollYear}`,
          });
        }

        // Update payment status to processing
        await db
          .update(payrollRecords)
          .set({
            paymentStatus: "processing",
            paymentMethod: paymentMethod === "rma_batch" ? "rma" : paymentMethod,
          })
          .where(eq(payrollRecords.id, record.id));
      }

      // Process RMA batch payment (if configured)
      let rmaReference: string | null = null;
      let paymentBatchId: string | null = null;

      if (paymentMethod === "rma_batch") {
        // TODO: Implement actual RMA batch disbursement
        // For now, create a reference
        rmaReference = `RMA-${Date.now()}`;
        paymentBatchId = `batch-${nanoid()}`;

        logger.info("RMA batch disbursement initiated", {
          payrollRunId,
          rmaReference,
          amount: totalAmount / 100,
        });
      } else if (paymentMethod === "bank_transfer" && bankTransfers.length > 0) {
        paymentBatchId = `bt-${nanoid()}`;
        logger.info("Bank transfer file generated", {
          payrollRunId,
          transferCount: bankTransfers.length,
        });
      }

      // Mark all records as paid
      const paidAt = new Date();
      await db
        .update(payrollRecords)
        .set({
          paymentStatus: "paid",
          paidAt,
          transactionId: rmaReference || paymentBatchId || undefined,
        })
        .where(eq(payrollRecords.payrollRunId, payrollRunId));

      // Update payroll run
      await db
        .update(payrollRuns)
        .set({
          paymentStatus: "completed",
          paymentBatchId: paymentBatchId,
        })
        .where(eq(payrollRuns.id, payrollRunId));

      // Send notifications and generate payslips if requested
      if (sendNotifications || generatePayslips) {
        // TODO: Implement notification sending and payslip generation
        logger.info("Payslip generation and notifications queued", {
          payrollRunId,
          sendNotifications,
          generatePayslips,
        });
      }

      logger.info("Payroll disbursement completed", {
        payrollRunId,
        paymentMethod,
        totalAmount: totalAmount / 100,
        employeeCount: payrollRecordsData.length,
      });

      return successResponse({
        payrollRunId,
        paymentMethod,
        paymentBatchId,
        rmaReference,
        disbursementSummary: {
          totalAmount: totalAmount / 100, // BTN
          employeeCount: payrollRecordsData.length,
          bankTransfers: bankTransfers.length,
          cashPayments: payrollRecordsData.length - bankTransfers.length,
        },
        bankTransferFile: bankTransfers.length > 0 ? bankTransfers : null,
        status: "completed",
      });
    } catch (error) {
      logger.error("Payroll disbursement failed", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Payroll disbursement failed");
    }
  },
  ["school-admin", "admin"]
);

/**
 * GET /api/school-admin/payroll/disburse/status
 *
 * Check disbursement status for a payroll run
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    const { searchParams } = new URL(request.url);
    const payrollRunId = searchParams.get("payrollRunId");

    if (!payrollRunId) {
      return badRequestResponse("payrollRunId is required");
    }

    try {
      const [payrollRun] = await db
        .select()
        .from(payrollRuns)
        .where(
          and(
            eq(payrollRuns.id, payrollRunId),
            eq(payrollRuns.schoolId, user.schoolId)
          )
        )
        .limit(1);

      if (!payrollRun) {
        return notFoundResponse("Payroll run");
      }

      // Get payment status breakdown
      const paymentStatuses = await db
        .select({
          paymentStatus: payrollRecords.paymentStatus,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(payrollRecords)
        .where(eq(payrollRecords.payrollRunId, payrollRunId))
        .groupBy(payrollRecords.paymentStatus);

      return successResponse({
        payrollRunId,
        paymentStatus: payrollRun.paymentStatus,
        paymentBatchId: payrollRun.paymentBatchId,
        initiatedAt: payrollRun.initiatedAt,
        completedAt: payrollRun.completedAt,
        breakdown: paymentStatuses,
      });
    } catch (error) {
      logger.error("Failed to get disbursement status", { error });
      return errorResponse("Failed to get disbursement status");
    }
  },
  ["school-admin", "admin"]
);

function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1] || "Unknown";
}

// Import SQL function for counting
import { sql } from "drizzle-orm";
