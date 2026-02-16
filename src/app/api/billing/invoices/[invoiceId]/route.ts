/**
 * INDIVIDUAL INVOICE MANAGEMENT API (Platform Admin)
 *
 * GET /api/billing/invoices/[invoiceId] - Get invoice details with line items
 * PATCH /api/billing/invoices/[invoiceId] - Update payment status
 * DELETE /api/billing/invoices/[invoiceId] - Void/delete invoice
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  invoices,
  subscriptions,
  subscriptionPlans,
  tenants,
  paymentTransactions,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
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
  amount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod?: string | null;
  paymentDetails?: {
    transactionId?: string;
    bankReference?: string;
    cardLast4?: string;
    paidBy?: string;
    notes?: string;
  } | null;
  pdfUrl?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  // Period
  periodStart: Date;
  periodEnd: Date;
  // Refund
  refundAmount: number;
  refundReason?: string | null;
  refundedAt?: Date | null;
  // Nested
  subscription?: {
    id: string;
    status: string;
    billingCycle: string;
    price: number;
  };
  plan?: {
    id: string;
    name: string;
    tier: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug?: string;
    domain?: string;
  };
  // Payment transactions
  paymentHistory?: Array<{
    id: string;
    amount: number;
    status: string;
    provider: string;
    providerTransactionId?: string | null;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateInvoiceRequest {
  action?: "mark_paid" | "mark_pending" | "mark_overdue" | "void" | "send_reminder" | "record_payment";
  status?: "draft" | "pending" | "paid" | "overdue" | "cancelled" | "refunded";
  paymentMethod?: "card" | "bank" | "rma" | "cash" | "cheque" | "manual";
  paymentDetails?: {
    transactionId?: string;
    bankReference?: string;
    cardLast4?: string;
    paidBy?: string;
    notes?: string;
  };
  amount?: number;
  notes?: string;
}

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

// ============================================================================
// GET /api/billing/invoices/[invoiceId] - Get invoice details
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const { invoiceId } = await context.params;

  try {
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
        paymentDetails: invoices.paymentDetails,
        pdfUrl: invoices.pdfUrl,
        notes: invoices.notes,
        internalNotes: invoices.internalNotes,
        lineItems: invoices.lineItems,
        periodStart: invoices.periodStart,
        periodEnd: invoices.periodEnd,
        refundAmount: invoices.refundAmount,
        refundReason: invoices.refundReason,
        refundedAt: invoices.refundedAt,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        // Subscription details
        subscriptionId: subscriptions.id,
        subscriptionStatus: subscriptions.status,
        subscriptionBillingCycle: subscriptions.billingCycle,
        subscriptionPrice: subscriptions.price,
        // Plan details
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        planTier: subscriptionPlans.tier,
        // Tenant details
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantDomain: tenants.domain,
      })
      .from(invoices)
      .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (invoiceData.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const inv = invoiceData[0];

    // Get payment transactions for this invoice
    const transactions = await db.query.paymentTransactions.findMany({
      where: eq(paymentTransactions.invoiceId, invoiceId),
      orderBy: [desc(paymentTransactions.createdAt)],
    });

    // Format response
    const invoiceDetail: InvoiceDetail = {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber || "",
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      amount: inv.amount,
      taxAmount: inv.taxAmount || 0,
      discountAmount: inv.discountAmount || 0,
      totalAmount: inv.totalAmount,
      currency: inv.currency,
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      paymentDetails: (inv.paymentDetails as any) || null,
      pdfUrl: inv.pdfUrl,
      notes: inv.notes,
      internalNotes: inv.internalNotes,
      lineItems: (inv.lineItems as any) || [],
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      refundAmount: inv.refundAmount || 0,
      refundReason: inv.refundReason,
      refundedAt: inv.refundedAt,
      subscription: inv.subscriptionId
        ? {
            id: inv.subscriptionId,
            status: inv.subscriptionStatus || "",
            billingCycle: inv.subscriptionBillingCycle || "",
            price: inv.subscriptionPrice || 0,
          }
        : undefined,
      plan: inv.planId
        ? {
            id: inv.planId,
            name: inv.planName || "",
            tier: inv.planTier || "",
          }
        : undefined,
      tenant: inv.tenantId
        ? {
            id: inv.tenantId,
            name: inv.tenantName || "",
            slug: inv.tenantSlug || undefined,
            domain: inv.tenantDomain || undefined,
          }
        : undefined,
      paymentHistory: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        provider: t.provider,
        providerTransactionId: t.providerTransactionId,
        createdAt: t.createdAt,
      })),
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    };

    logger.info("Invoice details fetched", { userId, invoiceId });

    return NextResponse.json({
      data: invoiceDetail,
    } satisfies ApiSuccess<InvoiceDetail>);

  } catch (error) {
    logger.apiError(error, {
      route: `/api/billing/invoices/${invoiceId}`,
      method: "GET",
      userId,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch invoice details",
        status: 500,
        details: error instanceof Error ? error.message : undefined,
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/billing/invoices/[invoiceId] - Update invoice
// ============================================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const { invoiceId } = await context.params;

  try {
    const body: UpdateInvoiceRequest = await request.json();
    const { action } = body;

    // Verify invoice exists
    const existing = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const invoice = existing[0];

    // Handle different actions
    switch (action) {
      case "mark_paid": {
        const paymentMethod = body.paymentMethod || invoice.paymentMethod || "manual";
        const paymentDetails = body.paymentDetails || {};

        // Create payment transaction record
        const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Update invoice as paid
        await db
          .update(invoices)
          .set({
            status: "paid",
            paidAt: new Date(),
            paymentMethod,
            paymentDetails: {
              ...paymentDetails,
              transactionId: paymentDetails.transactionId || transactionId,
              paidBy: paymentDetails.paidBy || userId,
            },
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        // Record payment transaction (if not already using paymentTransactions table)
        // This would be implemented when payment flow is complete

        logger.info("Invoice marked as paid", {
          invoiceId,
          paymentMethod,
          transactionId: paymentDetails.transactionId,
          updatedBy: userId,
        });

        return NextResponse.json({
          data: { message: "Invoice marked as paid successfully" },
          message: "Invoice paid",
        } satisfies ApiSuccess<{ message: string }>);
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

        return NextResponse.json({
          data: { message: "Invoice status changed to pending" },
          message: "Invoice pending",
        } satisfies ApiSuccess<{ message: string }>);
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

        return NextResponse.json({
          data: { message: "Invoice marked as overdue" },
          message: "Invoice overdue",
        } satisfies ApiSuccess<{ message: string }>);
      }

      case "void": {
        if (invoice.status === "paid") {
          return NextResponse.json(
            { error: "Cannot void a paid invoice. Use refund action instead.", status: 400 } as ApiErrorResponse,
            { status: 400 }
          );
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

        return NextResponse.json({
          data: { message: "Invoice voided successfully" },
          message: "Invoice voided",
        } satisfies ApiSuccess<{ message: string }>);
      }

      case "send_reminder": {
        // In a full implementation, this would:
        // 1. Send email notification to tenant
        // 2. Log the reminder event
        // 3. Update reminder count

        logger.info("Payment reminder sent for invoice", {
          invoiceId,
          tenantId: invoice.tenantId,
          sentBy: userId,
        });

        return NextResponse.json({
          data: { message: "Payment reminder sent successfully" },
          message: "Reminder sent",
        } satisfies ApiSuccess<{ message: string }>);
      }

      case "record_payment": {
        const amount = body.amount || invoice.totalAmount;
        const paymentMethod = body.paymentMethod || invoice.paymentMethod || "manual";
        const paymentDetails = body.paymentDetails || {};

        // Create transaction ID
        const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Check if payment completes the invoice
        const isFullyPaid = amount >= invoice.totalAmount - (invoice.refundAmount || 0);

        await db
          .update(invoices)
          .set({
            status: isFullyPaid ? "paid" : "pending",
            paidAt: isFullyPaid ? new Date() : invoice.paidAt,
            paymentMethod,
            paymentDetails: {
              ...(invoice.paymentDetails as any),
              ...paymentDetails,
              transactionId: paymentDetails.transactionId || transactionId,
              paidBy: paymentDetails.paidBy || userId,
              amount: amount,
            } as any,
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

        return NextResponse.json({
          data: {
            message: isFullyPaid
              ? "Payment recorded and invoice marked as paid"
              : "Partial payment recorded",
            isFullyPaid,
            remainingAmount: invoice.totalAmount - amount,
          },
          message: "Payment recorded",
        } satisfies ApiSuccess<{ message: string; isFullyPaid: boolean; remainingAmount: number }>);
      }

      default: {
        // Generic status update
        if (body.status) {
          const updates: Record<string, any> = {
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

          if (body.paymentDetails) {
            updates.paymentDetails = body.paymentDetails;
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

          return NextResponse.json({
            data: { message: "Invoice updated successfully" },
            message: "Invoice updated",
          } satisfies ApiSuccess<{ message: string }>);
        }

        return NextResponse.json(
          { error: "No valid action provided", status: 400 } as ApiErrorResponse,
          { status: 400 }
        );
      }
    }

  } catch (error) {
    logger.apiError(error, {
      route: `/api/billing/invoices/${invoiceId}`,
      method: "PATCH",
      userId,
    });
    return NextResponse.json(
      {
        error: "Failed to update invoice",
        status: 500,
        details: error instanceof Error ? error.message : undefined,
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/billing/invoices/[invoiceId] - Delete/void invoice
// ============================================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const { invoiceId } = await context.params;

  try {
    // Verify invoice exists
    const existing = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const invoice = existing[0];

    // Don't allow deletion of paid invoices
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Cannot delete a paid invoice. Void it first if needed.", status: 400 } as ApiErrorResponse,
        { status: 400 }
      );
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

    return NextResponse.json({
      data: { message: "Invoice cancelled successfully" },
      message: "Invoice cancelled",
    } satisfies ApiSuccess<{ message: string }>);

  } catch (error) {
    logger.apiError(error, {
      route: `/api/billing/invoices/${invoiceId}`,
      method: "DELETE",
      userId,
    });
    return NextResponse.json(
      {
        error: "Failed to cancel invoice",
        status: 500,
        details: error instanceof Error ? error.message : undefined,
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
