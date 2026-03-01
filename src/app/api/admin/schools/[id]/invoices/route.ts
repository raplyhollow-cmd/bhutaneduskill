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

    // Calculate amount based on tier (matching database tier names: basic, standard, premium)
    const tierPricing: Record<string, number> = {
      basic: 5000,    // Small - Up to 100 students
      standard: 10000, // Medium - Up to 500 students
      premium: 20000,  // Large - Up to 1000 students
    };
    const tier = school.subscriptionTier || 'standard';
    const amount = tierPricing[tier] || 10000;

    // Calculate billing period (annual: Jan 1 to Dec 31 of current year)
    const currentYear = new Date().getFullYear();
    const startDate = billingPeriodStart ? new Date(billingPeriodStart) : new Date(currentYear, 0, 1); // January 1
    const endDate = billingPeriodEnd ? new Date(billingPeriodEnd) : new Date(currentYear, 11, 31); // December 31

    // Due date for payment is 30 days from invoice date (not billing period end)
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30); // Net 30 days

    // Create invoice
    await db
      .insert(invoices)
      .values({
        id: `inv_${nanoid()}`,
        invoiceNumber,
        schoolId: school.id,
        subscriptionTier: tier,
        amount: String(amount),
        taxAmount: "0",
        discountAmount: "0",
        totalAmount: String(amount),
        currency: 'BTN',
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        status: 'sent',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Fetch the created invoice using select (more reliable than .returning() with neon-http)
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1);

    logger.info('Invoice generated', {
      invoiceId: invoice?.id,
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
