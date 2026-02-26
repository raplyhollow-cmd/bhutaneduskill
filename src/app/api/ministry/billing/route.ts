/**
 * MINISTRY BILLING OVERVIEW API
 * GET /api/ministry/billing - Fetch platform billing and revenue data (view-only)
 * POST /api/ministry/billing - Generate a new invoice for a school
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
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

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  invoices,
  schools,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, sql, count, sum, gte, SQL, inArray } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, createdResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

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

/**
 * Generate unique ID for invoices
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// GET HANDLER
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    logger.info("Ministry billing data requested", { route: "/api/ministry/billing", userId });

    // Fetch all billing data in parallel
    const [
      statistics,
      monthlyRevenue,
      revenueByPlan,
      subscriptions,
      invoicesData,
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
      invoices: invoicesData,
      paymentMethods,
      currency: {
        code: "BTN",
        symbol: "Nu.",
        gstRate: 7,
      },
      generatedAt: new Date().toISOString(),
    };

    logger.info("Ministry billing data retrieved successfully", {
      userId,
      subscriptionCount: subscriptions.length,
      invoiceCount: invoicesData.length,
    });

    return successResponse(response);
  },
  ['ministry', 'admin']
);

// ============================================================================
// POST HANDLER - Generate Invoice
// ============================================================================

/**
 * Generate a new invoice for a school
 * POST /api/ministry/billing
 * Body: { schoolId, amount, periodStart, periodEnd }
 */
export const POST = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Parse request body
    const body = await req.json() as {
      schoolId?: string;
      amount?: number;
      subscriptionTier?: string;
      periodStart?: string;
      periodEnd?: string;
    };

    if (!body.schoolId) {
      return badRequestResponse("schoolId is required");
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
      return notFoundResponse("School");
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
      return successResponse({
        invoice: {
          id: existingInvoice.id,
          invoiceNumber: existingInvoice.invoiceNumber,
          amount: Number(existingInvoice.totalAmount),
          currency: existingInvoice.currency,
          status: existingInvoice.status,
          dueDate: existingInvoice.dueDate?.toISOString(),
        },
        message: "Invoice already exists for this period",
      });
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
    const invoiceId = `invoice-${generateId()}`;

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

    logger.info("Invoice generated successfully", {
      userId,
      invoiceId,
      invoiceNumber,
      schoolId: body.schoolId,
    });

    return createdResponse({
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
    });
  },
  ['ministry', 'admin']
);

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

/**
 * Get revenue statistics
 * FIXED: Now calculates actual active subscriptions based on real school data
 */
async function getRevenueStatistics(): Promise<RevenueStatistics> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Active schools count (actual active subscriptions)
  const [activeSchoolsResult] = await db
    .select({ count: count() })
    .from(schools)
    .where(eq(schools.isActive, true));

  const activeSubscriptions = activeSchoolsResult?.count || 0;

  // Total revenue from all paid invoices
  const [totalRevenueResult] = await db
    .select({
      totalRevenue: sum(invoices.totalAmount),
    })
    .from(invoices)
    .where(eq(invoices.status, "paid"));

  const totalRevenue = Number(totalRevenueResult?.totalRevenue) || 0;

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
 * FIXED: Now calculates actual student and teacher counts per school
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

  const schoolIds = schoolData.map(s => s.id);

  // Get actual student and teacher counts per school in batch
  type UserCountRow = { schoolId: string | null; studentCount: number; teacherCount: number };
  const userCountsMap = new Map<string, { students: number; teachers: number }>();

  if (schoolIds.length > 0) {
    const userCounts = await db
      .select({
        schoolId: users.schoolId,
        studentCount: sql<number>`COUNT(*) FILTER (WHERE type = 'student')`,
        teacherCount: sql<number>`COUNT(*) FILTER (WHERE type = 'teacher')`,
      })
      .from(users)
      .where(inArray(users.schoolId, schoolIds))
      .groupBy(users.schoolId);

    for (const row of userCounts) {
      if (row.schoolId) {
        userCountsMap.set(row.schoolId, {
          students: row.studentCount || 0,
          teachers: row.teacherCount || 0,
        });
      }
    }
  }

  // Get latest invoice for each school to determine pricing and payment status
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
    const counts = userCountsMap.get(school.id) || { students: 0, teachers: 0 };

    return {
      id: school.id,
      schoolName: school.name || "Unknown",
      schoolCode: school.code || "",
      plan: school.subscriptionTier || invoice?.subscriptionTier || "unknown",
      planPrice: Number(invoice?.totalAmount) || 0,
      status: school.subscriptionStatus || "unknown",
      students: counts.students,
      teachers: counts.teachers,
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
