"use server";

import { logger } from "@/lib/logger";
/**
 * ADMIN BILLING - SERVER ACTIONS
 *
 * Server actions for billing management (Platform Admin)
 * - Invoice creation and management
 * - Subscription management
 * - Payment tracking
 * - Refund processing
 * - Revenue dashboard data
 *
 * FEAT-018
 */


import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { invoices, subscriptions, subscriptionPlans, tenants, schools } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionData {
  id: string;
  schoolName: string;
  schoolCode?: string;
  tenantSlug?: string;
  plan: string;
  status: string;
  students: number;
  teachers: number;
  renewalDate: string;
  totalPaid: number;
  isTrial: boolean;
  trialEndDate?: string;
  autoRenew: boolean;
  price: number;
  currency: string;
  billingCycle: string;
  maxStudents?: number;
  maxTeachers?: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  school: string;
  plan: string;
  amount: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  currency: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  pdfUrl?: string;
  paymentMethod?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
}

export interface BillingStats {
  totalRevenue: number;
  revenueChange: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  overduePayments: number;
  monthlyRecurring: number;
  pendingAmount?: number;
  paidAmount?: number;
  refundedAmount?: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  invoices: number;
  payments: number;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert decimal string to number safely
 */
function decimalToNumber(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert number to decimal string for database storage
 */
function numberToDecimal(value: number): string {
  return value.toFixed(2);
}

// ============================================================================
// DATA FETCHING ACTIONS
// ============================================================================

/**
 * Fetch all billing data (subscriptions, invoices, stats)
 */
export async function fetchBillingData(): Promise<ActionResult<{
  subscriptions: SubscriptionData[];
  invoices: InvoiceData[];
  stats: BillingStats;
  revenueChart: RevenueChartData[];
}>> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    // Fetch subscriptions
    const subscriptionsResult = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        price: subscriptions.price,
        currency: subscriptions.currency,
        billingCycle: subscriptions.billingCycle,
        autoRenew: subscriptions.autoRenew,
        isTrial: subscriptions.isTrial,
        trialEndDate: subscriptions.trialEndDate,
        maxUsers: subscriptions.maxUsers,
        currentUsers: subscriptions.currentUsers,
        maxStudents: subscriptions.maxStudents,
        currentStudents: subscriptions.currentStudents,
        maxTeachers: subscriptions.maxTeachers,
        currentTeachers: subscriptions.currentTeachers,
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        planTier: subscriptionPlans.tier,
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantDomain: tenants.domain,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(100);

    const formattedSubscriptions: SubscriptionData[] = subscriptionsResult.map((sub) => ({
      id: sub.id,
      schoolName: sub.tenantName || "Unknown",
      schoolCode: undefined,
      tenantSlug: sub.tenantSlug,
      plan: sub.planName?.toLowerCase() || "unknown",
      status: sub.status,
      students: sub.currentStudents || 0,
      teachers: sub.currentTeachers || 0,
      renewalDate: sub.currentPeriodEnd?.toISOString() || sub.endDate?.toISOString() || new Date().toISOString(),
      totalPaid: sub.price || 0,
      isTrial: sub.isTrial,
      trialEndDate: sub.trialEndDate?.toISOString(),
      autoRenew: sub.autoRenew,
      price: sub.price,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      maxStudents: sub.maxStudents,
      maxTeachers: sub.maxTeachers,
    }));

    // Fetch invoices - using schoolId instead of tenantId/subscriptionId
    const invoicesResult = await db
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
        refundAmount: invoices.refundAmount,
        refundReason: invoices.refundReason,
        refundedAt: invoices.refundedAt,
        subscriptionTier: invoices.subscriptionTier,
        schoolId: invoices.schoolId,
        schoolName: schools.name,
      })
      .from(invoices)
      .leftJoin(schools, eq(invoices.schoolId, schools.id))
      .orderBy(desc(invoices.invoiceDate))
      .limit(100);

    const formattedInvoices: InvoiceData[] = invoicesResult.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber || "",
      school: inv.schoolName || "Unknown",
      plan: inv.subscriptionTier || "Unknown",
      amount: decimalToNumber(inv.totalAmount) || decimalToNumber(inv.amount),
      taxAmount: decimalToNumber(inv.taxAmount),
      discountAmount: decimalToNumber(inv.discountAmount),
      totalAmount: decimalToNumber(inv.totalAmount),
      currency: inv.currency,
      status: inv.status,
      invoiceDate: inv.invoiceDate?.toISOString() || new Date().toISOString(),
      dueDate: inv.dueDate?.toISOString() || new Date().toISOString(),
      paidDate: inv.paidAt?.toISOString(),
      pdfUrl: inv.pdfUrl,
      paymentMethod: inv.paymentMethod,
      refundAmount: decimalToNumber(inv.refundAmount),
      refundReason: inv.refundReason,
      refundedAt: inv.refundedAt?.toISOString(),
    }));

    // Calculate stats from subscriptions
    const revenueStats = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${subscriptions.price}), 0)`,
        activeCount: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'active')`,
        trialCount: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'trialing')`,
        pastDueCount: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'past_due')`,
      })
      .from(subscriptions);

    // Calculate stats from invoices - handle decimal type properly
    const invoiceStatsResult = await db
      .select({
        pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'sent')`,
        draftCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'draft')`,
        paidCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'paid')`,
        overdueCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'overdue')`,
        pendingAmount: invoices.totalAmount,
        paidAmount: invoices.totalAmount,
        refundedAmount: invoices.refundAmount,
      })
      .from(invoices);

    // Aggregate invoice stats manually to handle decimal conversion
    let pendingCount = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    let refundedAmount = 0;

    for (const stat of invoiceStatsResult) {
      if (stat.pendingAmount) {
        pendingAmount += decimalToNumber(stat.pendingAmount);
      }
      if (stat.refundedAmount) {
        refundedAmount += decimalToNumber(stat.refundedAmount);
      }
    }

    // Count by status
    for (const inv of invoicesResult) {
      if (inv.status === "sent" || inv.status === "draft") {
        pendingCount++;
      }
      if (inv.status === "paid") {
        paidAmount += decimalToNumber(inv.totalAmount);
      }
    }

    const mrrResult = await db
      .select({
        mrr: sql<number>`COALESCE(SUM(
          CASE
            WHEN ${subscriptions.billingCycle} = 'monthly' THEN ${subscriptions.price}
            ELSE ${subscriptions.price} / 12
          END
        ), 0)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    const stats: BillingStats = {
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      revenueChange: 12, // Mock value - would be calculated from historical data
      activeSubscriptions: revenueStats[0]?.activeCount || 0,
      pendingInvoices: pendingCount,
      overduePayments: revenueStats[0]?.pastDueCount || 0,
      monthlyRecurring: mrrResult[0]?.mrr || 0,
      pendingAmount,
      paidAmount,
      refundedAmount,
    };

    // Generate revenue chart data (mock - in production would come from analytics)
    const revenueChart: RevenueChartData[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      revenueChart.push({
        month: months[monthIndex],
        revenue: Math.floor(Math.random() * 500000) + 200000,
        invoices: Math.floor(Math.random() * 50) + 10,
        payments: Math.floor(Math.random() * 45) + 8,
      });
    }

    return {
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        invoices: formattedInvoices,
        stats,
        revenueChart,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch billing data";
    logger.error("Error fetching billing data:", error);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// INVOICE ACTIONS
// ============================================================================

/**
 * Create a new invoice for a school
 */
export async function createInvoice(data: {
  schoolId: string;
  amount: number;
  notes?: string;
  taxAmount?: number;
  discountAmount?: number;
  dueDays?: number;
  subscriptionTier?: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
}): Promise<ActionResult<{ invoiceNumber: string; id: string }>> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const { schoolId, amount, notes, taxAmount = 0, discountAmount = 0, dueDays = 30, subscriptionTier = "standard", billingPeriodStart, billingPeriodEnd } = data;

  if (!schoolId || !amount) {
    return { success: false, error: "School ID and amount are required" };
  }

  try {
    // Verify school exists
    const school = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (school.length === 0) {
      return { success: false, error: "School not found" };
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);

    // Generate invoice number
    const year = now.getFullYear();
    const invoiceCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(sql`EXTRACT(YEAR FROM ${invoices.invoiceDate}) = ${year}`);
    const invoiceNumber = `INV-${year}-${String((invoiceCount[0]?.count || 0) + 1).padStart(4, "0")}`;

    // Calculate total
    const totalAmount = amount + taxAmount - discountAmount;

    // Create invoice
    const invoiceId = `inv-${nanoid()}`;
    await db.insert(invoices).values({
      id: invoiceId,
      schoolId,
      invoiceNumber,
      invoiceDate: now,
      billingPeriodStart: billingPeriodStart || now,
      billingPeriodEnd: billingPeriodEnd || dueDate,
      amount: numberToDecimal(amount),
      taxAmount: numberToDecimal(taxAmount),
      discountAmount: numberToDecimal(discountAmount),
      totalAmount: numberToDecimal(totalAmount),
      currency: "BTN",
      status: "sent",
      dueDate,
      notes,
      createdBy: authResult.userId,
      createdAt: now,
      updatedAt: now,
      subscriptionTier,
    });

    revalidatePath("/admin/billing");

    return {
      success: true,
      data: { invoiceNumber, id: invoiceId },
      message: "Invoice generated successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create invoice";
    logger.error("Error creating invoice:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update invoice status (mark paid, send reminder, etc.)
 */
export async function updateInvoiceStatus(data: {
  invoiceId: string;
  action: string;
  status?: string;
  paymentMethod?: string;
  paymentReference?: string;
}): Promise<ActionResult> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const { invoiceId, action, status, paymentMethod, paymentReference } = data;

  if (!invoiceId) {
    return { success: false, error: "Invoice ID is required" };
  }

  try {
    switch (action) {
      case "mark_paid": {
        await db
          .update(invoices)
          .set({
            status: "paid",
            paidAt: new Date(),
            paymentMethod: paymentMethod || "manual",
            paymentReference: paymentReference,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));
        break;
      }

      case "mark_overdue": {
        await db
          .update(invoices)
          .set({
            status: "overdue",
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));
        break;
      }

      case "send_reminder": {
        // In a real implementation, this would send an email
        // For now, just return success
        break;
      }

      case "mark_sent": {
        await db
          .update(invoices)
          .set({
            status: "sent",
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));
        break;
      }

      case "cancel": {
        await db
          .update(invoices)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));
        break;
      }

      default: {
        if (status) {
          await db
            .update(invoices)
            .set({
              status,
              ...(status === "paid" && { paidAt: new Date() }),
              ...(paymentMethod && { paymentMethod }),
              ...(paymentReference && { paymentReference }),
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoiceId));
        }
      }
    }

    revalidatePath("/admin/billing");

    return {
      success: true,
      message: `Invoice ${action.replace(/_/g, " ")} successful`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update invoice";
    logger.error("Error updating invoice:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process refund for an invoice
 */
export async function processRefund(data: {
  invoiceId: string;
  refundAmount: number;
  refundReason: string;
}): Promise<ActionResult<{ refundAmount: number; remainingAmount: number; isFullyRefunded: boolean }>> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const { invoiceId, refundAmount, refundReason } = data;

  if (!invoiceId || !refundAmount || !refundReason) {
    return { success: false, error: "Invoice ID, refund amount, and reason are required" };
  }

  try {
    // Get invoice
    const existing = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "Invoice not found" };
    }

    const invoice = existing[0];

    if (invoice.status !== "paid") {
      return { success: false, error: "Can only refund paid invoices" };
    }

    const totalAmount = decimalToNumber(invoice.totalAmount);
    const currentRefundAmount = decimalToNumber(invoice.refundAmount);
    const availableAmount = totalAmount - currentRefundAmount;

    if (refundAmount > availableAmount) {
      return { success: false, error: "Refund amount exceeds available balance" };
    }

    // Calculate new refund amount (cumulative)
    const newRefundAmount = currentRefundAmount + refundAmount;
    const isFullyRefunded = newRefundAmount >= totalAmount;

    await db
      .update(invoices)
      .set({
        refundAmount: numberToDecimal(newRefundAmount),
        refundReason,
        refundedAt: new Date(),
        status: isFullyRefunded ? "refunded" : "paid",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    revalidatePath("/admin/billing");

    return {
      success: true,
      data: {
        refundAmount: newRefundAmount,
        remainingAmount: totalAmount - newRefundAmount,
        isFullyRefunded,
      },
      message: isFullyRefunded ? "Invoice fully refunded" : "Partial refund processed",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process refund";
    logger.error("Error processing refund:", error);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// SUBSCRIPTION ACTIONS
// ============================================================================

/**
 * Update subscription (cancel, activate, etc.)
 */
export async function updateSubscription(data: {
  subscriptionId: string;
  action: string;
  updates?: Record<string, unknown>;
}): Promise<ActionResult> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const { subscriptionId, action, updates } = data;

  if (!subscriptionId) {
    return { success: false, error: "Subscription ID is required" };
  }

  try {
    switch (action) {
      case "cancel": {
        await db
          .update(subscriptions)
          .set({
            cancelAtPeriodEnd: true,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
        break;
      }

      case "activate": {
        await db
          .update(subscriptions)
          .set({
            status: "active",
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
        break;
      }

      case "update_usage": {
        const { currentStudents, currentTeachers, currentUsers } = updates || {};

        await db
          .update(subscriptions)
          .set({
            ...(currentStudents !== undefined && { currentStudents: currentStudents as number }),
            ...(currentTeachers !== undefined && { currentTeachers: currentTeachers as number }),
            ...(currentUsers !== undefined && { currentUsers: currentUsers as number }),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
        break;
      }

      default: {
        // Generic updates
        if (updates) {
          await db
            .update(subscriptions)
            .set({
              ...updates,
              updatedAt: new Date(),
            } as Record<string, unknown>)
            .where(eq(subscriptions.id, subscriptionId));
        }
      }
    }

    revalidatePath("/admin/billing");

    return {
      success: true,
      message: `Subscription ${action.replace(/_/g, " ")} successful`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update subscription";
    logger.error("Error updating subscription:", error);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// EXPORT ACTIONS
// ============================================================================

/**
 * Export billing data as CSV
 */
export async function exportBillingData(data: {
  type: "invoices" | "subscriptions" | "payments";
  startDate?: string;
  endDate?: string;
}): Promise<ActionResult<{ url: string }>> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  // In a real implementation, this would:
  // 1. Fetch the requested data
  // 2. Generate CSV file
  // 3. Upload to storage
  // 4. Return download URL

  return {
    success: true,
    data: { url: "/api/billing/export/" + data.type },
    message: "Export initiated",
  };
}
