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
  invoices,
  schools,
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

  // Active schools (as proxy for active subscriptions)
  const [activeSchoolsResult] = await db
    .select({
      count: count(),
      totalRevenue: sum(invoices.totalAmount),
    })
    .from(schools)
    .innerJoin(invoices, eq(schools.id, invoices.schoolId))
    .where(eq(schools.isActive, true));

  const activeSubscriptions = activeSchoolsResult?.count || 0;
  const totalRevenue = Number(activeSchoolsResult?.totalRevenue) || 0;

  // New subscriptions (schools) this month
  const [newSchoolsResult] = await db
    .select({ count: count() })
    .from(schools)
    .where(gte(schools.createdAt, startOfThisMonth));

  const newSubscriptionsThisMonth = newSchoolsResult?.count || 0;

  // Calculate monthly recurring revenue from paid invoices this month
  const [monthlyResult] = await db
    .select({
      total: sum(invoices.totalAmount),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, startOfThisMonth)
      )
    );

  const monthlyRecurring = Number(monthlyResult?.total) || 0;

  // Annual recurring revenue (projected)
  const annualRecurring = monthlyRecurring * 12;

  // Revenue change (compare with last month)
  const [lastMonthRevenue] = await db
    .select({ total: sum(invoices.totalAmount) })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        sql`DATE_TRUNC('month', ${invoices.paidAt}) = DATE_TRUNC('month', ${startOfLastMonth})`
      )
    );

  const [thisMonthRevenue] = await db
    .select({ total: sum(invoices.totalAmount) })
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
      revenue: sum(invoices.totalAmount),
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
 * Get revenue breakdown by plan type (subscription tier)
 */
async function getRevenueByPlan(): Promise<PlanRevenueBreakdown[]> {
  const revenueByPlan = await db
    .select({
      planName: invoices.subscriptionTier,
      totalRevenue: sum(invoices.totalAmount),
      subscriptionCount: count(),
    })
    .from(invoices)
    .where(eq(invoices.status, "paid"))
    .groupBy(invoices.subscriptionTier)
    .orderBy(desc(sum(invoices.totalAmount)));

  const totalRevenue = revenueByPlan.reduce((sum, item) => sum + Number(item.totalRevenue), 0);

  return revenueByPlan.map((item) => ({
    planName: item.planName || "Unknown",
    totalRevenue: Number(item.totalRevenue) || 0,
    subscriptionCount: item.subscriptionCount,
    percentage: calculatePercentage(Number(item.totalRevenue) || 0, totalRevenue),
  }));
}

/**
 * Get school subscriptions with filtering
 * Uses school data and recent invoices to derive subscription information
 */
async function getSchoolSubscriptions(req: NextRequest): Promise<SchoolSubscriptionData[]> {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "100");

  // Build conditions
  const conditions: (SQL | undefined)[] = [];

  if (status) {
    conditions.push(eq(schools.subscriptionStatus, status));
  }

  if (plan) {
    conditions.push(eq(schools.subscriptionTier, plan));
  }

  if (search) {
    conditions.push(
      sql`${schools.name} ILIKE ${`%${search}%`}`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions.filter(Boolean) as SQL[]) : undefined;

  const schoolData = await db
    .select({
      id: schools.id,
      name: schools.name,
      code: schools.code,
      subscriptionStatus: schools.subscriptionStatus,
      subscriptionTier: schools.subscriptionTier,
      activatedAt: schools.activatedAt,
      isActive: schools.isActive,
      maxStudents: schools.maxStudents,
    })
    .from(schools)
    .where(whereClause)
    .orderBy(desc(schools.createdAt))
    .limit(limit);

  // Get latest invoice for each school to determine pricing and payment status
  const schoolIds = schoolData.map(s => s.id);
  const latestInvoices = schoolIds.length > 0 ? await db
    .select({
      schoolId: invoices.schoolId,
      subscriptionTier: invoices.subscriptionTier,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      billingPeriodStart: invoices.billingPeriodStart,
      billingPeriodEnd: invoices.billingPeriodEnd,
      invoiceDate: invoices.invoiceDate,
    })
    .from(invoices)
    .where(sql`${invoices.schoolId} = ANY(${schoolIds})`)
    .orderBy(desc(invoices.invoiceDate)) : [];

  // Create a map of latest invoice per school
  const invoiceMap = new Map<string, typeof latestInvoices[0]>();
  for (const invoice of latestInvoices) {
    if (!invoiceMap.has(invoice.schoolId)) {
      invoiceMap.set(invoice.schoolId, invoice);
    }
  }

  return schoolData.map((school) => {
    const invoice = invoiceMap.get(school.id);
    return {
      id: school.id,
      schoolName: school.name || "Unknown",
      schoolCode: school.code || "",
      plan: school.subscriptionTier || invoice?.subscriptionTier || "unknown",
      planPrice: Number(invoice?.totalAmount) || 0,
      status: school.subscriptionStatus || "unknown",
      students: 0, // Would need to query students table
      teachers: 0, // Would need to query teachers table
      startDate: school.activatedAt?.toISOString() || new Date().toISOString(),
      renewalDate: invoice?.billingPeriodEnd?.toISOString() || new Date().toISOString(),
      totalPaid: Number(invoice?.totalAmount) || 0,
      isTrial: school.subscriptionStatus === "trialing",
      autoRenew: true, // Default assumption
    };
  });
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
      subscriptionTier: invoices.subscriptionTier,
      schoolName: schools.name,
    })
    .from(invoices)
    .innerJoin(schools, eq(invoices.schoolId, schools.id))
    .where(whereClause)
    .orderBy(desc(invoices.invoiceDate))
    .limit(limit);

  return invoiceData.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || "",
    school: inv.schoolName || "Unknown",
    plan: inv.subscriptionTier || "Unknown",
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
 * Generate a new invoice for a school
 * POST /api/ministry/billing
 * Body: { schoolId, amount, periodStart, periodEnd }
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
      schoolId?: string;
      amount?: number;
      subscriptionTier?: string;
      periodStart?: string;
      periodEnd?: string;
    };

    if (!body.schoolId) {
      return NextResponse.json(
        { error: "schoolId is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    logger.info("Invoice generation requested", {
      route: "/api/ministry/billing",
      method: "POST",
      userId,
      schoolId: body.schoolId,
    });

    // Get school details
    const [schoolData] = await db
      .select({
        id: schools.id,
        name: schools.name,
        subscriptionTier: schools.subscriptionTier,
      })
      .from(schools)
      .where(eq(schools.id, body.schoolId))
      .limit(1);

    if (!schoolData) {
      return NextResponse.json(
        { error: "School not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Parse period dates
    const now = new Date();
    const periodStart = body.periodStart ? new Date(body.periodStart) : now;
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check if invoice already exists for this school and period
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.schoolId, body.schoolId),
          sql`${invoices.billingPeriodStart} = ${periodStart}`,
          sql`${invoices.billingPeriodEnd} = ${periodEnd}`
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
          },
          message: "Invoice already exists for this period",
        },
      } satisfies ApiSuccess<unknown>);
    }

    // Generate invoice number
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Get invoice count for this month
    const [invoiceCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(sql`TO_CHAR(${invoices.invoiceDate}, 'YYYY-MM') = '${year}-${month}'`);

    const sequenceNumber = String((invoiceCount?.count ?? 0) + 1).padStart(3, "0");
    const invoiceNumber = `INV-${year}${month}-${sequenceNumber}`;

    // Use provided amount or default based on tier
    const tier = body.subscriptionTier || schoolData.subscriptionTier || "basic";
    const tierPrices: Record<string, number> = {
      basic: 50000, // BTN 500
      standard: 100000, // BTN 1000
      premium: 200000, // BTN 2000
      enterprise: 500000, // BTN 5000
    };
    const subtotal = body.amount || tierPrices[tier] || 50000;

    // GST is 7% for Bhutan
    const gstRate = 7;
    const taxAmount = Math.round((subtotal * gstRate) / 100);
    const totalAmount = subtotal + taxAmount;

    // Calculate due date (30 days from invoice date)
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const invoiceId = `invoice-${nanoid()}`;

    await db.insert(invoices).values({
      id: invoiceId,
      invoiceNumber,
      schoolId: body.schoolId,
      subscriptionTier: tier,
      amount: String(subtotal),
      taxAmount: String(taxAmount),
      discountAmount: "0",
      totalAmount: String(totalAmount),
      currency: "BTN",
      invoiceDate: now,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      dueDate,
      status: "pending",
      paymentMethod: null,
      createdAt: now,
      updatedAt: now,
    });

    const duration = Date.now() - startTime;
    logger.info("Invoice generated successfully", {
      userId,
      duration: `${duration}ms`,
      invoiceId,
      invoiceNumber,
      schoolId: body.schoolId,
    });

    return NextResponse.json({
      data: {
        invoice: {
          id: invoiceId,
          invoiceNumber,
          amount: totalAmount,
          currency: "BTN",
          status: "pending",
          dueDate: dueDate.toISOString(),
          subtotal,
          taxAmount,
          subscriptionTier: tier,
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
