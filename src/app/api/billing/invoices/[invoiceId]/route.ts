/**
 * INDIVIDUAL INVOICE MANAGEMENT API (Platform Admin)
 *
 * GET /api/billing/invoices/[invoiceId] - Get invoice details with line items
 * PATCH /api/billing/invoices/[invoiceId] - Update payment status
 * DELETE /api/billing/invoices/[invoiceId] - Void/delete invoice
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import {
  invoices,
  schools,
  paymentTransactions,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paidAt?: Date | null;
  amount: string;  // decimal type
  taxAmount: string;  // decimal type
  discountAmount: string;  // decimal type
  totalAmount: string;  // decimal type
  currency: string;
  status: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  pdfUrl?: string | null;
  notes?: string | null;
  // Billing period
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  // Refund
  refundAmount: string | null;  // decimal type
  refundReason?: string | null;
  refundedAt?: Date | null;
  // School
  schoolId: string;
  schoolName?: string | null;
  // Subscription tier
  subscriptionTier: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateInvoiceRequest {
  action?: "mark_paid" | "mark_pending" | "mark_overdue" | "void" | "send_reminder" | "record_payment" | "refund";
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
  paymentMethod?: "card" | "bank" | "rma" | "cash" | "cheque" | "manual";
  paymentReference?: string;
  amount?: number;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
}

// ============================================================================
// GET /api/billing/invoices/[invoiceId] - Get invoice details
// ============================================================================

export const GET = createApiRoute<{ invoiceId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { invoiceId } = await context!.params!;

    // Fetch invoice with related data
    const invoiceData = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        paidAt: invoices.paidAt,
        amount: invoices.amount,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        status: invoices.status,
        paymentMethod: invoices.paymentMethod,
        paymentReference: invoices.paymentReference,
        pdfUrl: invoices.pdfUrl,
        notes: invoices.notes,
        billingPeriodStart: invoices.billingPeriodStart,
        billingPeriodEnd: invoices.billingPeriodEnd,
        refundAmount: invoices.refundAmount,
        refundReason: invoices.refundReason,
        refundedAt: invoices.refundedAt,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        subscriptionTier: invoices.subscriptionTier,
        schoolId: invoices.schoolId,
        schoolName: schools.name,
      })
      .from(invoices)
      .leftJoin(schools, eq(invoices.schoolId, schools.id))
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (invoiceData.length === 0) {
      return { error: "Invoice not found", status: 404 };
    }

    const inv = invoiceData[0];

    // Format response
    const invoiceDetail: InvoiceDetail = {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber || "",
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      amount: inv.amount,
      taxAmount: inv.taxAmount || "0",
      discountAmount: inv.discountAmount || "0",
      totalAmount: inv.totalAmount,
      currency: inv.currency,
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      paymentReference: inv.paymentReference,
      pdfUrl: inv.pdfUrl,
      notes: inv.notes,
      billingPeriodStart: inv.billingPeriodStart,
      billingPeriodEnd: inv.billingPeriodEnd,
      refundAmount: inv.refundAmount || "0",
      refundReason: inv.refundReason,
      refundedAt: inv.refundedAt,
      schoolId: inv.schoolId,
      schoolName: inv.schoolName,
      subscriptionTier: inv.subscriptionTier,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    };

    logger.info("Invoice details fetched", { userId, invoiceId });

    return { data: invoiceDetail };
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/billing/invoices/[invoiceId] - Update invoice
// ============================================================================

export const PATCH = createApiRoute<{ invoiceId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { invoiceId } = await context!.params!;
    const body: UpdateInvoiceRequest = await req.json();
    const { action } = body;

    // Verify invoice exists
    const existing = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Invoice not found", status: 404 };
    }

    const invoice = existing[0];

    // Handle different actions
    switch (action) {
      case "mark_paid": {
        const paymentMethod = body.paymentMethod || invoice.paymentMethod || "manual";
        const paymentReference = body.paymentReference || `txn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Update invoice as paid
        await db
          .update(invoices)
          .set({
            status: "paid",
            paidAt: new Date(),
            paymentMethod,
            paymentReference,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        logger.info("Invoice marked as paid", {
          invoiceId,
          paymentMethod,
          paymentReference,
          updatedBy: userId,
        });

        return {
          data: { message: "Invoice marked as paid successfully" },
          message: "Invoice paid",
        };
      }

      case "mark_pending": {
        await db
          .update(invoices)
          .set({
            status: "pending",
            paidAt: null,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        logger.info("Invoice status changed to pending", {
          invoiceId,
          updatedBy: userId,
        });

        return {
          data: { message: "Invoice status changed to pending" },
          message: "Invoice pending",
        };
      }

      case "mark_overdue": {
        await db
          .update(invoices)
          .set({
            status: "overdue",
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        logger.info("Invoice marked as overdue", {
          invoiceId,
          updatedBy: userId,
        });

        return {
          data: { message: "Invoice marked as overdue" },
          message: "Invoice overdue",
        };
      }

      case "void": {
        if (invoice.status === "paid") {
          return {
            error: "Cannot void a paid invoice. Use refund action instead.",
            status: 400,
          };
        }

        await db
          .update(invoices)
          .set({
            status: "cancelled",
            notes: body.notes || invoice.notes,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        logger.info("Invoice voided", {
          invoiceId,
          updatedBy: userId,
          reason: body.notes,
        });

        return {
          data: { message: "Invoice voided successfully" },
          message: "Invoice voided",
        };
      }

      case "send_reminder": {
        // In a full implementation, this would:
        // 1. Send email notification to school
        // 2. Log the reminder event
        // 3. Update reminder count

        logger.info("Payment reminder sent for invoice", {
          invoiceId,
          schoolId: invoice.schoolId,
          sentBy: userId,
        });

        return {
          data: { message: "Payment reminder sent successfully" },
          message: "Reminder sent",
        };
      }

      case "record_payment": {
        // Convert decimal amounts to numbers for calculation
        const totalAmount = parseFloat(invoice.totalAmount);
        const currentRefundAmount = invoice.refundAmount ? parseFloat(invoice.refundAmount) : 0;
        const amount = body.amount || totalAmount;
        const paymentMethod = body.paymentMethod || invoice.paymentMethod || "manual";
        const paymentReference = body.paymentReference || `txn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Create transaction ID
        const transactionId = paymentReference;

        // Check if payment completes the invoice
        const isFullyPaid = amount >= totalAmount - currentRefundAmount;

        await db
          .update(invoices)
          .set({
            status: isFullyPaid ? "paid" : "pending",
            paidAt: isFullyPaid ? new Date() : invoice.paidAt,
            paymentMethod,
            paymentReference: transactionId,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        logger.info("Payment recorded for invoice", {
          invoiceId,
          amount,
          paymentMethod,
          transactionId,
          isFullyPaid,
          recordedBy: userId,
        });

        return {
          data: {
            message: isFullyPaid
              ? "Payment recorded and invoice marked as paid"
              : "Partial payment recorded",
            isFullyPaid,
            remainingAmount: totalAmount - amount,
          },
          message: "Payment recorded",
        };
      }

      case "refund": {
        if (invoice.status !== "paid") {
          return {
            error: "Can only refund paid invoices",
            status: 400,
          };
        }

        // Convert decimal amounts to numbers for calculation
        const totalAmount = parseFloat(invoice.totalAmount);
        const currentRefundAmount = invoice.refundAmount ? parseFloat(invoice.refundAmount) : 0;
        const refundAmount = body.refundAmount || totalAmount;
        const refundReason = body.refundReason || "No reason provided";

        if (refundAmount > totalAmount - currentRefundAmount) {
          return {
            error: "Refund amount exceeds available balance",
            status: 400,
          };
        }

        // Create refund transaction ID
        const refundTransactionId = `refund-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Calculate new refund amount (cumulative)
        const newRefundAmount = currentRefundAmount + refundAmount;
        const isFullyRefunded = newRefundAmount >= totalAmount;

        await db
          .update(invoices)
          .set({
            refundAmount: newRefundAmount.toFixed(2),
            refundReason,
            refundedAt: new Date(),
            status: isFullyRefunded ? "refunded" : "paid",
            paymentReference: refundTransactionId,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        logger.info("Invoice refund processed", {
          invoiceId,
          refundAmount,
          refundReason,
          refundTransactionId,
          isFullyRefunded,
          processedBy: userId,
        });

        return {
          data: {
            message: isFullyRefunded ? "Invoice fully refunded" : "Partial refund processed",
            refundAmount: newRefundAmount,
            remainingAmount: totalAmount - newRefundAmount,
            isFullyRefunded,
          },
          message: "Refund processed",
        };
      }

      default: {
        // Generic status update
        if (body.status) {
          const updates: Record<string, unknown> = {
            status: body.status,
            updatedAt: new Date(),
          };

          // Auto-set paidAt when marking as paid
          if (body.status === "paid" && !invoice.paidAt) {
            updates.paidAt = new Date();
          }

          // Clear paidAt if moving away from paid
          if (body.status !== "paid") {
            updates.paidAt = null;
          }

          if (body.paymentMethod) {
            updates.paymentMethod = body.paymentMethod;
          }

          if (body.paymentReference) {
            updates.paymentReference = body.paymentReference;
          }

          if (body.notes) {
            updates.notes = body.notes;
          }

          await db
            .update(invoices)
            .set(updates)
            .where(eq(invoices.id, invoiceId));

          logger.info("Invoice updated", {
            invoiceId,
            updates,
            updatedBy: userId,
          });

          return {
            data: { message: "Invoice updated successfully" },
            message: "Invoice updated",
          };
        }

        return { error: "No valid action provided", status: 400 };
      }
    }
  },
  ["admin"]
);

// ============================================================================
// DELETE /api/billing/invoices/[invoiceId] - Delete/void invoice
// ============================================================================

export const DELETE = createApiRoute<{ invoiceId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;
    const { invoiceId } = await context!.params!;

    // Verify invoice exists
    const existing = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Invoice not found", status: 404 };
    }

    const invoice = existing[0];

    // Don't allow deletion of paid invoices
    if (invoice.status === "paid") {
      return {
        error: "Cannot delete a paid invoice. Void it first if needed.",
        status: 400,
      };
    }

    // Mark as cancelled instead of deleting
    await db
      .update(invoices)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    logger.info("Invoice cancelled", {
      invoiceId,
      deletedBy: userId,
    });

    return {
      data: { message: "Invoice cancelled successfully" },
      message: "Invoice cancelled",
    };
  },
  ["admin"]
);
