/**
 * MINISTRY PAYMENT TRACKING API
 * GET /api/ministry/billing/payments - Fetch detailed payment tracking data
 *
 * Provides Ministry of Education with view-only access to:
 * - Payment transaction history
 * - School-wise payment breakdown
 * - Payment method analysis
 * - Overdue and pending payment alerts
 *
 * Protected: Requires 'ministry' or 'admin' role
 * Note: This is VIEW-ONLY - ministry users cannot modify payment data
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import {
  paymentTransactions,
  invoices,
  subscriptions,
  subscriptionPlans,
  tenants,
  schools,
} from "@/lib/db/schema";
import { eq, and, desc, sql, count, sum, gte, lte, or, SQL } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface PaymentTransactionData {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  school: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  provider: string;
  transactionDate: string;
  dueDate: string;
  paidDate: string | null;
  refundAmount: number;
  failureReason: string | null;
}

interface SchoolPaymentSummary {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentCount: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  averagePaymentTime: number; // Days from invoice to payment
}

interface PaymentMethodStats {
  method: string;
  provider: string;
  transactionCount: number;
  totalAmount: number;
  successRate: number;
  averageAmount: number;
}

interface PaymentTrendData {
  period: string;
  paid: number;
  pending: number;
  overdue: number;
  total: number;
}

interface PaymentAlertData {
  id: string;
  type: "overdue" | "failed_payment" | "upcoming_payment";
  school: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  description: string;
}

interface PaymentTrackingResponse {
  transactions: PaymentTransactionData[];
  schoolSummaries: SchoolPaymentSummary[];
  paymentMethodStats: PaymentMethodStats[];
  paymentTrends: PaymentTrendData[];
  alerts: PaymentAlertData[];
  summary: {
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    paymentRate: number;
    averageCollectionDays: number;
  };
  generatedAt: string;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate and authorize
    const authResult = await requireAuth(["ministry", "admin"]);
    if ("error" in authResult) {
      logger.security("unauthorized_access_attempt", {
        route: "/api/ministry/billing/payments",
        method: "GET",
      });
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const status = searchParams.get("status");
    const schoolId = searchParams.get("schoolId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    logger.info("Payment tracking data requested", {
      route: "/api/ministry/billing/payments",
      method: "GET",
      userId,
      filters: { status, schoolId, startDate, endDate },
    });

    // Fetch all payment data in parallel
    const [
      transactions,
      schoolSummaries,
      paymentMethodStats,
      paymentTrends,
      alerts,
      summary,
    ] = await Promise.all([
      getPaymentTransactions(req),
      getSchoolPaymentSummaries(req),
      getPaymentMethodStats(req),
      getPaymentTrends(req),
      getPaymentAlerts(req),
      getPaymentSummary(req),
    ]);

    const response: PaymentTrackingResponse = {
      transactions,
      schoolSummaries,
      paymentMethodStats,
      paymentTrends,
      alerts,
      summary,
      generatedAt: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.info("Payment tracking data retrieved successfully", {
      userId,
      duration: `${duration}ms`,
      transactionCount: transactions.length,
      alertCount: alerts.length,
    });

    return NextResponse.json({ data: response } satisfies ApiSuccess<PaymentTrackingResponse>);

  } catch (error) {
    logger.apiError(error, { route: "/api/ministry/billing/payments", method: "GET" });

    return NextResponse.json(
      {
        error: "Failed to fetch payment tracking data",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

/**
 * Get payment transactions with filtering
 */
async function getPaymentTransactions(req: NextRequest): Promise<PaymentTransactionData[]> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const schoolId = searchParams.get("schoolId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "100");

  // Build conditions
  const conditions: (SQL | undefined)[] = [];

  if (status) {
    conditions.push(eq(paymentTransactions.status, status));
  }

  if (startDate) {
    conditions.push(gte(paymentTransactions.createdAt, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(lte(paymentTransactions.createdAt, new Date(endDate)));
  }

  let baseQuery = db
    .select({
      id: paymentTransactions.id,
      transactionId: paymentTransactions.id,
      amount: paymentTransactions.amount,
      currency: paymentTransactions.currency,
      status: paymentTransactions.status,
      provider: paymentTransactions.provider,
      providerTransactionId: paymentTransactions.providerTransactionId,
      paymentMethodType: paymentTransactions.paymentMethodType,
      responseMessage: paymentTransactions.responseMessage,
      failureReason: paymentTransactions.failureReason,
      refundAmount: paymentTransactions.refundAmount,
      createdAt: paymentTransactions.createdAt,
      // Invoice data
      invoiceId: paymentTransactions.invoiceId,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDueDate: invoices.dueDate,
      invoicePaidAt: invoices.paidAt,
      // Subscription data
      subscriptionId: subscriptions.id,
      planName: subscriptionPlans.name,
      // Tenant/School data
      tenantId: tenants.id,
      tenantName: tenants.name,
      schoolId: schools.id,
      schoolName: schools.name,
      schoolCode: schools.code,
    })
    .from(paymentTransactions)
    .leftJoin(invoices, eq(paymentTransactions.invoiceId, invoices.id))
    .leftJoin(subscriptions, eq(paymentTransactions.subscriptionId, subscriptions.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .leftJoin(tenants, eq(paymentTransactions.tenantId, tenants.id))
    .leftJoin(schools, eq(schools.tenantId, tenants.id));

  // Apply school filter if specified
  if (schoolId) {
    baseQuery = baseQuery.where(eq(schools.id, schoolId)) as typeof baseQuery;
  }

  // Apply conditions
  const whereClause = conditions.length > 0 ? and(...conditions.filter(Boolean) as SQL[]) : undefined;
  if (whereClause) {
    baseQuery = baseQuery.where(whereClause) as typeof baseQuery;
  }

  const transactionData = await baseQuery
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(limit);

  return transactionData.map((t) => ({
    id: t.id,
    transactionId: t.providerTransactionId || t.id,
    invoiceNumber: t.invoiceNumber || "N/A",
    school: t.schoolName || t.tenantName || "Unknown",
    plan: t.planName || "Unknown",
    amount: t.amount || 0,
    currency: t.currency || "BTN",
    status: t.status,
    paymentMethod: t.paymentMethodType || t.provider || "unknown",
    provider: t.provider || "unknown",
    transactionDate: t.createdAt?.toISOString() || new Date().toISOString(),
    dueDate: t.invoiceDueDate?.toISOString() || new Date().toISOString(),
    paidDate: t.invoicePaidAt?.toISOString() || null,
    refundAmount: t.refundAmount || 0,
    failureReason: t.failureReason || null,
  }));
}

/**
 * Get school-wise payment summaries
 */
async function getSchoolPaymentSummaries(req: NextRequest): Promise<SchoolPaymentSummary[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all paid invoices by school
  const paidInvoices = await db
    .select({
      schoolId: schools.id,
      schoolName: schools.name,
      schoolCode: schools.code,
      totalAmount: sum(invoices.totalAmount),
      paymentCount: count(),
      lastPaymentDate: sql<string>`MAX(${invoices.paidAt})`,
    })
    .from(invoices)
    .innerJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
    .innerJoin(schools, eq(tenants.id, schools.tenantId))
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, startOfMonth)
      )
    )
    .groupBy(schools.id, schools.name, schools.code);

  // Get pending invoices by school
  const pendingInvoices = await db
    .select({
      schoolId: schools.id,
      totalAmount: sum(invoices.totalAmount),
    })
    .from(invoices)
    .innerJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
    .innerJoin(schools, eq(tenants.id, schools.tenantId))
    .where(eq(invoices.status, "pending"))
    .groupBy(schools.id);

  // Get overdue invoices by school
  const overdueInvoices = await db
    .select({
      schoolId: schools.id,
      totalAmount: sum(invoices.totalAmount),
    })
    .from(invoices)
    .innerJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
    .innerJoin(schools, eq(tenants.id, schools.tenantId))
    .where(and(eq(invoices.status, "overdue"), sql`${invoices.dueDate} < ${now}`))
    .groupBy(schools.id);

  // Combine data
  const schoolMap = new Map<string, SchoolPaymentSummary>();

  // Initialize with all schools that have activity
  for (const paid of paidInvoices) {
    schoolMap.set(paid.schoolId, {
      schoolId: paid.schoolId,
      schoolName: paid.schoolName || "Unknown",
      schoolCode: paid.schoolCode || "",
      totalPaid: Number(paid.totalAmount) || 0,
      totalPending: 0,
      totalOverdue: 0,
      paymentCount: paid.paymentCount,
      lastPaymentDate: paid.lastPaymentDate as string || null,
      lastPaymentAmount: Number(paid.totalAmount) || 0,
      averagePaymentTime: 0,
    });
  }

  // Add pending amounts
  for (const pending of pendingInvoices) {
    const existing = schoolMap.get(pending.schoolId);
    if (existing) {
      existing.totalPending = Number(pending.totalAmount) || 0;
    } else {
      schoolMap.set(pending.schoolId, {
        schoolId: pending.schoolId,
        schoolName: "Unknown",
        schoolCode: "",
        totalPaid: 0,
        totalPending: Number(pending.totalAmount) || 0,
        totalOverdue: 0,
        paymentCount: 0,
        lastPaymentDate: null,
        lastPaymentAmount: 0,
        averagePaymentTime: 0,
      });
    }
  }

  // Add overdue amounts
  for (const overdue of overdueInvoices) {
    const existing = schoolMap.get(overdue.schoolId);
    if (existing) {
      existing.totalOverdue = Number(overdue.totalAmount) || 0;
    } else {
      schoolMap.set(overdue.schoolId, {
        schoolId: overdue.schoolId,
        schoolName: "Unknown",
        schoolCode: "",
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: Number(overdue.totalAmount) || 0,
        paymentCount: 0,
        lastPaymentDate: null,
        lastPaymentAmount: 0,
        averagePaymentTime: 0,
      });
    }
  }

  return Array.from(schoolMap.values());
}

/**
 * Get payment method statistics
 */
async function getPaymentMethodStats(req: NextRequest): Promise<PaymentMethodStats[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await db
    .select({
      provider: paymentTransactions.provider,
      paymentMethodType: paymentTransactions.paymentMethodType,
      transactionCount: count(),
      totalAmount: sum(paymentTransactions.amount),
      successCount: count(),
    })
    .from(paymentTransactions)
    .where(gte(paymentTransactions.createdAt, startOfMonth))
    .groupBy(paymentTransactions.provider, paymentTransactions.paymentMethodType);

  // Get failed transactions count for success rate calculation
  const failedStats = await db
    .select({
      provider: paymentTransactions.provider,
      paymentMethodType: paymentTransactions.paymentMethodType,
      failedCount: count(),
    })
    .from(paymentTransactions)
    .where(
      and(
        gte(paymentTransactions.createdAt, startOfMonth),
        eq(paymentTransactions.status, "failed")
      )
    )
    .groupBy(paymentTransactions.provider, paymentTransactions.paymentMethodType);

  const failedMap = new Map(
    failedStats.map((f) => [`${f.provider}-${f.paymentMethodType}`, f.failedCount])
  );

  return stats.map((stat) => {
    const key = `${stat.provider}-${stat.paymentMethodType}`;
    const failedCount = failedMap.get(key) || 0;
    const totalTransactions = stat.transactionCount;
    const successRate = totalTransactions > 0
      ? Math.round(((totalTransactions - failedCount) / totalTransactions) * 100)
      : 0;
    const averageAmount = totalTransactions > 0
      ? Number(stat.totalAmount) / totalTransactions
      : 0;

    return {
      method: stat.paymentMethodType || stat.provider,
      provider: stat.provider,
      transactionCount: totalTransactions,
      totalAmount: Number(stat.totalAmount) || 0,
      successRate,
      averageAmount,
    };
  });
}

/**
 * Get payment trends over time
 */
async function getPaymentTrends(req: NextRequest): Promise<PaymentTrendData[]> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const trends = await db
    .select({
      period: sql<string>`DATE_TRUNC('month', ${invoices.invoiceDate})`,
      paidAmount: sum(sql`CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END`),
      pendingAmount: sum(sql`CASE WHEN ${invoices.status} = 'pending' THEN ${invoices.totalAmount} ELSE 0 END`),
      overdueAmount: sum(sql`CASE WHEN ${invoices.status} = 'overdue' THEN ${invoices.totalAmount} ELSE 0 END`),
    })
    .from(invoices)
    .where(gte(invoices.invoiceDate, twelveMonthsAgo))
    .groupBy(sql`DATE_TRUNC('month', ${invoices.invoiceDate})`)
    .orderBy(sql`DATE_TRUNC('month', ${invoices.invoiceDate})`);

  return trends.map((t) => {
    const paid = Number(t.paidAmount) || 0;
    const pending = Number(t.pendingAmount) || 0;
    const overdue = Number(t.overdueAmount) || 0;

    return {
      period: new Date(t.period).toLocaleDateString("en-BT", { month: "short", year: "numeric" }),
      paid,
      pending,
      overdue,
      total: paid + pending + overdue,
    };
  });
}

/**
 * Get payment alerts (overdue, failed, upcoming)
 */
async function getPaymentAlerts(req: NextRequest): Promise<PaymentAlertData[]> {
  const now = new Date();
  const alerts: PaymentAlertData[] = [];

  // Overdue invoices alert
  const overdueInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      dueDate: invoices.dueDate,
      schoolName: schools.name,
    })
    .from(invoices)
    .innerJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
    .innerJoin(schools, eq(tenants.id, schools.tenantId))
    .where(
      and(
        or(
          eq(invoices.status, "pending"),
          eq(invoices.status, "overdue")
        ),
        sql`${invoices.dueDate} < ${now}`
      )
    )
    .orderBy(desc(invoices.dueDate))
    .limit(20);

  for (const inv of overdueInvoices) {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      id: inv.id,
      type: "overdue",
      school: inv.schoolName || "Unknown",
      amount: Number(inv.totalAmount) || 0,
      currency: inv.currency || "BTN",
      dueDate: inv.dueDate?.toISOString() || now.toISOString(),
      daysOverdue,
      description: `Invoice ${inv.invoiceNumber} is ${daysOverdue} days overdue`,
    });
  }

  // Recent failed payment transactions
  const failedPayments = await db
    .select({
      id: paymentTransactions.id,
      amount: paymentTransactions.amount,
      currency: paymentTransactions.currency,
      failureReason: paymentTransactions.failureReason,
      createdAt: paymentTransactions.createdAt,
      schoolName: schools.name,
    })
    .from(paymentTransactions)
    .innerJoin(tenants, eq(paymentTransactions.tenantId, tenants.id))
    .innerJoin(schools, eq(tenants.id, schools.tenantId))
    .where(
      and(
        eq(paymentTransactions.status, "failed"),
        gte(paymentTransactions.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      )
    )
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(10);

  for (const payment of failedPayments) {
    alerts.push({
      id: payment.id,
      type: "failed_payment",
      school: payment.schoolName || "Unknown",
      amount: Number(payment.amount) || 0,
      currency: payment.currency || "BTN",
      dueDate: payment.createdAt?.toISOString() || now.toISOString(),
      daysOverdue: 0,
      description: `Payment failed: ${payment.failureReason || "Unknown reason"}`,
    });
  }

  // Upcoming payments (due in next 7 days)
  const upcomingInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      dueDate: invoices.dueDate,
      schoolName: schools.name,
    })
    .from(invoices)
    .innerJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
    .innerJoin(schools, eq(tenants.id, schools.tenantId))
    .where(
      and(
        eq(invoices.status, "pending"),
        sql`${invoices.dueDate} >= ${now}`,
        sql`${invoices.dueDate} <= ${new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)}`
      )
    )
    .orderBy(invoices.dueDate)
    .limit(10);

  for (const inv of upcomingInvoices) {
    const daysUntilDue = Math.floor((new Date(inv.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      id: inv.id,
      type: "upcoming_payment",
      school: inv.schoolName || "Unknown",
      amount: Number(inv.totalAmount) || 0,
      currency: inv.currency || "BTN",
      dueDate: inv.dueDate?.toISOString() || now.toISOString(),
      daysOverdue: 0,
      description: `Invoice ${inv.invoiceNumber} due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`,
    });
  }

  // Sort by severity (overdue first, then failed, then upcoming)
  return alerts.sort((a, b) => {
    const priority = { overdue: 0, failed_payment: 1, upcoming_payment: 2 };
    const priorityDiff = priority[a.type] - priority[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  }).slice(0, 50);
}

/**
 * Get overall payment summary
 */
async function getPaymentSummary(req: NextRequest): Promise<{
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  paymentRate: number;
  averageCollectionDays: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total collected this month
  const [collectedResult] = await db
    .select({ total: sum(invoices.totalAmount) })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, startOfMonth)
      )
    );

  const totalCollected = Number(collectedResult?.total) || 0;

  // Total pending
  const [pendingResult] = await db
    .select({ total: sum(invoices.totalAmount) })
    .from(invoices)
    .where(eq(invoices.status, "pending"));

  const totalPending = Number(pendingResult?.total) || 0;

  // Total overdue
  const [overdueResult] = await db
    .select({ total: sum(invoices.totalAmount) })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "overdue"),
        sql`${invoices.dueDate} < ${now}`
      )
    );

  const totalOverdue = Number(overdueResult?.total) || 0;

  // Payment success rate (paid vs total invoices)
  const [totalInvoicesResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(gte(invoices.createdAt, startOfMonth));

  const [paidInvoicesResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, startOfMonth)
      )
    );

  const paymentRate = (totalInvoicesResult?.count ?? 0) > 0
    ? Math.round(((paidInvoicesResult?.count ?? 0) / (totalInvoicesResult?.count ?? 1)) * 100)
    : 0;

  // Average collection days (time from invoice creation to payment)
  const avgDaysResult = await db
    .select({
      avgDays: sql<number>`AVG(EXTRACT(DAY FROM ${invoices.paidAt} - ${invoices.invoiceDate}))`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, startOfMonth)
      )
    );

  const averageCollectionDays = Math.round(Number(avgDaysResult?.[0]?.avgDays) || 0);

  return {
    totalCollected,
    totalPending,
    totalOverdue,
    paymentRate,
    averageCollectionDays,
  };
}
