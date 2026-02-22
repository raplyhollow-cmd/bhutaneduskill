/**
 * MINISTRY INVOICE DOWNLOAD API
 * GET /api/ministry/billing/invoices/[invoiceId] - Generate and download invoice PDF
 *
 * Provides Ministry of Education with ability to generate and download invoice PDFs
 * This is a view-only feature - invoices are generated based on existing data
 *
 * Protected: Requires 'ministry' or 'admin' role
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import {
  invoices,
  schools,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceResponseData {
  id: string;
  invoiceNumber: string;
  school: string;
  schoolAddress: string;
  schoolEmail: string;
  schoolPhone: string;
  plan: string;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  paidDate: string | null;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  notes: string | null;
  pdfUrl: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
}

interface GeneratedInvoiceResponse {
  invoice: InvoiceResponseData;
  htmlContent?: string;
  printUrl?: string;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const startTime = Date.now();

  try {
    // Authenticate and authorize
    const authResult = await requireAuth(["ministry", "admin"]);
    if ("error" in authResult) {
      logger.security("unauthorized_invoice_download_attempt", {
        route: "/api/ministry/billing/invoices/[invoiceId]",
        method: "GET",
      });
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const { invoiceId } = await params;

    logger.info("Invoice PDF generation requested", {
      route: "/api/ministry/billing/invoices/[invoiceId]",
      method: "GET",
      userId,
      invoiceId,
    });

    // Fetch invoice with all related data
    const [invoiceData] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        paidAt: invoices.paidAt,
        billingPeriodStart: invoices.billingPeriodStart,
        billingPeriodEnd: invoices.billingPeriodEnd,
        amount: invoices.amount,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        status: invoices.status,
        notes: invoices.notes,
        pdfUrl: invoices.pdfUrl,
        paymentMethod: invoices.paymentMethod,
        paymentReference: invoices.paymentReference,
        subscriptionTier: invoices.subscriptionTier,
        // School data
        schoolId: schools.id,
        schoolName: schools.name,
        schoolAddress: schools.address,
        schoolCity: schools.city,
        schoolState: schools.state,
        schoolPostalCode: schools.postalCode,
        schoolEmail: schools.email,
        schoolPhone: schools.phone,
      })
      .from(invoices)
      .innerJoin(schools, eq(invoices.schoolId, schools.id))
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoiceData) {
      return NextResponse.json(
        { error: "Invoice not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Construct response - generate default line items since they don't exist in schema
    const defaultLineItems = [
      {
        description: `${invoiceData.subscriptionTier?.toUpperCase() || "STANDARD"} Plan Subscription - ${invoiceData.billingPeriodStart?.toISOString().split('T')[0]} to ${invoiceData.billingPeriodEnd?.toISOString().split('T')[0]}`,
        quantity: 1,
        unitPrice: Number(invoiceData.amount) || 0,
        amount: Number(invoiceData.amount) || 0,
      },
    ];

    const invoice: InvoiceResponseData = {
      id: invoiceData.id,
      invoiceNumber: invoiceData.invoiceNumber,
      school: invoiceData.schoolName || "Unknown",
      schoolAddress: `${invoiceData.schoolAddress || ""}, ${invoiceData.schoolCity || ""}, ${invoiceData.schoolState || ""} - ${invoiceData.schoolPostalCode || ""}`,
      schoolEmail: invoiceData.schoolEmail || "",
      schoolPhone: invoiceData.schoolPhone || "",
      plan: invoiceData.subscriptionTier || "Unknown",
      amount: Number(invoiceData.amount) || 0,
      taxAmount: Number(invoiceData.taxAmount) || 0,
      discountAmount: Number(invoiceData.discountAmount) || 0,
      totalAmount: Number(invoiceData.totalAmount) || 0,
      currency: invoiceData.currency || "BTN",
      status: invoiceData.status,
      invoiceDate: invoiceData.invoiceDate?.toISOString() || new Date().toISOString(),
      dueDate: invoiceData.dueDate?.toISOString() || new Date().toISOString(),
      paidDate: invoiceData.paidAt?.toISOString() || null,
      billingPeriodStart: invoiceData.billingPeriodStart?.toISOString() || new Date().toISOString(),
      billingPeriodEnd: invoiceData.billingPeriodEnd?.toISOString() || new Date().toISOString(),
      lineItems: defaultLineItems,
      notes: invoiceData.notes,
      pdfUrl: invoiceData.pdfUrl,
      paymentMethod: invoiceData.paymentMethod,
      paymentReference: invoiceData.paymentReference,
    };

    // If PDF already exists, return its URL
    if (invoiceData.pdfUrl) {
      const duration = Date.now() - startTime;
      logger.info("Invoice PDF URL retrieved", {
        userId,
        duration: `${duration}ms`,
        invoiceId,
        hasExistingPdf: true,
      });

      return NextResponse.json({
        data: {
          invoice,
          printUrl: invoiceData.pdfUrl,
        } satisfies GeneratedInvoiceResponse,
      } satisfies ApiSuccess<GeneratedInvoiceResponse>);
    }

    // Generate HTML invoice for printing
    const htmlContent = generateInvoiceHtml(invoice);

    // Create a data URL for the HTML content
    const printUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

    const duration = Date.now() - startTime;
    logger.info("Invoice HTML generated successfully", {
      userId,
      duration: `${duration}ms`,
      invoiceId,
    });

    return NextResponse.json({
      data: {
        invoice,
        htmlContent,
        printUrl,
      } satisfies GeneratedInvoiceResponse,
    } satisfies ApiSuccess<GeneratedInvoiceResponse>);

  } catch (error) {
    logger.apiError(error, { route: "/api/ministry/billing/invoices/[invoiceId]", method: "GET" });

    return NextResponse.json(
      {
        error: "Failed to generate invoice PDF",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse line items from JSON
 */
function parseLineItems(items: unknown): Array<{
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}> {
  if (!items) return [];
  if (Array.isArray(items)) {
    // Validate array structure
    return items.filter((item): item is { description: string; quantity: number; unitPrice: number; amount: number } =>
      item &&
      typeof item === 'object' &&
      'description' in item &&
      'quantity' in item &&
      'unitPrice' in item &&
      'amount' in item
    );
  }
  if (typeof items === "object" && items !== null && Object.keys(items).length === 0) return [];
  try {
    const parsed = JSON.parse(String(items));
    if (Array.isArray(parsed)) {
      return parsed.filter((item: unknown) =>
        item &&
        typeof item === 'object' &&
        'description' in item &&
        'quantity' in item &&
        'unitPrice' in item &&
        'amount' in item
      );
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-BT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-BT", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount / 100); // Convert from cents
}

/**
 * Generate HTML invoice for printing/PDF
 */
function generateInvoiceHtml(invoice: InvoiceResponseData): string {
  const subtotal = invoice.amount;
  const taxAmount = invoice.taxAmount;
  const discountAmount = invoice.discountAmount;
  const total = invoice.totalAmount;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
    }

    .invoice-container {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    @media print {
      .invoice-container {
        box-shadow: none;
        padding: 40px;
        max-width: 100%;
      }
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 30px;
      border-bottom: 3px solid #8b5cf6;
      margin-bottom: 30px;
    }

    .logo-section {
      flex: 1;
    }

    .logo-title {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .logo-subtitle {
      font-size: 14px;
      color: #6b7280;
    }

    .invoice-title {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .invoice-number {
      font-size: 32px;
      font-weight: 700;
      color: #8b5cf6;
    }

    .invoice-meta {
      text-align: right;
      margin-top: 16px;
    }

    .invoice-meta-row {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .invoice-meta-row strong {
      color: #1f2937;
      font-weight: 600;
    }

    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 12px;
    }

    .status-badge.paid {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.overdue {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge.cancelled {
      background: #f3f4f6;
      color: #374151;
    }

    /* Bill To Section */
    .bill-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 40px;
    }

    .bill-to, .bill-from {
      flex: 1;
    }

    .section-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .school-name {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .school-detail {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    /* Period Info */
    .period-info {
      background: #f9fafb;
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 40px;
    }

    .period-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }

    .period-label {
      color: #6b7280;
    }

    .period-value {
      font-weight: 600;
      color: #1f2937;
    }

    /* Line Items Table */
    .line-items {
      margin-bottom: 30px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th {
      text-align: left;
      padding: 14px 16px;
      background: #f9fafb;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }

    .table td {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .table td.text-right,
    .table th.text-right {
      text-align: right;
    }

    .table tr:last-child td {
      border-bottom: none;
    }

    .item-description {
      font-weight: 500;
      color: #1f2937;
    }

    .item-quantity {
      color: #6b7280;
    }

    .item-amount {
      font-weight: 600;
      color: #1f2937;
    }

    /* Totals */
    .totals {
      width: 320px;
      margin-left: auto;
      margin-bottom: 40px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }

    .total-row.subtotal {
      color: #6b7280;
    }

    .total-row.discount {
      color: #059669;
    }

    .total-row.final {
      border-top: 2px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 8px;
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
    }

    /* Payment Details */
    .payment-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 30px;
    }

    .payment-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .payment-label {
      color: #6b7280;
    }

    .payment-value {
      font-weight: 600;
      color: #1f2937;
    }

    /* Footer */
    .footer {
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }

    .footer-logo {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .footer-text {
      margin-bottom: 4px;
    }

    /* Notes */
    .notes {
      margin-bottom: 30px;
      padding: 16px;
      background: #fef9c3;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
      font-size: 14px;
      color: #92400e;
    }

    .notes-label {
      font-weight: 600;
      margin-bottom: 4px;
    }

    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo-title">Bhutan EduSkill</div>
        <div class="logo-subtitle">Ministry of Education, Royal Government of Bhutan</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div class="invoice-meta">
          <div class="invoice-meta-row">
            <strong>Date:</strong> ${formatDate(invoice.invoiceDate)}
          </div>
          <div class="invoice-meta-row">
            <strong>Due:</strong> ${formatDate(invoice.dueDate)}
          </div>
        </div>
        <div class="status-badge ${invoice.status}">
          ${invoice.status.replace('_', ' ')}
        </div>
      </div>
    </div>

    <!-- Bill To / From -->
    <div class="bill-section">
      <div class="bill-to">
        <div class="section-label">Bill To</div>
        <div class="school-name">${invoice.school}</div>
        <div class="school-detail">${invoice.schoolAddress}</div>
        <div class="school-detail">Email: ${invoice.schoolEmail}</div>
        <div class="school-detail">Phone: ${invoice.schoolPhone}</div>
      </div>
      <div class="bill-from">
        <div class="section-label">Bill From</div>
        <div class="school-name">Bhutan EduSkill Platform</div>
        <div class="school-detail">Ministry of Education</div>
        <div class="school-detail">Royal Government of Bhutan</div>
        <div class="school-detail">Thimphu, Bhutan</div>
      </div>
    </div>

    <!-- Period Info -->
    <div class="period-info">
      <div class="period-row">
        <span class="period-label">Subscription Plan:</span>
        <span class="period-value">${invoice.plan}</span>
      </div>
      <div class="period-row">
        <span class="period-label">Billing Period:</span>
        <span class="period-value">${formatDate(invoice.billingPeriodStart)} - ${formatDate(invoice.billingPeriodEnd)}</span>
      </div>
      ${invoice.paidDate ? `
      <div class="period-row">
        <span class="period-label">Paid On:</span>
        <span class="period-value">${formatDate(invoice.paidDate)}</span>
      </div>
      ` : ''}
    </div>

    <!-- Line Items -->
    <div class="line-items">
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
          ${invoice.lineItems.map(item => `
          <tr>
            <td>
              <div class="item-description">${item.description}</div>
            </td>
            <td class="text-right">
              <div class="item-quantity">${item.quantity}</div>
            </td>
            <td class="text-right">
              <div class="item-amount">${formatCurrency(item.unitPrice, invoice.currency)}</div>
            </td>
            <td class="text-right">
              <div class="item-amount">${formatCurrency(item.amount, invoice.currency)}</div>
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals">
      <div class="total-row subtotal">
        <span>Subtotal</span>
        <span>${formatCurrency(subtotal, invoice.currency)}</span>
      </div>
      ${taxAmount > 0 ? `
      <div class="total-row subtotal">
        <span>GST (7%)</span>
        <span>${formatCurrency(taxAmount, invoice.currency)}</span>
      </div>
      ` : ''}
      ${discountAmount > 0 ? `
      <div class="total-row discount">
        <span>Discount</span>
        <span>-${formatCurrency(discountAmount, invoice.currency)}</span>
      </div>
      ` : ''}
      <div class="total-row final">
        <span>Total</span>
        <span>${formatCurrency(total, invoice.currency)}</span>
      </div>
    </div>

    <!-- Payment Details -->
    ${invoice.paymentMethod || invoice.paymentReference ? `
    <div class="payment-details">
      <div class="payment-title">Payment Information</div>
      ${invoice.paymentMethod ? `
      <div class="payment-row">
        <span class="payment-label">Payment Method:</span>
        <span class="payment-value">${invoice.paymentMethod}</span>
      </div>
      ` : ''}
      ${invoice.paymentReference ? `
      <div class="payment-row">
        <span class="payment-label">Transaction Reference:</span>
        <span class="payment-value">${invoice.paymentReference}</span>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Notes -->
    ${invoice.notes ? `
    <div class="notes">
      <div class="notes-label">Notes:</div>
      <div>${invoice.notes}</div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">Bhutan EduSkill Platform</div>
      <div class="footer-text">Ministry of Education, Royal Government of Bhutan</div>
      <div class="footer-text">This is a computer-generated invoice. No signature required.</div>
      <div class="footer-text" style="margin-top: 12px;">
        For inquiries, contact: billing@bhutaneduskill.bt | +975-2-322456
      </div>
    </div>
  </div>

  <script>
    // Auto-print when opened in new window
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `.trim();
}
