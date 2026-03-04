/**
 * SCHOOL ADMIN FEES PAYMENTS API
 *
 * GET /api/school-admin/fees/payments - List all payments
 * POST /api/school-admin/fees/payments - Record payment
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { feePayments, studentFees, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse, notFoundResponse } from "@/lib/api/response-helpers";

const paymentSchema = z.object({
  studentFeeId: z.string(),
  amount: z.number(),
  paymentMethod: z.enum(["cash", "bank_transfer", "check", "online", "upi"]),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// GET /api/school-admin/fees/payments - List all payments
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const payments = await db
      .select()
      .from(feePayments)
      .where(studentId ? eq(feePayments.studentFeeId, studentId) : undefined)
      .orderBy(desc(feePayments.collectedAt))
      .limit(limit);

    return successResponse({ payments });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// POST /api/school-admin/fees/payments - Record payment
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    try {
      const body = await request.json();
      const validatedData = paymentSchema.parse(body);

      // Get student fee record using db.select()
      const studentFeeResult = await db
        .select()
        .from(studentFees)
        .where(eq(studentFees.id, validatedData.studentFeeId))
        .limit(1);

      const studentFee = studentFeeResult[0];

      if (!studentFee) {
        return notFoundResponse("Student fee record");
      }

      const newAmountPaid = (studentFee.amountPaid || 0) + validatedData.amount;
      const amountPending = studentFee.totalAmount - newAmountPaid;

      // Generate receipt number
      const receiptNumber = `REC${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create payment record
      const [payment] = await db.insert(feePayments).values({
        id: `pay_${Date.now()}`,
        studentFeeId: validatedData.studentFeeId,
        amount: validatedData.amount,
        paidDate: new Date().toISOString().split('T')[0],
        method: validatedData.paymentMethod,
        paymentMethod: validatedData.paymentMethod,
        transactionId: validatedData.transactionId,
        receiptNumber,
        status: "paid",
        isRecurring: false,
        dueDate: studentFee.dueDate,
        paidAt: new Date(),
        schoolId: user.schoolId,
        collectedAt: new Date(),
        lastPaymentDate: new Date().toISOString().split('T')[0],
        amountPending: Math.max(0, studentFee.totalAmount - (studentFee.amountPaid || 0) - validatedData.amount),
        notes: validatedData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Update student fee record
      const newStatus = amountPending <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "pending";

      await db.update(studentFees)
        .set({
          amountPaid: newAmountPaid,
          amountPending: Math.max(0, amountPending),
          status: newStatus,
          lastPaymentDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date(),
        })
        .where(eq(studentFees.id, validatedData.studentFeeId));

      return createdResponse({ payment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.error("Payment creation error:", error);
      return errorResponse("Failed to record payment", 500);
    }
  },
  ['admin', 'school-admin']
);
