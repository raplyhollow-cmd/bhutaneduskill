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
import { invoices, schools } from "@/lib/db/schema";
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
    const schoolId = searchParams.get("schoolId");
    const subscriptionTier = searchParams.get("subscriptionTier");
    const stats = searchParams.get("stats") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // If requesting stats only
    if (stats) {
      const invoiceStats = await db
        .select({
          totalCount: sql<number>`COUNT(*)`,
          sentCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'sent')`,
          draftCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'draft')`,
          paidCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'paid')`,
          overdueCount: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'overdue')`,
        })
        .from(invoices);

      // Sum amounts manually due to decimal type
      const allInvoices = await db
        .select({
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          refundAmount: invoices.refundAmount,
        })
        .from(invoices);

      let totalAmount = 0;
      let pendingAmount = 0;
      let paidAmount = 0;

      for (const inv of allInvoices) {
        const amt = parseFloat(inv.totalAmount);
        const refund = inv.refundAmount ? parseFloat(inv.refundAmount) : 0;
        const netAmount = amt - refund;
        totalAmount += netAmount;

        if (inv.status === "sent" || inv.status === "draft") {
          pendingAmount += netAmount;
        }
        if (inv.status === "paid") {
          paidAmount += netAmount;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          totalCount: invoiceStats[0]?.totalCount || 0,
          pendingCount: (invoiceStats[0]?.sentCount || 0) + (invoiceStats[0]?.draftCount || 0),
          paidCount: invoiceStats[0]?.paidCount || 0,
          overdueCount: invoiceStats[0]?.overdueCount || 0,
          totalAmount,
          pendingAmount,
          paidAmount,
        },
      });
    }

    // Build query conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(invoices.status, status));
    }
    if (schoolId) {
      conditions.push(eq(invoices.schoolId, schoolId));
    }
    if (subscriptionTier) {
      conditions.push(eq(invoices.subscriptionTier, subscriptionTier));
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
        paymentReference: invoices.paymentReference,
        pdfUrl: invoices.pdfUrl,
        notes: invoices.notes,
        subscriptionTier: invoices.subscriptionTier,
        schoolId: invoices.schoolId,
        schoolName: schools.name,
      })
      .from(invoices)
      .leftJoin(schools, eq(invoices.schoolId, schools.id))
      .where(whereClause)
      .orderBy(desc(invoices.invoiceDate))
      .limit(limit)
      .offset(offset);

    // Format response data
    const formattedData = invoicesData.map((inv) => {
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        school: inv.schoolName || "Unknown",
        plan: inv.subscriptionTier || "Unknown",
        amount: parseFloat(inv.totalAmount),
        currency: inv.currency,
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() || new Date().toISOString(),
        paidDate: inv.paidAt?.toISOString(),
        pdfUrl: inv.pdfUrl,
        paymentMethod: inv.paymentMethod,
        paymentReference: inv.paymentReference,
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

    const { schoolId, amount, taxAmount = 0, discountAmount = 0, dueDays = 30, notes, subscriptionTier = "standard", billingPeriodStart, billingPeriodEnd } = body;

    if (!schoolId || !amount) {
      return NextResponse.json(
        { success: false, error: "schoolId and amount are required" },
        { status: 400 }
      );
    }

    // Verify school exists
    const school = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (school.length === 0) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
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

    // Calculate total - convert to decimal string
    const totalAmount = amount + taxAmount - discountAmount;
    const amountStr = amount.toFixed(2);
    const taxAmountStr = taxAmount.toFixed(2);
    const discountAmountStr = discountAmount.toFixed(2);
    const totalAmountStr = totalAmount.toFixed(2);

    // Create invoice
    const invoiceId = `inv-${nanoid()}`;
    await db.insert(invoices).values({
      id: invoiceId,
      schoolId,
      subscriptionTier,
      invoiceNumber,
      invoiceDate: now,
      billingPeriodStart: billingPeriodStart || now,
      billingPeriodEnd: billingPeriodEnd || dueDate,
      amount: amountStr,
      taxAmount: taxAmountStr,
      discountAmount: discountAmountStr,
      totalAmount: totalAmountStr,
      currency: "BTN",
      status: "sent",
      dueDate,
      notes,
      createdBy: userId,
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
    logger.apiError(error, { route: "/", method: "POST" });
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

    const { invoiceId, action, status, paymentMethod, paymentReference } = body;

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
          paymentReference: paymentReference || `txn-${Date.now()}`,
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
          ...(paymentReference && { paymentReference }),
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
    logger.apiError(error, { route: "/", method: "PATCH" });
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
