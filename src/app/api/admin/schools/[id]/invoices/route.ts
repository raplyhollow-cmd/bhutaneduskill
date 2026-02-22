import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, invoices, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// GET /api/admin/schools/[id]/invoices - Get all invoices for a school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId: adminId } = authResult;
  const { id: schoolId } = await params;

  try {
    const schoolInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.schoolId, schoolId))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({
      data: schoolInvoices,
    } satisfies ApiSuccess<typeof schoolInvoices>);

  } catch (error) {
    logger.apiError(error, { route: `/api/admin/schools/${schoolId}/invoices`, method: 'GET', adminId });
    return NextResponse.json(
      { error: 'Failed to fetch invoices', status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// POST /api/admin/schools/[id]/invoices - Generate a new invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId: adminId } = authResult;
  const { id: schoolId } = await params;

  try {
    const body = await request.json();
    const { billingPeriodStart, billingPeriodEnd } = body;

    // Get school details
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!school) {
      return NextResponse.json(
        { error: 'School not found', status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await db
      .select()
      .from(invoices)
      .where(eq(invoices.schoolId, schoolId))
      .then(invs => invs.length + 1);

    const invoiceNumber = `INV-${year}-${String(count).padStart(4, '0')}`;

    // Calculate amount based on tier
    const tierPricing = {
      small: 5000,
      medium: 10000,
      large: 20000,
    };
    const amount = tierPricing[school.subscriptionTier as keyof typeof tierPricing] || 10000;

    // Calculate billing period (1 year from now)
    const startDate = billingPeriodStart ? new Date(billingPeriodStart) : new Date();
    const endDate = billingPeriodEnd ? new Date(billingPeriodEnd) : new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Create invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        id: `inv_${nanoid()}`,
        invoiceNumber,
        schoolId: school.id,
        subscriptionTier: school.subscriptionTier || 'standard',
        amount: String(amount),
        taxAmount: "0",
        discountAmount: "0",
        totalAmount: String(amount),
        currency: 'BTN',
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
        invoiceDate: new Date(),
        dueDate: endDate,
        status: 'sent',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info('Invoice generated', {
      invoiceId: invoice.id,
      invoiceNumber,
      schoolId: school.id,
      schoolName: school.name,
      amount,
      createdBy: adminId,
    });

    return NextResponse.json({
      data: invoice,
    } satisfies ApiSuccess<typeof invoice>);

  } catch (error) {
    logger.apiError(error, { route: `/api/admin/schools/${schoolId}/invoices`, method: 'POST', adminId });
    return NextResponse.json(
      { error: 'Failed to generate invoice', status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
