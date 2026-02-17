/**
 * MINISTRY BILLING OVERVIEW API
 * GET /api/ministry/billing - Fetch platform billing and revenue data (view-only)
 *
 * Provides Ministry of Education with view-only access to:
 * - Platform revenue statistics
 * - School-wise billing breakdown
 * - Invoice tracking
 * - Payment status overview
 *
 * Protected: Requires 'ministry' or 'admin' role
 * Note: This is VIEW-ONLY - ministry users cannot modify billing data
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import {
  subscriptions,
  subscriptionPlans,
  invoices,
  tenants,
  schools,
  paymentTransactions,
} from "@/lib/db/schema";
import { eq, and, desc, sql, count, sum, gte, SQL } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface RevenueStatistics {
  totalRevenue: number;
  revenueChange: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  monthlyRecurring: number;
  annualRecurring: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

interface PlanRevenueBreakdown {
  planName: string;
  totalRevenue: number;
  subscriptionCount: number;
  percentage: number;
}

interface SchoolSubscriptionData {
  id: string;
  schoolName: string;
  schoolCode: string;
  plan: string;
  planPrice: number;
  status: string;
  students: number;
  teachers: number;
  startDate: string;
  renewalDate: string;
  totalPaid: number;
  isTrial: boolean;
  autoRenew: boolean;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  school: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  pdfUrl: string | null;
}

interface PaymentMethodData {
  id: string;
  type: string;
  provider: string;
  isActive: boolean;
  isDefault: boolean;
  displayInfo: string;
}

interface BillingOverviewResponse {
  statistics: RevenueStatistics;
  monthlyRevenue: MonthlyRevenueData[];
  revenueByPlan: PlanRevenueBreakdown[];
  subscriptions: SchoolSubscriptionData[];
  invoices: InvoiceData[];
  paymentMethods: PaymentMethodData[];
  currency: {
    code: string;
    symbol: string;
    gstRate: number;
  };
  generatedAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get month abbreviation from date
 */
function getMonthAbbr(date: Date): string {
  return date.toLocaleString("en-BT", { month: "short" });
}

/**
 * Calculate percentage
 */
function calculatePercentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

/**
 * Get date N months ago
 */
function getDateMonthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate and authorize - ministry users have VIEW-ONLY access
    const authResult = await requireAuth(["ministry", "admin"]);
    if ("error" in authResult) {
      logger.security("unauthorized_access_attempt", {
        route: "/api/ministry/billing",
        method: "GET",
      });
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    logger.info("Ministry billing data requested", { route: "/api/ministry/billing", userId });

    // Fetch all billing data in parallel
    const [
      statistics,
      monthlyRevenue,
      revenueByPlan,
      subscriptions,
      invoices,
      paymentMethods,
    ] = await Promise.all([
      getRevenueStatistics(),
      getMonthlyRevenueData(),
      getRevenueByPlan(),
      getSchoolSubscriptions(req),
      getInvoices(req),
      getPaymentMethods(),
    ]);

    const response: BillingOverviewResponse = {
      statistics,
      monthlyRevenue,
      revenueByPlan,
      subscriptions,
      invoices,
      paymentMethods,
      currency: {
        code: "BTN",
        symbol: "Nu.",
        gstRate: 7,
      },
      generatedAt: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.info("Ministry billing data retrieved successfully", {
      userId,
      duration: `${duration}ms`,
      subscriptionCount: subscriptions.length,
      invoiceCount: invoices.length,
    });

    return NextResponse.json({ data: response } satisfies ApiSuccess<BillingOverviewResponse>);

  } catch (error) {
    logger.apiError(error, { route: "/api/ministry/billing", method: "GET" });

    return NextResponse.json(
      {
        error: "Failed to fetch billing data",
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
 * Get revenue statistics
 */
async function getRevenueStatistics(): Promise<RevenueStatistics> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Active subscriptions
  const [activeSubsResult] = await db
    .select({ count: count(), total: sum(subscriptions.price) })
    .from(subscriptions)
    .where(sql`${subscriptions.status} = 'active' OR ${subscriptions.status} = 'trialing'`);

  const activeSubscriptions = activeSubsResult?.count || 0;
  const totalRevenue = Number(activeSubsResult?.total) || 0;

  // New subscriptions this month
  const [newSubsResult] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(gte(subscriptions.createdAt, startOfThisMonth));

  const newSubscriptionsThisMonth = newSubsResult?.count || 0;

  // Calculate monthly recurring revenue (MRR)
  const [monthlyResult] = await db
    .select({
      total: sum(sql`CASE WHEN ${subscriptions.billingCycle} = 'monthly' THEN ${subscriptions.price} ELSE ${subscriptions.price} / 12 END`),
    })
    .from(subscriptions)
    .where(sql`${subscriptions.status} = 'active'`);

  const monthlyRecurring = Number(monthlyResult?.total) || 0;

  // Annual recurring revenue
  const annualRecurring = monthlyRecurring * 12;

  // Revenue change (compare with last month)
  const [lastMonthRevenue] = await db
    .select({ total: sum(sql`CAST(${invoices.totalAmount} AS INTEGER)`) })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        sql`DATE_TRUNC('month', ${invoices.paidAt}) = DATE_TRUNC('month', ${startOfLastMonth})`
      )
    );

  const [thisMonthRevenue] = await db
    .select({ total: sum(sql`CAST(${invoices.totalAmount} AS INTEGER)`) })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        sql`DATE_TRUNC('month', ${invoices.paidAt}) = DATE_TRUNC('month', ${startOfThisMonth})`
      )
    );

  const lastMonthTotal = Number(lastMonthRevenue?.total) || 0;
  const thisMonthTotal = Number(thisMonthRevenue?.total) || 0;

  let revenueChange = 0;
  if (lastMonthTotal > 0) {
    revenueChange = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
  } else if (thisMonthTotal > 0) {
    revenueChange = 100;
  }

  // Invoice counts by status
  const [pendingResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.status, "pending"));

  const [paidResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.status, "paid"));

  const [overdueResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.status, "overdue"));

  return {
    totalRevenue,
    revenueChange,
    activeSubscriptions,
    newSubscriptionsThisMonth,
    monthlyRecurring,
    annualRecurring,
    pendingInvoices: pendingResult?.count || 0,
    paidInvoices: paidResult?.count || 0,
    overdueInvoices: overdueResult?.count || 0,
  };
}

/**
 * Get monthly revenue data for the last 12 months
 */
async function getMonthlyRevenueData(): Promise<MonthlyRevenueData[]> {
  const twelveMonthsAgo = getDateMonthsAgo(12);

  const revenueByMonth = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${invoices.paidAt})`,
      revenue: sum(sql`CAST(${invoices.totalAmount} AS INTEGER)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        sql`${invoices.paidAt} >= ${twelveMonthsAgo}`
      )
    )
    .groupBy(sql`DATE_TRUNC('month', ${invoices.paidAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${invoices.paidAt})`);

  // Generate all 12 months (fill missing with 0)
  const monthlyRevenue: MonthlyRevenueData[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM

    const monthData = revenueByMonth.find((m) => {
      const monthStr = String(m.month);
      return monthStr.startsWith(monthKey);
    });

    monthlyRevenue.push({
      month: getMonthAbbr(date),
      revenue: Number(monthData?.revenue) || 0,
    });
  }

  return monthlyRevenue;
}

/**
 * Get revenue breakdown by plan type
 */
async function getRevenueByPlan(): Promise<PlanRevenueBreakdown[]> {
  const revenueByPlan = await db
    .select({
      planName: subscriptionPlans.name,
      planId: subscriptionPlans.id,
      totalRevenue: sum(subscriptions.price),
      subscriptionCount: count(),
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(sql`${subscriptions.status} = 'active' OR ${subscriptions.status} = 'trialing'`)
    .groupBy(subscriptionPlans.id, subscriptionPlans.name)
    .orderBy(desc(sum(subscriptions.price)));

  const totalRevenue = revenueByPlan.reduce((sum, item) => sum + Number(item.totalRevenue), 0);

  return revenueByPlan.map((item) => ({
    planName: item.planName,
    totalRevenue: Number(item.totalRevenue) || 0,
    subscriptionCount: item.subscriptionCount,
    percentage: calculatePercentage(Number(item.totalRevenue) || 0, totalRevenue),
  }));
}

/**
 * Get school subscriptions with filtering
 */
async function getSchoolSubscriptions(req: NextRequest): Promise<SchoolSubscriptionData[]> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "100");

  // Build conditions
  const conditions = [];

  if (status) {
    conditions.push(eq(subscriptions.status, status));
  }

  if (plan) {
    conditions.push(eq(subscriptionPlans.id, plan));
  }

  if (search) {
    conditions.push(
      sql`${tenants.name} ILIKE ${`%${search}%`} OR ${schools.name} ILIKE ${`%${search}%`}`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const subscriptionData = await db
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
      maxStudents: subscriptions.maxStudents,
      maxTeachers: subscriptions.maxTeachers,
      currentStudents: subscriptions.currentStudents,
      currentTeachers: subscriptions.currentTeachers,
      // Plan info
      planId: subscriptionPlans.id,
      planName: subscriptionPlans.name,
      // Tenant/School info
      tenantId: tenants.id,
      tenantName: tenants.name,
      schoolName: schools.name,
      schoolCode: schools.code,
    })
    .from(subscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
    .leftJoin(schools, eq(schools.tenantId, tenants.id))
    .where(whereClause)
    .orderBy(desc(subscriptions.createdAt))
    .limit(limit);

  return subscriptionData.map((sub) => ({
    id: sub.id,
    schoolName: sub.schoolName || sub.tenantName || "Unknown",
    schoolCode: sub.schoolCode || "",
    plan: sub.planName?.toLowerCase() || "unknown",
    planPrice: sub.price || 0,
    status: sub.status,
    students: sub.currentStudents || 0,
    teachers: sub.currentTeachers || 0,
    startDate: sub.startDate?.toISOString() || new Date().toISOString(),
    renewalDate: sub.currentPeriodEnd?.toISOString() || sub.endDate?.toISOString() || new Date().toISOString(),
    totalPaid: sub.price || 0,
    isTrial: sub.isTrial || false,
    autoRenew: sub.autoRenew || false,
  }));
}

/**
 * Get invoices with filtering
 */
async function getInvoices(req: NextRequest): Promise<InvoiceData[]> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");

  const conditions: (SQL | undefined)[] = [];

  if (status) {
    conditions.push(eq(invoices.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions.filter(Boolean) as SQL[]) : undefined;

  const invoiceData = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      amount: invoices.totalAmount,
      currency: invoices.currency,
      status: invoices.status,
      pdfUrl: invoices.pdfUrl,
      // Related data
      planName: subscriptionPlans.name,
      tenantName: tenants.name,
      schoolName: schools.name,
    })
    .from(invoices)
    .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
    .leftJoin(schools, eq(schools.tenantId, tenants.id))
    .where(whereClause)
    .orderBy(desc(invoices.invoiceDate))
    .limit(limit);

  return invoiceData.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || "",
    school: inv.schoolName || inv.tenantName || "Unknown",
    plan: inv.planName || "Unknown",
    amount: Number(inv.amount) || 0,
    currency: inv.currency,
    status: inv.status,
    dueDate: inv.dueDate?.toISOString() || new Date().toISOString(),
    paidDate: inv.paidAt?.toISOString() || null,
    pdfUrl: inv.pdfUrl,
  }));
}

/**
 * Get payment methods (platform level)
 */
async function getPaymentMethods(): Promise<PaymentMethodData[]> {
  // Return platform payment gateways (not tenant-specific methods)
  // In a real implementation, these would be configured at platform level
  return [
    {
      id: "rma-gateway",
      type: "rma",
      provider: "Royal Monetary Authority",
      isActive: true,
      isDefault: true,
      displayInfo: "Bhutan's national payment gateway",
    },
    {
      id: "stripe-gateway",
      type: "card",
      provider: "Stripe",
      isActive: true,
      isDefault: false,
      displayInfo: "International card payments",
    },
  ];
}

// ============================================================================
// POST HANDLER - Generate Invoice
// ============================================================================

/**
 * Generate a new invoice for a subscription
 * POST /api/ministry/billing
 * Body: { subscriptionId, periodStart, periodEnd }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate and authorize - only ministry/admin can generate invoices
    const authResult = await requireAuth(["ministry", "admin"]);
    if ("error" in authResult) {
      logger.security("unauthorized_invoice_generation_attempt", {
        route: "/api/ministry/billing",
        method: "POST",
      });
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Parse request body
    const body = await req.json() as {
      subscriptionId?: string;
      periodStart?: string;
      periodEnd?: string;
    };

    if (!body.subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    logger.info("Invoice generation requested", {
      route: "/api/ministry/billing",
      method: "POST",
      userId,
      subscriptionId: body.subscriptionId,
    });

    // Get subscription details
    const [subscriptionData] = await db
      .select({
        id: subscriptions.id,
        tenantId: subscriptions.tenantId,
        planId: subscriptions.planId,
        price: subscriptions.price,
        currency: subscriptions.currency,
        billingCycle: subscriptions.billingCycle,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        maxStudents: subscriptions.maxStudents,
        maxTeachers: subscriptions.maxTeachers,
        currentStudents: subscriptions.currentStudents,
        currentTeachers: subscriptions.currentTeachers,
        planName: subscriptionPlans.name,
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.id, body.subscriptionId))
      .limit(1);

    if (!subscriptionData) {
      return NextResponse.json(
        { error: "Subscription not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Get tenant info
    const [tenantInfo] = await db
      .select({
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, subscriptionData.tenantId))
      .limit(1);

    // Check if invoice already exists for this period
    const periodStart = body.periodStart ? new Date(body.periodStart) : subscriptionData.currentPeriodStart;
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : subscriptionData.currentPeriodEnd;

    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.subscriptionId, body.subscriptionId),
          sql`${invoices.periodStart} >= ${periodStart}`,
          sql`${invoices.periodEnd} <= ${periodEnd}`
        )
      )
      .limit(1);

    if (existingInvoice) {
      return NextResponse.json({
        data: {
          invoice: {
            id: existingInvoice.id,
            invoiceNumber: existingInvoice.invoiceNumber,
            amount: Number(existingInvoice.totalAmount),
            currency: existingInvoice.currency,
            status: existingInvoice.status,
            dueDate: existingInvoice.dueDate?.toISOString(),
            pdfUrl: existingInvoice.pdfUrl,
          },
          message: "Invoice already exists for this period",
        },
      } satisfies ApiSuccess<unknown>);
    }

    // Generate invoice number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Get invoice count for this month
    const [invoiceCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(sql`TO_CHAR(${invoices.invoiceDate}, 'YYYY-MM') = '${year}-${month}'`);

    const sequenceNumber = String((invoiceCount?.count ?? 0) + 1).padStart(3, "0");
    const invoiceNumber = `INV-${year}${month}-${sequenceNumber}`;

    // Calculate amounts
    const subtotal = subscriptionData.price;
    const gstRate = 7; // 7% GST for Bhutan
    const taxAmount = Math.round((subtotal * gstRate) / 100);
    const totalAmount = subtotal + taxAmount;

    // Calculate due date (30 days from invoice date)
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    // Create line items
    const lineItems = [
      {
        description: `${subscriptionData.planName} Subscription (${subscriptionData.billingCycle})`,
        quantity: 1,
        unitPrice: subscriptionData.price,
        amount: subscriptionData.price,
      },
    ];

    // Add student/teacher overages if applicable
    if (subscriptionData.currentStudents && subscriptionData.maxStudents && subscriptionData.currentStudents > subscriptionData.maxStudents) {
      const overageStudents = subscriptionData.currentStudents - subscriptionData.maxStudents;
      const overageCost = overageStudents * 500; // BTN 5 per student per month (in cents)
      lineItems.push({
        description: `Student overage (${overageStudents} students × BTN 5/month)`,
        quantity: overageStudents,
        unitPrice: 500,
        amount: overageCost,
      });
    }

    // Create invoice
    const invoiceId = `invoice-${nanoid()}`;

    await db.insert(invoices).values({
      id: invoiceId,
      subscriptionId: body.subscriptionId,
      tenantId: subscriptionData.tenantId,
      invoiceNumber,
      invoiceDate: now,
      periodStart,
      periodEnd,
      amount: subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      currency: subscriptionData.currency,
      status: "pending",
      dueDate,
      lineItems,
      notes: `Invoice for ${tenantInfo?.name || "School"} - ${subscriptionData.planName} subscription`,
      createdAt: now,
      updatedAt: now,
    });

    const duration = Date.now() - startTime;
    logger.info("Invoice generated successfully", {
      userId,
      duration: `${duration}ms`,
      invoiceId,
      invoiceNumber,
      subscriptionId: body.subscriptionId,
    });

    return NextResponse.json({
      data: {
        invoice: {
          id: invoiceId,
          invoiceNumber,
          amount: totalAmount,
          currency: subscriptionData.currency,
          status: "pending",
          dueDate: dueDate.toISOString(),
          subtotal,
          taxAmount,
          lineItems,
        },
      },
    } satisfies ApiSuccess<unknown>);

  } catch (error) {
    logger.apiError(error, { route: "/api/ministry/billing", method: "POST" });

    return NextResponse.json(
      {
        error: "Failed to generate invoice",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER - Generate Invoice PDF (Basic Implementation)
// ============================================================================

/**
 * Generate a printable invoice HTML
 */
function generateInvoiceHtml(invoice: InvoiceData, schoolName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1f2937;
          line-height: 1.5;
          padding: 40px;
          background: #f9fafb;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 24px;
          border-bottom: 2px solid #8b5cf6;
          margin-bottom: 24px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
        }
        .invoice-number {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .invoice-meta {
          text-align: right;
        }
        .invoice-meta div {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .invoice-meta strong {
          color: #1f2937;
        }
        .bill-to {
          margin-bottom: 24px;
        }
        .bill-to h3 {
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }
        .bill-to p {
          font-size: 16px;
          color: #1f2937;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .table th {
          text-align: left;
          padding: 12px;
          background: #f3f4f6;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }
        .table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .table td.text-right {
          text-align: right;
        }
        .totals {
          width: 300px;
          margin-left: auto;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .total-row.final {
          border-top: 2px solid #e5e7eb;
          padding-top: 12px;
          margin-top: 8px;
          font-size: 18px;
          font-weight: 700;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status.paid {
          background: #d1fae5;
          color: #065f46;
        }
        .status.pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status.overdue {
          background: #fee2e2;
          color: #991b1b;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">${invoice.invoiceNumber}</div>
          </div>
          <div class="invoice-meta">
            <div><strong>Date:</strong> ${formatDate(invoice.dueDate)}</div>
            <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
            <div><strong>Status:</strong> <span class="status ${invoice.status}">${invoice.status}</span></div>
          </div>
        </div>

        <div class="bill-to">
          <h3>Bill To</h3>
          <p>${schoolName}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.plan} Subscription</td>
              <td class="text-right">1</td>
              <td class="text-right">${formatCurrency(invoice.amount / 1200, invoice.currency)}</td>
              <td class="text-right">${formatCurrency(invoice.amount / 100, invoice.currency)}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${formatCurrency(invoice.amount / 100, invoice.currency)}</span>
          </div>
          <div class="total-row">
            <span>GST (7%)</span>
            <span>${formatCurrency(invoice.amount * 0.07 / 100, invoice.currency)}</span>
          </div>
          <div class="total-row final">
            <span>Total</span>
            <span>${formatCurrency(invoice.amount * 1.07 / 100, invoice.currency)}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Bhutan EduSkill Platform</strong></p>
          <p>Ministry of Education, Royal Government of Bhutan</p>
          <p>This is a computer-generated invoice. No signature required.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to format dates in invoice HTML
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-BT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper function to format currency in invoice HTML
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-BT", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Import nanoid for ID generation
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
