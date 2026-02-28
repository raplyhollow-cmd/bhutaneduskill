import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { schools, invoices } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// GET /api/admin/schools/[id]/invoices - Get all invoices for a school
export const GET = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId: adminId } = auth;
    const { id: schoolId } = await (context?.params || Promise.resolve({ id: "" }));

    const schoolInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.schoolId, schoolId))
      .orderBy(desc(invoices.createdAt));

    return { data: schoolInvoices };
  },
  ["admin"]
);

// POST /api/admin/schools/[id]/invoices - Generate a new invoice
export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId: adminId } = auth;
    const { id: schoolId } = await (context?.params || Promise.resolve({ id: "" }));

    const body = await req.json();
    const { billingPeriodStart, billingPeriodEnd } = body;

    // Get school details
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    if (!school) {
      return { error: 'School not found', status: 404 };
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

    return { data: invoice };
  },
  ["admin"]
);
