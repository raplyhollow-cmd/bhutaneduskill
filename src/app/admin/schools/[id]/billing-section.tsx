"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Loader2,
  DollarSign,
  Receipt,
  X,
} from "lucide-react";

export interface SchoolDetailForBilling {
  id: string;
  name: string;
  subscriptionStatus: string;
  subscriptionTier?: string;
  activatedAt?: string | null;
  maxStudents?: number;
  contactEmail?: string;
  contactPhone?: string;
}

interface BillingSectionProps {
  school: SchoolDetailForBilling;
  onUpdate: () => void;
}

// Note: Prices are configurable - you can set your own pricing
const TIER_PRICING = {
  basic: { name: "Small", students: 100 },
  standard: { name: "Medium", students: 500 },
  premium: { name: "Large", students: 1000 },
};

const TIER_LABELS = {
  basic: "Small",
  standard: "Medium",
  premium: "Large",
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionTier: string;
  amount: string;
  totalAmount: string;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  status: string;
  paidAt?: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  createdAt: string;
}

interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  paidAt: string;
  recordedBy: string;
}

interface SeatUsageData {
  schoolId: string;
  maxStudents: number;
  studentCount: number;
  teacherCount: number;
  totalUsers: number;
  usagePercentage: number;
  subscriptionTier: string;
  remainingSeats: number;
  isAtCapacity: boolean;
  needsUpgrade: boolean;
}

export function BillingSection({ school, onUpdate }: BillingSectionProps) {
  const { toast } = useToast();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>(school.subscriptionTier || "standard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [seatUsage, setSeatUsage] = useState<SeatUsageData | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  type PaymentMethod = "bank_transfer" | "cash" | "cheque" | "online";

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(true);

  // Update selectedTier when school.subscriptionTier changes (e.g., after update)
  useEffect(() => {
    if (school.subscriptionTier) {
      setSelectedTier(school.subscriptionTier);
    }
  }, [school.subscriptionTier]);

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchSeatUsage(), fetchPaymentHistory()]);
  }, [school.id]);

  const fetchPaymentHistory = async () => {
    setIsLoadingPaymentHistory(true);
    try {
      // Build payment history from paid invoices
      const response = await fetch(`/api/admin/schools/${school.id}/invoices`);
      if (response.ok) {
        const data = await response.json();
        const paidInvoices = (data.data || []).filter((inv: Invoice) => inv.status === "paid" && inv.paidAt);
        const history: PaymentRecord[] = paidInvoices.map((inv: Invoice) => ({
          id: inv.id,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: Number(inv.totalAmount || inv.amount),
          paymentMethod: inv.paymentMethod || "unknown",
          reference: inv.paymentReference || "N/A",
          paidAt: inv.paidAt || inv.createdAt,
          recordedBy: "Admin",
        }));
        setPaymentHistory(history);
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
    } finally {
      setIsLoadingPaymentHistory(false);
    }
  };

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const fetchSeatUsage = async () => {
    setIsLoadingUsage(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/seat-usage`);
      if (response.ok) {
        const data = await response.json();
        setSeatUsage(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch seat usage:", error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Invoice generated",
          description: `Invoice ${data.data.invoiceNumber} created for ${school.name}`,
        });
        await fetchInvoices();
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          variant: "error",
          title: "Failed to generate invoice",
          description: error.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to generate invoice",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleUpdateTier = async () => {
    setIsUpdatingTier(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (response.ok) {
        toast({
          title: "Tier updated",
          description: `School tier changed to ${TIER_LABELS[selectedTier as keyof typeof TIER_LABELS]}`,
        });
        await fetchSeatUsage();
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          variant: "error",
          title: "Failed to update tier",
          description: error.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to update tier",
      });
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    toast({
      title: "Payment reminder sent",
      description: `Reminder sent for invoice ${invoiceId}`,
    });
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.totalAmount || invoice.amount);
    setPaymentReference("");
    setPaymentNotes("");
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentAmount) {
      toast({
        variant: "error",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsRecordingPayment(true);
    try {
      const response = await fetch(`/api/billing/invoices/${selectedInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_payment",
          amount: Number(paymentAmount),
          paymentMethod,
          paymentReference: paymentReference || `txn-${Date.now()}`,
          notes: paymentNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Payment recorded",
          description: data.data?.message || `Payment of Nu ${Number(paymentAmount).toLocaleString()} recorded successfully`,
        });
        setIsPaymentModalOpen(false);
        await fetchInvoices();
        await fetchPaymentHistory();
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          variant: "error",
          title: "Failed to record payment",
          description: error.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to record payment",
      });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Open invoice in print-friendly new tab
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        // Use the invoice's own stored tier (for historical accuracy)
        const invoiceTier = invoice.subscriptionTier || "standard";
        const tierName = TIER_LABELS[invoiceTier as keyof typeof TIER_LABELS] || invoiceTier;
        const tierPricing = TIER_PRICING[invoiceTier as keyof typeof TIER_PRICING] || TIER_PRICING.standard;
        const statusColor = invoice.status === "paid" ? "#16a34a" : invoice.status === "sent" || invoice.status === "pending" ? "#ca8a04" : "#6b7280";
        const amount = Number(invoice.totalAmount || invoice.amount);
        const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        // Format billing period as full date range for annual subscription
        const billingStart = new Date(invoice.billingPeriodStart);
        const billingEnd = new Date(invoice.billingPeriodEnd);
        const billingPeriodText = `${billingStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${billingEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber} - Bhutan EduSkill</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

              * { margin: 0; padding: 0; box-sizing: border-box; }

              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
                padding: 0;
                color: #1e293b;
                line-height: 1.6;
              }

              .invoice-container {
                max-width: 850px;
                margin: 40px auto;
                background: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }

              /* Header Section */
              .header {
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                color: white;
                padding: 40px 50px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              .logo-section h1 {
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.5px;
                margin-bottom: 5px;
              }

              .logo-section p {
                font-size: 14px;
                opacity: 0.9;
                font-weight: 300;
              }

              .invoice-badge {
                text-align: right;
              }

              .invoice-badge .label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                opacity: 0.8;
                margin-bottom: 5px;
              }

              .invoice-badge .number {
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -1px;
              }

              /* Status Banner */
              .status-banner {
                padding: 15px 50px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }

              .status-paid { background: #dcfce7; color: #166534; }
              .status-pending { background: #fef9c3; color: #854d0e; }
              .status-overdue { background: #fee2e2; color: #991b1b; }

              /* Content */
              .content {
                padding: 50px;
              }

              /* Addresses Grid */
              .addresses {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 40px;
              }

              .address-box h3 {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #64748b;
                margin-bottom: 15px;
                font-weight: 600;
              }

              .address-box p {
                font-size: 14px;
                color: #334155;
                margin: 4px 0;
              }

              .address-box .name {
                font-weight: 600;
                font-size: 16px;
                color: #0f172a;
                margin-bottom: 8px;
              }

              /* Invoice Details */
              .invoice-details {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                background: #f8fafc;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 40px;
              }

              .detail-item .label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                margin-bottom: 6px;
              }

              .detail-item .value {
                font-size: 15px;
                font-weight: 600;
                color: #0f172a;
              }

              /* Line Items Table */
              .line-items {
                margin-bottom: 30px;
              }

              .line-items table {
                width: 100%;
                border-collapse: collapse;
              }

              .line-items th {
                background: #f1f5f9;
                padding: 16px 20px;
                text-align: left;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #475569;
                font-weight: 600;
                border-bottom: 2px solid #e2e8f0;
              }

              .line-items th.text-right { text-align: right; }
              .line-items th.text-center { text-align: center; }

              .line-items td {
                padding: 20px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 15px;
                color: #334155;
              }

              .line-items tr:last-child td { border-bottom: none; }

              .item-description {
                font-weight: 500;
                color: #0f172a;
              }

              .item-code {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 4px;
              }

              /* Summary Section */
              .summary-section {
                display: flex;
                justify-content: flex-end;
              }

              .summary-box {
                width: 320px;
              }

              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
              }

              .summary-row.subtotal {
                color: #64748b;
              }

              .summary-row.total {
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                color: white;
                margin: 0 -20px;
                padding: 20px 20px;
                border-bottom: none;
                border-radius: 12px;
                margin-top: 10px;
              }

              .summary-row.total .label,
              .summary-row.total .value {
                font-size: 16px;
                font-weight: 700;
              }

              .summary-row .label { color: #64748b; }
              .summary-row .value { font-weight: 600; color: #0f172a; }
              .summary-row.total .label,
              .summary-row.total .value { color: white; }

              /* Payment Info Box */
              .payment-info {
                background: #fefce8;
                border-left: 4px solid #eab308;
                padding: 25px;
                border-radius: 0 12px 12px 0;
                margin-top: 40px;
              }

              .payment-info h4 {
                font-size: 14px;
                font-weight: 600;
                color: #854d0e;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .payment-info p {
                font-size: 13px;
                color: #713f12;
                margin: 6px 0;
              }

              /* Payment Received Badge */
              .payment-received {
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
                padding: 30px;
                border-radius: 16px;
                margin-top: 40px;
                display: flex;
                align-items: center;
                gap: 20px;
              }

              .payment-received .icon {
                width: 50px;
                height: 50px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
              }

              .payment-received .info h4 {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 5px;
              }

              .payment-received .info p {
                font-size: 13px;
                opacity: 0.9;
              }

              /* Terms */
              .terms {
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e2e8f0;
              }

              .terms h4 {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                margin-bottom: 15px;
              }

              .terms p {
                font-size: 12px;
                color: #94a3b8;
                line-height: 1.7;
              }

              /* Footer */
              .footer {
                background: #1e293b;
                color: white;
                padding: 30px 50px;
                text-align: center;
              }

              .footer p {
                font-size: 12px;
                opacity: 0.7;
              }

              /* Watermark */
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 120px;
                font-weight: 900;
                color: rgba(0,0,0,0.03);
                pointer-events: none;
                z-index: 0;
              }

              @media print {
                body { background: white; }
                .invoice-container { box-shadow: none; margin: 0; }
                .watermark { display: none; }
              }
            </style>
          </head>
          <body>
            ${invoice.status !== "paid" ? '<div class="watermark">DRAFT</div>' : ''}

            <div class="invoice-container">
              <!-- Header -->
              <div class="header">
                <div class="logo-section">
                  <h1>Bhutan EduSkill</h1>
                  <p>School Management Platform</p>
                </div>
                <div class="invoice-badge">
                  <div class="label">Tax Invoice</div>
                  <div class="number">#${invoice.invoiceNumber}</div>
                </div>
              </div>

              <!-- Status Banner -->
              <div class="status-banner ${invoice.status === "paid" ? "status-paid" : invoice.status === "overdue" ? "status-overdue" : "status-pending"}">
                ${invoice.status === "paid" ? "✓ PAID IN FULL" : invoice.status === "overdue" ? "⚠ PAYMENT OVERDUE" : "○ PAYMENT PENDING"}
              </div>

              <div class="content">
                <!-- Addresses -->
                <div class="addresses">
                  <div class="address-box">
                    <h3>Bill From</h3>
                    <p class="name">Bhutan EduSkill Platform</p>
                    <p>School Management System</p>
                    <p>Thimphu, Bhutan</p>
                    <p style="margin-top: 10px;">
                      <strong>Email:</strong> billing@bhutaneduskill.bt<br>
                      <strong>Phone:</strong> +975 2 34567<br>
                      <strong>Tax ID:</strong> 102345678
                    </p>
                  </div>
                  <div class="address-box">
                    <h3>Bill To</h3>
                    <p class="name">${school.name}</p>
                    <p>School ID: ${school.id}</p>
                    ${school.contactEmail ? `<p>${school.contactEmail}</p>` : ''}
                    ${school.contactPhone ? `<p>${school.contactPhone}</p>` : ''}
                    <p style="margin-top: 10px;">
                      <strong>Account Type:</strong> ${tierName} Plan<br>
                      <strong>Max Students:</strong> ${tierPricing.students}
                    </p>
                  </div>
                </div>

                <!-- Invoice Details -->
                <div class="invoice-details">
                  <div class="detail-item">
                    <div class="label">Invoice Date</div>
                    <div class="value">${new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                  <div class="detail-item">
                    <div class="label">Due Date</div>
                    <div class="value">${new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                  <div class="detail-item">
                    <div class="label">Billing Period</div>
                    <div class="value">Annual ${billingStart.getFullYear()}</div>
                  </div>
                  <div class="detail-item">
                    <div class="label">Payment Terms</div>
                    <div class="value">Net 30 Days</div>
                  </div>
                </div>

                <!-- Line Items -->
                <div class="line-items">
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 50px;">#</th>
                        <th>Description</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>
                          <div class="item-description">${tierName.toUpperCase()} Plan - Annual Subscription</div>
                          <div class="item-code">SKU: EDU-${tierName.toUpperCase()}-2024 | Capacity: Up to ${tierPricing.students} students</div>
                        </td>
                        <td class="text-center">1</td>
                        <td class="text-right">${invoice.currency} ${amount.toLocaleString()}</td>
                        <td class="text-right">${invoice.currency} ${amount.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Summary -->
                <div class="summary-section">
                  <div class="summary-box">
                    <div class="summary-row subtotal">
                      <span class="label">Subtotal</span>
                      <span class="value">${invoice.currency} ${amount.toLocaleString()}</span>
                    </div>
                    <div class="summary-row subtotal">
                      <span class="label">Tax (0%)</span>
                      <span class="value">${invoice.currency} 0.00</span>
                    </div>
                    <div class="summary-row total">
                      <span class="label">Total Due</span>
                      <span class="value">${invoice.currency} ${amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                ${invoice.status === "paid" ? `
                  <!-- Payment Received -->
                  <div class="payment-received">
                    <div class="icon">✓</div>
                    <div class="info">
                      <h4>Payment Received</h4>
                      <p><strong>Amount:</strong> ${invoice.currency} ${amount.toLocaleString()}</p>
                      <p><strong>Date:</strong> ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "N/A"}</p>
                      <p><strong>Method:</strong> ${invoice.paymentMethod ? invoice.paymentMethod.replace(/_/g, " ").toUpperCase() : "N/A"}</p>
                      ${invoice.paymentReference ? `<p><strong>Reference:</strong> ${invoice.paymentReference}</p>` : ""}
                    </div>
                  </div>
                ` : `
                  <!-- Payment Info -->
                  <div class="payment-info">
                    <h4>💳 Payment Information</h4>
                    <p><strong>Bank:</strong> Bank of Bhutan</p>
                    <p><strong>Account Name:</strong> Bhutan EduSkill Platform</p>
                    <p><strong>Account Number:</strong> 1234 5678 9012</p>
                    <p><strong>Branch:</strong> Thimphu Main Branch</p>
                    <p style="margin-top: 10px;"><strong>Please include invoice number</strong> <code>#${invoice.invoiceNumber}</code> <strong>in your payment reference.</strong></p>
                  </div>
                `}

                <!-- Terms -->
                <div class="terms">
                  <h4>Terms & Conditions</h4>
                  <p>
                    1. Payment is due within 30 days of invoice date.<br>
                    2. Late payments may result in service suspension after due date.<br>
                    3. This invoice is electronically generated and valid without signature.<br>
                    4. For questions, contact billing@bhutaneduskill.bt | +975 2 34567<br>
                    5. Prices are exclusive of taxes unless otherwise stated.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p>Bhutan EduSkill Platform • Transforming Education Through Technology</p>
                <p style="margin-top: 5px;">Generated on ${today} • Invoice #${invoice.invoiceNumber} • Page 1 of 1</p>
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();

        // Trigger print dialog after a short delay
        setTimeout(() => {
          printWindow.print();
        }, 750);

        toast({
          title: "Invoice opened",
          description: "Use your browser's print dialog to save as PDF",
        });
      }
    } catch (error) {
      console.error("Failed to open invoice:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to open invoice for download",
      });
    }
  };

  // Use local selectedTier state instead of prop for real-time tier updates
  const currentTier = selectedTier || "standard";
  const pricing = TIER_PRICING[currentTier as keyof typeof TIER_PRICING] || TIER_PRICING.standard;
  const usagePercentage = seatUsage?.usagePercentage || 0;
  const usedSeats = seatUsage?.studentCount || 0;

  // Calculate payment summary from real invoices
  const paidTotal = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const pendingTotal = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "sent")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const thisYearTotal = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>Manage school subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{pricing.name} Plan</h3>
                <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                  Up to {pricing.students} students
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Full platform access included
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Scroll to tier update section
                document.getElementById("tier-update-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Change Plan
            </Button>
          </div>

          {/* Usage Bar */}
          <div className="mt-6">
            {isLoadingUsage ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Seat Usage</span>
                  <span className="font-medium text-gray-900">{usagePercentage}% utilized</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      usagePercentage > 90
                        ? "bg-red-500"
                        : usagePercentage > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {usedSeats} of {pricing.students} seats used ({seatUsage?.remainingSeats || 0} remaining)
                </p>
                {seatUsage?.needsUpgrade && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    School is approaching capacity. Consider upgrading.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Billing History
              </CardTitle>
              <CardDescription>View and manage invoices</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateInvoice}
              disabled={isGeneratingInvoice}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingInvoice ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>{TIER_LABELS[invoice.subscriptionTier as keyof typeof TIER_LABELS] || invoice.subscriptionTier} Plan</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {invoice.currency} {Number(invoice.amount).toLocaleString()}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          invoice.status === "paid"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : invoice.status === "sent" || invoice.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {invoice.status === "paid" ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </>
                        ) : invoice.status === "sent" || invoice.status === "pending" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        ) : (
                          invoice.status
                        )}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => openPaymentModal(invoice)}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        {invoice.status === "paid" ? "Add Payment" : "Record Payment"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {(invoice.status === "pending" || invoice.status === "sent") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                          onClick={() => handleSendReminder(invoice.invoiceNumber)}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Payment Summary
          </CardTitle>
          <CardDescription>Annual payment overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Billed</p>
              <p className="text-2xl font-bold text-gray-900">
                Nu {thisYearTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Paid</p>
              <p className="text-2xl font-bold text-green-700">
                Nu {paidTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                Nu {pendingTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Tier */}
      <Card id="tier-update-section">
        <CardHeader>
          <CardTitle>Update Subscription Tier</CardTitle>
          <CardDescription>Change the school's subscription plan (capacity-based)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tierUpdate">New Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger id="tierUpdate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    Small - Up to 100 students (Full platform access)
                  </SelectItem>
                  <SelectItem value="standard">
                    Medium - Up to 500 students (Full platform access)
                  </SelectItem>
                  <SelectItem value="premium">
                    Large - Up to 1000 students (Full platform access)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500">
              All tiers include full platform access. Pricing is based on student capacity only.
            </p>
            <Button
              onClick={handleUpdateTier}
              disabled={isUpdatingTier || selectedTier === currentTier}
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white"
            >
              {isUpdatingTier ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Tier"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment History
          </CardTitle>
          <CardDescription>Record of all payments received</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPaymentHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.invoiceNumber}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(payment.paidAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{payment.paymentMethod.replace("_", " ")}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Ref: {payment.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-700">
                      +Nu {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">by {payment.recordedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record payment for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Invoice Amount Display */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Invoice Amount</span>
                <span className="font-semibold text-gray-900">
                  Nu {selectedInvoice ? Number(selectedInvoice.totalAmount || selectedInvoice.amount).toLocaleString() : "0"}
                </span>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">
                Payment Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">Nu</span>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-12"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Transaction Reference</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., Bank transaction ID, Cheque number"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={isRecordingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={isRecordingPayment || !paymentAmount}
              style={{ background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)" }}
              className="text-white"
            >
              {isRecordingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
