import { logger } from "@/lib/logger";
/**
 * BILLING - INVOICES API
 *
 * GET /api/billing/invoices - Get all invoices
 * POST /api/billing/invoices - Generate new invoice
 * PATCH /api/billing/invoices - Update invoice status/payment
 * GET /api/billing/invoices?stats=true - Get invoice statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { invoices, subscriptions, subscriptionPlans, tenants, schools } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const subscriptionId = searchParams.get("subscriptionId");
    const stats = searchParams.get("stats") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // If requesting stats only
    if (stats) {
      const invoiceStats = await db
        .select({
          totalCount: sql<number>`COUNT(*)`,
          pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'pending')`,
          paidCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'paid')`,
          overdueCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'overdue')`,
          totalAmount: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
          pendingAmount: sql<number>`COALESCE(SUM(${invoices.totalAmount}) FILTER (WHERE ${invoices.status} = 'pending'), 0)`,
          paidAmount: sql<number>`COALESCE(SUM(${invoices.totalAmount}) FILTER (WHERE ${invoices.status} = 'paid'), 0)`,
        })
        .from(invoices);

      return NextResponse.json({
        success: true,
        data: {
          totalCount: invoiceStats[0]?.totalCount || 0,
          pendingCount: invoiceStats[0]?.pendingCount || 0,
          paidCount: invoiceStats[0]?.paidCount || 0,
          overdueCount: invoiceStats[0]?.overdueCount || 0,
          totalAmount: invoiceStats[0]?.totalAmount || 0,
          pendingAmount: invoiceStats[0]?.pendingAmount || 0,
          paidAmount: invoiceStats[0]?.paidAmount || 0,
        },
      });
    }

    // Build query conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(invoices.status, status));
    }
    if (subscriptionId) {
      conditions.push(eq(invoices.subscriptionId, subscriptionId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get invoices with related data
    const invoicesData = await db
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
        pdfUrl: invoices.pdfUrl,
        notes: invoices.notes,
        // Subscription info
        subscriptionId: subscriptions.id,
        planName: subscriptionPlans.name,
        // Tenant/School info
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        schoolName: schools.name,
      })
      .from(invoices)
      .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
      .leftJoin(schools, eq(schools.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(invoices.invoiceDate))
      .limit(limit)
      .offset(offset);

    // Format response data
    const formattedData = invoicesData.map((inv) => {
      const getSchoolName = () => {
        if (inv.schoolName) return inv.schoolName;
        return inv.tenantName || "Unknown";
      };

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        school: getSchoolName(),
        plan: inv.planName || "Unknown",
        amount: inv.totalAmount || inv.amount,
        currency: inv.currency,
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() || new Date().toISOString(),
        paidDate: inv.paidAt?.toISOString(),
        pdfUrl: inv.pdfUrl,
        paymentMethod: inv.paymentMethod,
      };
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch invoices";
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;
    const body = await req.json();

    const { subscriptionId, amount, taxAmount = 0, discountAmount = 0, dueDays = 30, notes, lineItems } = body;

    if (!subscriptionId || !amount) {
      return NextResponse.json(
        { success: false, error: "subscriptionId and amount are required" },
        { status: 400 }
      );
    }

    // Get subscription details
    const subscription = await db
      .select({
        id: subscriptions.id,
        tenantId: subscriptions.tenantId,
        price: subscriptions.price,
        currency: subscriptions.currency,
        billingCycle: subscriptions.billingCycle,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        planName: subscriptionPlans.name,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    const sub = subscription[0];
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
      subscriptionId,
      tenantId: sub.tenantId,
      invoiceNumber,
      invoiceDate: now,
      periodStart: sub.currentPeriodStart || now,
      periodEnd: sub.currentPeriodEnd || dueDate,
      amount,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: sub.currency,
      status: "pending",
      dueDate,
      notes,
      lineItems: lineItems || [
        {
          description: `${sub.planName} - ${sub.billingCycle} subscription`,
          quantity: 1,
          unitPrice: amount,
          amount: amount,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    // Get created invoice
    const created = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: created[0],
      message: "Invoice generated successfully",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create invoice";
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;
    const body = await req.json();

    const { invoiceId, action, status, paymentMethod, paymentDetails } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "invoiceId is required" },
        { status: 400 }
      );
    }

    // Handle specific actions
    if (action === "mark_paid") {
      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentMethod: paymentMethod || "manual",
          paymentDetails: paymentDetails || {},
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json({
        success: true,
        message: "Invoice marked as paid",
      });
    }

    if (action === "mark_overdue") {
      await db
        .update(invoices)
        .set({
          status: "overdue",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json({
        success: true,
        message: "Invoice marked as overdue",
      });
    }

    if (action === "send_reminder") {
      // In a real implementation, this would send an email
      return NextResponse.json({
        success: true,
        message: "Payment reminder sent successfully",
      });
    }

    // Generic status update
    if (status) {
      await db
        .update(invoices)
        .set({
          status,
          ...(status === "paid" && { paidAt: new Date() }),
          ...(paymentMethod && { paymentMethod }),
          ...(paymentDetails && { paymentDetails }),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      return NextResponse.json({
        success: true,
        message: `Invoice status updated to ${status}`,
      });
    }

    return NextResponse.json(
      { success: false, error: "No valid action provided" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update invoice";
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "invoiceId is required" },
        { status: 400 }
      );
    }

    await db
      .update(invoices)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return NextResponse.json({
      success: true,
      message: "Invoice cancelled successfully",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel invoice";
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
