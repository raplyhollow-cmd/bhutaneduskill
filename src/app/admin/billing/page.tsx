"use client";

/**
 * PLATFORM ADMIN - BILLING & SUBSCRIPTION MANAGEMENT
 *
 * Manage billing, subscriptions, invoices, payments, and refunds for all schools/tenants.
 * Features:
 * - Revenue dashboard with charts
 * - Invoice creation and management
 * - Payment tracking
 * - Subscription management
 * - Refund processing
 */


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsWithUnderline } from "@/components/ui/tabs";
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Download,
  Eye,
  Mail,
  FileText,
  Calendar,
  Building2,
  Users,
  ChevronDown,
  Plus,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  PieChart,
  MoreVertical,
  Pencil,
  Trash2,
  Receipt,
  Undo,
  Zap,
  History,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  fetchBillingData,
  createInvoice,
  updateInvoiceStatus,
  processRefund,
  updateSubscription,
  type SchoolData,
  type SubscriptionData,
  type InvoiceData,
  type BillingStats,
  type RevenueChartData,
  type ActionResult,
} from "./actions";

// ============================================================================
// TYPES
// ============================================================================

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
  popular?: boolean;
  tier?: string;
}

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerTransactionId?: string;
  paymentMethod?: string;
  createdAt: string;
  invoiceNumber?: string;
  schoolName?: string;
}

interface RefundData {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paidAmount: number;
  refundableAmount: number;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const defaultSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29900,
    currency: "BTN",
    interval: "yearly",
    maxStudents: 500,
    maxTeachers: 50,
    tier: "basic",
    features: [
      "Basic School Management",
      "Student & Teacher Portals",
      "Attendance Tracking",
      "Homework Management",
      "Basic Reports",
      "Email Support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 59900,
    currency: "BTN",
    interval: "yearly",
    maxStudents: 2000,
    maxTeachers: 150,
    tier: "standard",
    features: [
      "Everything in Starter",
      "Parent Portal",
      "Career Guidance Assessments",
      "Fee Management",
      "Learning Modules",
      "Advanced Analytics",
      "Priority Support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 129900,
    currency: "BTN",
    interval: "yearly",
    maxStudents: -1,
    maxTeachers: -1,
    tier: "premium",
    features: [
      "Everything in Professional",
      "Unlimited Students & Teachers",
      "Custom Integrations",
      "White-label Options",
      "Dedicated Account Manager",
      "On-premise Deployment Option",
      "24/7 Phone Support",
      "SLA Guarantee",
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case "trialing":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Trial
        </Badge>
      );
    case "past_due":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Past Due
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "paid":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <X className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <X className="w-3 h-3 mr-1" />
          Canceled
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Undo className="w-3 h-3 mr-1" />
          Refunded
        </Badge>
      );
    case "succeeded":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Succeeded
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <X className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(amount: number, currency: string = "BTN"): string {
  return new Intl.NumberFormat("en-BT", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount); // Amount is stored as actual value (Nu), not cents
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-BT", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminBillingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Data state
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    revenueChange: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    overduePayments: 0,
    monthlyRecurring: 0,
    pendingAmount: 0,
    paidAmount: 0,
    refundedAmount: 0,
  });
  const [revenueChart, setRevenueChart] = useState<RevenueChartData[]>([]);

  const [plans] = useState<SubscriptionPlan[]>(defaultSubscriptionPlans);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState("overview");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Form state
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");
  const [invoiceNotes, setInvoiceNotes] = useState<string>("");
  const [refundInvoice, setRefundInvoice] = useState<RefundData | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("manual");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Fetch billing data using server action
  const loadBillingData = useCallback(async () => {
    setLoading(true);
    setError(null);

    startTransition(async () => {
      const result = await fetchBillingData();

      if (result.success && result.data) {
        setSchools(result.data.schools);
        setInvoices(result.data.invoices);
        setStats(result.data.stats);
        setRevenueChart(result.data.revenueChart);
      } else {
        setError(result.error || "Failed to fetch billing data");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Create invoice handler using server action
  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSchool || !invoiceAmount) return;

    setGeneratingInvoice(true);
    setActionMessage(null);

    startTransition(async () => {
      const result = await createInvoice({
        schoolId: selectedSchool,
        amount: parseInt(invoiceAmount, 10),
        notes: invoiceNotes || undefined,
      });

      if (result.success) {
        await loadBillingData();
        setShowInvoiceModal(false);
        setSelectedSchool("");
        setInvoiceAmount("");
        setInvoiceNotes("");
        setActionMessage({ type: "success", message: result.message || "Invoice generated successfully!" });
      } else {
        setActionMessage({ type: "error", message: result.error || "Failed to generate invoice" });
      }
      setGeneratingInvoice(false);
    });
  }

  // Update invoice status handler using server action
  async function handleUpdateInvoiceStatus(invoiceId: string, action: string) {
    startTransition(async () => {
      const result = await updateInvoiceStatus({
        invoiceId,
        action,
      });

      if (result.success) {
        await loadBillingData();
        setActionMessage({ type: "success", message: result.message || "Invoice updated successfully" });
      } else {
        setActionMessage({ type: "error", message: result.error || "Failed to update invoice" });
      }
    });
  }

  // Record payment handler using server action
  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentInvoice || !paymentAmount) return;

    setRecordingPayment(true);
    setActionMessage(null);

    startTransition(async () => {
      const result = await updateInvoiceStatus({
        invoiceId: paymentInvoice.id,
        action: "record_payment",
        paymentMethod,
        paymentReference: paymentNotes || `txn-${Date.now()}`,
      });

      if (result.success) {
        await loadBillingData();
        setShowPaymentModal(false);
        setPaymentInvoice(null);
        setPaymentAmount("");
        setPaymentMethod("manual");
        setPaymentNotes("");
        setActionMessage({ type: "success", message: result.message || "Payment recorded successfully!" });
      } else {
        setActionMessage({ type: "error", message: result.error || "Failed to record payment" });
      }
      setRecordingPayment(false);
    });
  }

  // Process refund handler using server action
  async function handleProcessRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!refundInvoice || !refundAmount || !refundReason) return;

    setProcessingRefund(true);
    setActionMessage(null);

    startTransition(async () => {
      const result = await processRefund({
        invoiceId: refundInvoice.invoiceId,
        refundAmount: parseInt(refundAmount, 10),
        refundReason,
      });

      if (result.success) {
        await loadBillingData();
        setShowRefundModal(false);
        setRefundInvoice(null);
        setRefundAmount("");
        setRefundReason("");
        setActionMessage({ type: "success", message: result.message || "Refund processed successfully!" });
      } else {
        setActionMessage({ type: "error", message: result.error || "Failed to process refund" });
      }
      setProcessingRefund(false);
    });
  }

  // Subscription management handlers using server action
  async function handleUpdateSubscription(subscriptionId: string, action: string) {
    startTransition(async () => {
      const result = await updateSubscription({
        subscriptionId,
        action,
      });

      if (result.success) {
        await loadBillingData();
        setActionMessage({ type: "success", message: result.message || "Subscription updated successfully" });
      } else {
        setActionMessage({ type: "error", message: result.error || "Failed to update subscription" });
      }
    });
  }

  // Open invoice modal
  function openRefundModal(invoice: InvoiceData) {
    const refundableAmount = invoice.status === "paid"
      ? invoice.totalAmount || invoice.amount
      : 0;

    setRefundInvoice({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      paidAmount: invoice.totalAmount || invoice.amount,
      refundableAmount,
    });
    setRefundAmount(refundableAmount > 0 ? String(refundableAmount) : "");
    setShowRefundModal(true);
  }

  // Open payment modal
  function openPaymentModal(invoice: InvoiceData) {
    setPaymentInvoice(invoice);
    const dueAmount = (invoice.totalAmount || invoice.amount) - (invoice.refundAmount || 0);
    setPaymentAmount(String(dueAmount));
    setShowPaymentModal(true);
  }

  // Fetch payment transactions for a subscription
  function fetchPaymentTransactions(subscriptionId: string): void {
    // In production, this would call a dedicated payments API
    // For now, we'll derive from invoice data
    const subscriptionInvoices = invoices.filter(
      (inv) => (inv.status === "paid" || inv.status === "refunded")
    );

    const transactions: PaymentTransaction[] = subscriptionInvoices.map((inv) => ({
      id: `txn-${inv.id}`,
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status === "paid" ? "succeeded" : "refunded",
      provider: inv.paymentMethod || "manual",
      providerTransactionId: inv.paymentMethod ? `tx-${inv.id.substring(0, 8)}` : undefined,
      paymentMethod: inv.paymentMethod,
      createdAt: inv.paidDate || inv.dueDate,
      invoiceNumber: inv.invoiceNumber,
      schoolName: inv.school,
    }));

    setPaymentTransactions(transactions);
  }

  // Get subscription details
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadBillingData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Calculate chart max for scaling
  const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8">
      {/* Action Message Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{actionMessage.message}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-current hover:opacity-70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing & Subscriptions
          </h1>
          <p className="text-gray-600">
            Manage all school subscriptions, invoices, and payments
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadBillingData} disabled={isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
            onClick={() => setShowInvoiceModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline" className="w-full justify-start">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="w-4 h-4" />
            Invoices
            {stats.pendingInvoices > 0 && (
              <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600">
                {stats.pendingInvoices}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Settings className="w-4 h-4" />
            Plans
          </TabsTrigger>
        </TabsList>
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-8">
          {/* Revenue Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +{stats.revenueChange}% this year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.activeSubscriptions}
                </div>
                <p className="text-xs text-gray-500 mt-1">Schools subscribed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Pending Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingInvoices}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingAmount ? formatCurrency(stats.pendingAmount) + " outstanding" : "Awaiting payment"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Overdue Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.overduePayments}
                </div>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-2">
                  {revenueChart.map((data, index) => {
                    const height = (data.revenue / maxRevenue) * 100;
                    const isCurrentMonth = index === revenueChart.length - 1;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-md transition-all hover:opacity-80 relative group"
                          style={{
                            height: `${height}%`,
                            background: isCurrentMonth
                              ? "linear-gradient(180deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)"
                              : "linear-gradient(180deg, rgb(244 114 182) 0%, rgb(236 72 153) 100%)",
                          }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(data.revenue)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Paid</p>
                      <p className="text-xs text-gray-500">Collected payments</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {stats.paidAmount ? formatCurrency(stats.paidAmount) : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pending</p>
                      <p className="text-xs text-gray-500">Awaiting payment</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {stats.pendingAmount ? formatCurrency(stats.pendingAmount) : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Undo className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Refunded</p>
                      <p className="text-xs text-gray-500">Total refunds</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {stats.refundedAmount ? formatCurrency(stats.refundedAmount) : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">MRR</p>
                      <p className="text-xs text-gray-500">Monthly recurring</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(stats.monthlyRecurring)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SUBSCRIPTIONS TAB */}
        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Manage and track all invoices</CardDescription>
                </div>
                <Button
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                  onClick={() => setShowInvoiceModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Invoice</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Plan</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Due Date</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Amount</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </span>
                            {invoice.refundAmount && invoice.refundAmount > 0 && (
                              <div className="text-xs text-purple-600">
                                Refunded: {formatCurrency(invoice.refundAmount)}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{invoice.school}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className="capitalize text-xs">
                              {invoice.plan}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {formatDate(invoice.dueDate)}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">{getStatusBadge(invoice.status)}</td>
                          <td className="py-4 px-4 text-right font-semibold text-gray-900">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {invoice.status === "pending" || invoice.status === "overdue" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                  title="Record Payment"
                                  onClick={() => openPaymentModal(invoice)}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              ) : null}
                              {invoice.status === "paid" && !invoice.refundAmount && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                                  title="Process Refund"
                                  onClick={() => openRefundModal(invoice)}
                                >
                                  <Undo className="w-4 h-4" />
                                </Button>
                              )}
                              {invoice.status !== "paid" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                  title="Send Reminder"
                                  onClick={() => handleUpdateInvoiceStatus(invoice.id, "send_reminder")}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Configured payment gateways</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">RMA Payment Gateway</p>
                      <p className="text-sm text-gray-500">Bhutan&apos;s national payment gateway</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Stripe</p>
                      <p className="text-sm text-gray-500">International payments</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentTransactions.slice(0, 5).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            txn.status === "succeeded" ? "bg-green-100" :
                            txn.status === "refunded" ? "bg-purple-100" :
                            "bg-red-100"
                          }`}>
                            {txn.status === "succeeded" ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : txn.status === "refunded" ? (
                              <Undo className="w-5 h-5 text-purple-600" />
                            ) : (
                              <X className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{txn.invoiceNumber || "Transaction"}</p>
                            <p className="text-xs text-gray-500">{txn.schoolName || txn.provider}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {txn.status === "refunded" ? "-" : ""}{formatCurrency(txn.amount, txn.currency)}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PLANS TAB */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Available plans for schools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-xl border-2 p-6 relative ${
                      plan.popular
                        ? "border-pink-500 shadow-lg"
                        : "border-gray-200"
                    }`}
                  >
                    {plan.popular && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-semibold"
                        style={{
                          background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                        }}
                      >
                        Most Popular
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(plan.price, plan.currency)}
                        </span>
                        <span className="text-gray-500">/year</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Up to {plan.maxStudents === -1 ? "Unlimited" : plan.maxStudents} students
                      </p>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-2">
                      <Button
                        variant={plan.popular ? "default" : "outline"}
                        className={`w-full ${plan.popular ? "text-white" : ""}`}
                        style={
                          plan.popular
                            ? { background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }
                            : undefined
                        }
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Plan
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-gray-500"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax rates and rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">GST Rate</p>
                      <p className="text-sm text-gray-500">Goods and Services Tax</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">7%</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Edit Tax Settings
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Tax Inclusive Pricing</p>
                      <p className="text-sm text-gray-500">Show prices including tax</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Automatic Tax Calculation</p>
                      <p className="text-sm text-gray-500">Calculate tax automatically</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Enabled
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a school subscription
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select School *
                </label>
                <select
                  required
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                >
                  <option value="">Choose a school...</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} - {school.subscriptionTier} ({school.students} students)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Amount (in cents) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="e.g., 29900 for Nu. 299.00"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
                <p className="text-xs text-gray-500">
                  Enter amount in cents (100 = Nu. 1.00)
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Add any notes for this invoice..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInvoiceModal(false)}
                disabled={generatingInvoice}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={generatingInvoice || !selectedSchool || !invoiceAmount}
                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                className="text-white"
              >
                {generatingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {paymentInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment}>
            <div className="space-y-4 py-4">
              {paymentInvoice && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Invoice Amount:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(paymentInvoice.totalAmount || paymentInvoice.amount, paymentInvoice.currency)}
                    </span>
                  </div>
                  {paymentInvoice.refundAmount && paymentInvoice.refundAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Refunded:</span>
                      <span className="text-purple-600">
                        -{formatCurrency(paymentInvoice.refundAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Payment Amount (in cents) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Payment amount"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Payment Method *
                </label>
                <select
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                >
                  <option value="manual">Manual</option>
                  <option value="rma">RMA Payment Gateway</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add payment notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={recordingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={recordingPayment || !paymentAmount}
                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                className="text-white"
              >
                {recordingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for invoice {refundInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProcessRefund}>
            <div className="space-y-4 py-4">
              {refundInvoice && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Invoice Amount:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(refundInvoice.paidAmount, refundInvoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Refundable:</span>
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(refundInvoice.refundableAmount, refundInvoice.currency)}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Refund Amount (in cents) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  max={refundInvoice?.refundableAmount ? refundInvoice.refundableAmount / 100 : undefined}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Refund amount"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
                <p className="text-xs text-gray-500">
                  Maximum refundable: {refundInvoice ? formatCurrency(refundInvoice.refundableAmount) : "-"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Refund Reason *
                </label>
                <select
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                >
                  <option value="">Select a reason...</option>
                  <option value="service_canceled">Service Canceled</option>
                  <option value="duplicate_payment">Duplicate Payment</option>
                  <option value="overcharge">Overcharge</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="service_not_provided">Service Not Provided</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  value={refundReason === "other" ? refundReason : ""}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Provide more details about the refund..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRefundModal(false)}
                disabled={processingRefund}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processingRefund || !refundAmount || !refundReason}
                variant="destructive"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {processingRefund ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Undo className="w-4 h-4 mr-2" />
                    Process Refund
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
