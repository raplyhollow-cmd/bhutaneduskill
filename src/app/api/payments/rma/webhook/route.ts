import { NextRequest, NextResponse } from "next/server";
import { createRMAGateway } from "@/lib/payment/rma-gateway";
import { db } from "@/lib/db";
import { feePayments, studentFees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

interface RMAWebhookPayload {
  transaction_id: string;
  merchant_transaction_id: string;
  status: string;
  amount?: number;
  paid_amount?: number;
  payment_method?: string;
  paid_at?: string;
  failure_reason?: string;
}

// ============================================================================
// POST /api/payments/rma/webhook - RMA payment webhook
// ============================================================================

/**
 * Webhook handler for RMA payment notifications
 * RMA will call this endpoint when payment status changes
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    let payload: RMAWebhookPayload | null = null;

    try {
      payload = JSON.parse(rawBody) as RMAWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify webhook signature
    const gateway = createRMAGateway();
    const signature = request.headers.get("X-RMA-Signature") || request.headers.get("x-signature");

    if (!signature) {
      logger.warn("Webhook missing signature", { ip: request.headers.get("x-forwarded-for") || "unknown" });
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = gateway.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      logger.security("invalid_webhook_signature", { signature: signature?.substring(0, 10) + "..." });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Extract payment details
    const {
      transaction_id,
      merchant_transaction_id,
      status,
      amount,
      paid_amount,
      payment_method,
      paid_at,
      failure_reason,
    } = payload || {};

    if (!transaction_id || !merchant_transaction_id) {
      return NextResponse.json({ error: "Missing transaction details" }, { status: 400 });
    }

    // Find payment record
    const [payment] = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.transactionId, transaction_id))
      .limit(1);

    if (!payment) {
      logger.warn("Payment not found for webhook", { transactionId: transaction_id });
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check payment status from RMA
    const paymentStatus = await gateway.checkPaymentStatus(transaction_id);

    if (!paymentStatus) {
      logger.error(new Error("Failed to check payment status"), { transactionId: transaction_id });
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }

    // Update payment record based on status
    if (paymentStatus.status === "completed") {
      // Payment successful - update fee payment record
      await db.update(feePayments)
        .set({
          transactionId: transaction_id,
          notes: `RMA payment successful via ${payment_method}`,
        })
        .where(eq(feePayments.id, payment.id));

      // Update student fee
      const [studentFee] = await db
        .select()
        .from(studentFees)
        .where(eq(studentFees.id, payment.studentFeeId))
        .limit(1);

      if (studentFee) {
        const newAmountPaid = (studentFee.amountPaid || 0) + (paymentStatus.paidAmount || payment.amount);
        const newAmountPending = studentFee.totalAmount - newAmountPaid;

        await db.update(studentFees)
          .set({
            amountPaid: newAmountPaid,
            amountPending: Math.max(0, newAmountPending),
            status: newAmountPending <= 0 ? "paid" : "partial",
            lastPaymentDate: new Date().toISOString(),
          })
          .where(eq(studentFees.id, studentFee.id));
      }

      logger.info("Payment completed successfully", { transactionId: transaction_id, amount });

    } else if (paymentStatus.status === "failed" || paymentStatus.status === "cancelled") {
      // Payment failed or cancelled
      await db.update(feePayments)
        .set({
          notes: `RMA payment ${paymentStatus.status}: ${paymentStatus.failureReason || "No reason provided"}`,
        })
        .where(eq(feePayments.id, payment.id));

      logger.info("Payment failed or cancelled", { transactionId: transaction_id, status: paymentStatus.status, reason: paymentStatus.failureReason });
    }

    // Return success response to RMA
    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    logger.error(error, { route: "/api/payments/rma/webhook", method: "POST" });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// ============================================================================
// GET /api/payments/rma/webhook - Verify webhook endpoint
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "RMA Payment Webhook",
    version: "1.0.0",
  });
}
