import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, studentFees, feePayments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateBody, rmaPaymentSchema } from "@/lib/validation";
import { createRMAGateway, formatAmount } from "@/lib/payment/rma-gateway";
import { nanoid } from "nanoid";
import { applyRateLimitAuth, RateLimitPresets } from "@/lib/rate-limit";

// ============================================================================
// POST /api/payments/rma/initiate - Initiate RMA payment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for payment endpoint (stricter)
    const rateLimitResult = await applyRateLimitAuth(request, undefined, RateLimitPresets.payment);
    if (rateLimitResult) return rateLimitResult;
    const authResult = await requireAuth(['student', 'parent']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();

    // Validate request body
    const validation = validateBody(rmaPaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Get student fee record
    const studentFee = await db.query.studentFees.findFirst({
      where: eq(studentFees.id, data.studentFeeId),
    });

    if (!studentFee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    // Verify ownership (student can pay their own fees, parent can pay child's fees)
    if (user.type === "student" && studentFee.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if fee is already paid
    if (studentFee.status === "paid") {
      return NextResponse.json({ error: "Fee already paid" }, { status: 400 });
    }

    // Calculate payment amount
    const paymentAmount = data.amount || (studentFee.amountPending || studentFee.totalAmount);

    if (paymentAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    // Create payment record
    const paymentId = nanoid();
    const receiptNumber = `RCP${Date.now()}`;

    const [paymentRecord] = await db.insert(feePayments).values({
      id: paymentId,
      studentFeeId: data.studentFeeId,
      amount: paymentAmount,
      paidDate: new Date().toISOString().split('T')[0],
      method: "online",
      paymentMethod: "online",
      transactionId: paymentId,
      receiptNumber,
      status: "pending",
      isRecurring: false,
      dueDate: studentFee.dueDate,
      paidAt: new Date(),
      schoolId: studentFee.schoolId,
      collectedAt: new Date(),
      lastPaymentDate: new Date().toISOString().split('T')[0],
      amountPending: (studentFee.totalAmount || 0) - (studentFee.amountPaid || 0),
      notes: `RMA payment initiated via ${data.paymentMethod}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Initialize RMA gateway
    const gateway = createRMAGateway();

    // Build return URLs
    const baseUrl = process.env.APP_URL || request.nextUrl.origin;
    const returnUrl = `${baseUrl}/student/payments/success?payment=${paymentId}`;
    const cancelUrl = `${baseUrl}/student/payments/cancel?payment=${paymentId}`;

    // Get customer details
    const customerName = `${user.firstName} ${user.lastName || ""}`.trim();

    // Initiate payment with RMA
    const result = await gateway.initiatePayment({
      referenceId: paymentId,
      amount: paymentAmount,
      currency: data.currency,
      paymentMethod: data.paymentMethod as any,
      customerName,
      customerEmail: user.email || undefined,
      customerPhone: user.phone || undefined,
      customerId: user.id,
      returnUrl,
      cancelUrl,
      description: `Fee payment for ${receiptNumber}`,
      metadata: {
        paymentId,
        studentFeeId: data.studentFeeId,
        receiptNumber,
      },
    });

    if (!result.success) {
      // Update payment record as failed
      await db.update(feePayments)
        .set({
          notes: `Payment initiation failed: ${result.error}`,
        })
        .where(eq(feePayments.id, paymentId));

      return NextResponse.json(
        { error: result.error || "Failed to initiate payment" },
        { status: 500 }
      );
    }

    // Update payment record with transaction ID
    await db.update(feePayments)
      .set({
        transactionId: result.transactionId,
      })
      .where(eq(feePayments.id, paymentId));

    return NextResponse.json({
      success: true,
      payment: paymentRecord,
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl,
      qrCodeData: result.qrCodeData,
      amount: formatAmount(paymentAmount, data.currency),
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/payments/rma/initiate", method: "POST" });
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
