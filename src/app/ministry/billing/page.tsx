"use client";

/**
 * MINISTRY OF EDUCATION - BILLING & REVENUE OVERVIEW
 *
 * VIEW-ONLY page for transparency. Ministry users can view billing data
 * but CANNOT modify any billing settings, plans, or subscriptions.
 *
 * FEAT-022: Ministry Billing Implementation
 * - Platform revenue dashboard
 * - School-wise billing breakdown
 * - Payment tracking
 * - Invoice generation/download
 */


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Calendar,
  Building2,
  Users,
  Search,
  Filter,
  Lock,
  RefreshCw,
  FileDown,
  Receipt,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toaster";

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

interface BillingOverviewData {
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

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount: number, currency: string = "BTN"): string {
  return new Intl.NumberFormat("en-BT", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-BT", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadge(status: string): React.ReactNode {
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
    case "canceled":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Canceled
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
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MinistryBillingPage() {
  const { toast } = useToast();

  // Data state
  const [billingData, setBillingData] = useState<BillingOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  /**
   * Fetch billing data from API
   */
  const fetchBillingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (planFilter) params.append("plan", planFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/ministry/billing?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch billing data: ${response.statusText}`);
      }

      const result: ApiResponse<BillingOverviewData> = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setBillingData(result.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load billing data";
      setError(message);
      toast({
        variant: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, planFilter, searchQuery, toast]);

  /**
   * Handle invoice download
   */
  const handleDownloadInvoice = async (invoice: InvoiceData) => {
    if (invoice.pdfUrl) {
      // Direct download if PDF exists
      window.open(invoice.pdfUrl, "_blank");
      return;
    }

    // Generate PDF on the fly
    setIsGeneratingInvoice(true);

    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}`);

      if (!response.ok) {
        throw new Error("Failed to generate invoice PDF");
      }

      const result = await response.json();

      if (result.data?.pdfUrl) {
        window.open(result.data.pdfUrl, "_blank");
        toast({
          title: "Success",
          description: "Invoice PDF generated successfully",
        });
      } else {
        // Create a simple printable version
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .invoice-number { font-size: 24px; font-weight: bold; }
                .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .total { font-size: 20px; font-weight: bold; text-align: right; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="invoice-number">INVOICE ${invoice.invoiceNumber}</div>
              </div>
              <div class="details">
                <div>
                  <strong>School:</strong> ${invoice.school}<br>
                  <strong>Plan:</strong> ${invoice.plan}
                </div>
                <div style="text-align: right;">
                  <strong>Date:</strong> ${formatDate(invoice.dueDate)}<br>
                  <strong>Status:</strong> ${invoice.status.toUpperCase()}
                </div>
              </div>
              <div class="total">Total: ${formatCurrency(invoice.amount, invoice.currency)}</div>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (err) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to download invoice",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  /**
   * Handle export report
   */
  const handleExportReport = async () => {
    try {
      const response = await fetch("/api/ministry/billing");
      const result: ApiResponse<BillingOverviewData> = await response.json();

      if (!result.data) {
        throw new Error("No data to export");
      }

      // Create CSV content
      const csvContent = [
        ["School", "Plan", "Status", "Students", "Teachers", "Amount (BTN)", "Renewal Date"],
        ...result.data.subscriptions.map((sub) => [
          sub.schoolName,
          sub.plan,
          sub.status,
          sub.students.toString(),
          sub.teachers.toString(),
          (sub.planPrice / 100).toString(),
          formatDate(sub.renewalDate),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `billing-report-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Billing report exported successfully",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to export report",
      });
    }
  };

  /**
   * Handle generate invoice for a subscription
   */
  const handleGenerateInvoice = async (subscriptionId: string, schoolName: string) => {
    setIsGeneratingInvoice(true);

    try {
      const response = await fetch("/api/ministry/billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate invoice: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.data?.invoice) {
        toast({
          title: "Invoice Generated",
          description: `Invoice ${result.data.invoice.invoiceNumber} created for ${schoolName}`,
        });

        // Refresh billing data to show new invoice
        await fetchBillingData();
      } else if (result.data?.message) {
        toast({
          title: "Info",
          description: result.data.message,
        });
      }
    } catch (err) {
      toast({
        variant: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate invoice",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  /**
   * Filter subscriptions based on search and filters
   */
  const filteredSubscriptions = billingData?.subscriptions.filter((sub) => {
    const matchesSearch = sub.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = !planFilter || sub.plan === planFilter;
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  }) ?? [];

  /**
   * Calculate revenue by plan for display
   */
  const getRevenueByPlanForDisplay = (): PlanRevenueBreakdown[] => {
    if (!billingData) return [];

    return billingData.revenueByPlan.map((item) => ({
      ...item,
      totalRevenue: item.totalRevenue / 100, // Convert from cents
    }));
  };

  const totalRevenueByPlan = getRevenueByPlanForDisplay().reduce((sum, item) => sum + item.totalRevenue, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-600" />
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error && !billingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Billing Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchBillingData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!billingData) {
    return null;
  }

  const stats = billingData.statistics;

  return (
    <div className="space-y-8">
      {/* Header with View Only Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Billing & Revenue Overview
            </h1>
            <p className="text-gray-600">
              Platform subscription transparency (view-only)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-violet-50 text-violet-700 border-violet-200 px-3 py-1.5"
          >
            <Lock className="w-3 h-3 mr-1" />
            View Only
          </Badge>
          <Button variant="outline" onClick={fetchBillingData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Revenue Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.monthlyRecurring / 100)}
            </div>
            <p className={`text-xs mt-1 flex items-center gap-1 ${stats.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.revenueChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {stats.revenueChange >= 0 ? "+" : ""}{stats.revenueChange}% vs last month
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
              <Users className="w-4 h-4" />
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.newSubscriptionsThisMonth}
            </div>
            <p className="text-xs text-gray-500 mt-1">New subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.pendingInvoices}
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.overdueInvoices} overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {billingData.monthlyRevenue.map((month, index) => {
                const maxValue = Math.max(...billingData.monthlyRevenue.map((m) => m.revenue));
                const height = maxValue > 0 ? (month.revenue / maxValue) * 100 : 0;
                const isCurrentMonth = index === billingData.monthlyRevenue.length - 1;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative group">
                      <div
                        className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${Math.max(height, 4)}%`,
                          background: isCurrentMonth
                            ? "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)"
                            : "linear-gradient(135deg, rgb(167 139 250) 0%, rgb(147 51 234) 100%)",
                        }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {formatCurrency(month.revenue / 100)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Plan Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan Type</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getRevenueByPlanForDisplay()
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .map((plan) => (
                  <div key={plan.planName} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{plan.planName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{plan.percentage}%</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(plan.totalRevenue)}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${plan.percentage}%`,
                          background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {plan.subscriptionCount} school{plan.subscriptionCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Total Monthly Revenue</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenueByPlan)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans (VIEW ONLY) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Available plans for schools (view-only)</CardDescription>
            </div>
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              <Lock className="w-3 h-3 mr-1" />
              Read Only
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {getRevenueByPlanForDisplay().map((planData, index) => {
              const price = Math.round(planData.totalRevenue / Math.max(planData.subscriptionCount, 1));
              const colors = [
                "rgb(167 139 250)", // Starter
                "rgb(139 92 246)",  // Professional
                "rgb(124 58 237)",  // Enterprise
              ];
              const color = colors[index % colors.length];

              return (
                <div
                  key={planData.planName}
                  className="rounded-xl border-2 p-6 relative border-violet-200"
                  style={{ borderColor: color }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {planData.planName}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(price)}
                      </span>
                      <span className="text-gray-500">/year</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {planData.subscriptionCount} school{planData.subscriptionCount !== 1 ? "s" : ""} subscribed
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Cannot modify plans
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            >
              <option value="">All Plans</option>
              {billingData.revenueByPlan.map((plan) => (
                <option key={plan.planName} value={plan.planName.toLowerCase()}>
                  {plan.planName}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* School Subscriptions Table (VIEW ONLY) */}
      <Card>
        <CardHeader>
          <CardTitle>School Subscriptions</CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} schools with subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Monthly Fee</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Teachers</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Next Billing</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No subscriptions found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{
                              background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                            }}
                          >
                            {sub.schoolName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{sub.schoolName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className="capitalize"
                          style={{
                            borderColor: "rgb(139 92 246)",
                            color: "rgb(124 58 237)",
                          }}
                        >
                          {sub.plan}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        {formatCurrency(sub.planPrice / 12)}/mo
                      </td>
                      <td className="py-4 px-4 text-center">{getStatusBadge(sub.status)}</td>
                      <td className="py-4 px-4 text-gray-900">{sub.students}</td>
                      <td className="py-4 px-4 text-gray-900">{sub.teachers}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(sub.renewalDate)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600"
                            title="Generate Invoice"
                            onClick={() => handleGenerateInvoice(sub.id, sub.schoolName)}
                            disabled={isGeneratingInvoice || sub.status === "canceled"}
                          >
                            {isGeneratingInvoice ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List (VIEW ONLY - Download Only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Recent invoices (view-only)</CardDescription>
            </div>
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              <Lock className="w-3 h-3 mr-1" />
              View Only
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Date</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {billingData.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  billingData.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </span>
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
                        {formatCurrency(invoice.amount / 100, invoice.currency)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600"
                            title="Download Invoice"
                            onClick={() => handleDownloadInvoice(invoice)}
                            disabled={isGeneratingInvoice}
                          >
                            {isGeneratingInvoice && selectedInvoice?.id === invoice.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Section (VIEW ONLY) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Active payment gateways (view-only)</CardDescription>
            </div>
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              <Lock className="w-3 h-3 mr-1" />
              Cannot Modify
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {billingData.paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center justify-between p-4 rounded-lg ${method.isActive ? "bg-gray-50" : "bg-gray-100 opacity-60"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.isActive ? "bg-green-100" : "bg-gray-200"}`}>
                  {method.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{method.provider}</p>
                  <p className="text-sm text-gray-500">{method.displayInfo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {method.isDefault && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Default
                  </Badge>
                )}
                <Badge variant="outline" className={method.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}>
                  {method.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tax Information (VIEW ONLY) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tax Information</CardTitle>
              <CardDescription>Current tax settings (view-only)</CardDescription>
            </div>
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              <Lock className="w-3 h-3 mr-1" />
              Cannot Modify
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">GST Rate</p>
              <p className="text-sm text-gray-500">Goods and Services Tax (Bhutan)</p>
            </div>
            <span className="text-lg font-bold text-gray-900">{billingData.currency.gstRate}%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Tax Inclusive Pricing</p>
              <p className="text-sm text-gray-500">All prices shown include tax</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Enabled
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {formatDate(billingData.generatedAt)}
      </div>
    </div>
  );
}
