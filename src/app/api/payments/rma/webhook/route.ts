import { NextRequest, NextResponse } from "next/server";
import { createRMAGateway } from "@/lib/payment/rma-gateway";
import { db } from "@/lib/db";
import { feePayments, studentFees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify webhook signature
    const gateway = createRMAGateway();
    const signature = request.headers.get("X-RMA-Signature") || request.headers.get("x-signature");

    if (!signature) {
      console.warn("[RMA Webhook] Missing signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = gateway.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.warn("[RMA Webhook] Invalid signature");
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
    } = payload;

    if (!transaction_id || !merchant_transaction_id) {
      return NextResponse.json({ error: "Missing transaction details" }, { status: 400 });
    }

    // Find payment record
    const payment = await db.query.feePayments.findFirst({
      where: eq(feePayments.transactionId, transaction_id),
    });

    if (!payment) {
      console.warn("[RMA Webhook] Payment not found:", transaction_id);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check payment status from RMA
    const paymentStatus = await gateway.checkPaymentStatus(transaction_id);

    if (!paymentStatus) {
      console.error("[RMA Webhook] Failed to check payment status");
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
      const studentFee = await db.query.studentFees.findFirst({
        where: eq(studentFees.id, payment.studentFeeId),
      });

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

      console.log("[RMA Webhook] Payment completed:", transaction_id);

    } else if (paymentStatus.status === "failed" || paymentStatus.status === "cancelled") {
      // Payment failed or cancelled
      await db.update(feePayments)
        .set({
          notes: `RMA payment ${paymentStatus.status}: ${paymentStatus.failureReason || "No reason provided"}`,
        })
        .where(eq(feePayments.id, payment.id));

      console.log("[RMA Webhook] Payment failed:", transaction_id, paymentStatus.failureReason);
    }

    // Return success response to RMA
    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("[RMA Webhook] Error:", error);
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
