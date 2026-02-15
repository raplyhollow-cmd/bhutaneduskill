/**
 * PLATFORM ADMIN - BILLING & SUBSCRIPTION MANAGEMENT
 *
 * Manage billing, subscriptions, and payments for all schools/tenants.
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Types
interface SubscriptionData {
  id: string;
  schoolName: string;
  schoolCode: string;
  plan: string;
  status: string;
  students: number;
  teachers: number;
  renewalDate: string;
  totalPaid: number;
  isTrial: boolean;
  trialEndDate?: string;
  autoRenew: boolean;
  price: number;
  currency: string;
  billingCycle: string;
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
  paidDate?: string;
  pdfUrl?: string;
  paymentMethod?: string;
}

interface BillingStats {
  totalRevenue: number;
  revenueChange: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  overduePayments: number;
  monthlyRecurring: number;
}

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
}

// Default subscription plans (fallback if API doesn't return them)
const defaultSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29900,
    currency: "BTN",
    interval: "yearly",
    maxStudents: 500,
    maxTeachers: 50,
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
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(amount: number, currency: string = "BTN") {
  return new Intl.NumberFormat("en-BT", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount / 100); // Amount is stored in cents
}

export default function AdminBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    revenueChange: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    overduePayments: 0,
    monthlyRecurring: 0,
  });
  const [plans] = useState<SubscriptionPlan[]>(defaultSubscriptionPlans);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch subscriptions and stats in parallel
      const [subsResponse, invResponse] = await Promise.all([
        fetch("/api/billing/subscriptions"),
        fetch("/api/billing/invoices"),
      ]);

      if (!subsResponse.ok || !invResponse.ok) {
        throw new Error("Failed to fetch billing data");
      }

      const subsData = await subsResponse.json();
      const invData = await invResponse.json();

      if (subsData.success) {
        setSubscriptions(subsData.data || []);
        if (subsData.stats) {
          setStats({
            totalRevenue: subsData.stats.totalRevenue || 0,
            revenueChange: 12.5, // Would be calculated from historical data
            activeSubscriptions: subsData.stats.activeSubscriptions || 0,
            pendingInvoices: subsData.stats.pendingInvoices || 0,
            overduePayments: subsData.stats.overduePayments || 0,
            monthlyRecurring: subsData.stats.monthlyRecurring || 0,
          });
        }
      }

      if (invData.success) {
        setInvoices(invData.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching billing data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string>("");
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");
  const [invoiceNotes, setInvoiceNotes] = useState<string>("");

  async function handleGenerateInvoice() {
    setShowInvoiceModal(true);
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubscription || !invoiceAmount) return;

    setGeneratingInvoice(true);
    try {
      const response = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: selectedSubscription,
          amount: parseInt(invoiceAmount),
          notes: invoiceNotes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh billing data
        await fetchBillingData();
        setShowInvoiceModal(false);
        setSelectedSubscription("");
        setInvoiceAmount("");
        setInvoiceNotes("");
        // Show success feedback
        alert("Invoice generated successfully!");
      } else {
        alert(`Failed to generate invoice: ${data.error}`);
      }
    } catch (err) {
      console.error("Error creating invoice:", err);
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function handleUpdateInvoiceStatus(invoiceId: string, action: string) {
    try {
      const response = await fetch("/api/billing/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action }),
      });

      const data = await response.json();

      if (data.success) {
        fetchBillingData(); // Refresh data
        // Show success feedback
        alert(data.message || "Invoice updated successfully");
      } else {
        alert(`Failed to update invoice: ${data.error}`);
      }
    } catch (err) {
      console.error("Error updating invoice:", err);
      alert("Failed to update invoice. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBillingData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
            onClick={handleGenerateInvoice}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

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
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline" /> +{stats.revenueChange}% this year
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
            <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
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

      {/* Subscription Plans */}
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
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full ${plan.popular ? "text-white" : ""}`}
                  style={
                    plan.popular
                      ? { background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }
                      : undefined
                  }
                >
                  Edit Plan
                </Button>
              </div>
            ))}
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
                placeholder="Search schools, invoices, or plans..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trial</option>
              <option value="past_due">Past Due</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* School Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>School Subscriptions</CardTitle>
          <CardDescription>
            {subscriptions.length} schools with active subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subscriptions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Plan</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Students</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Teachers</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Renewal</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Total Paid</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{
                              background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                            }}
                          >
                            {sub.schoolName.substring(0, 2).toUpperCase()}
                          </div>
                          <Link
                            href={`/admin/schools/${sub.id}`}
                            className="font-medium text-gray-900 hover:text-pink-600 transition-colors"
                          >
                            {sub.schoolName}
                          </Link>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className="capitalize"
                          style={{
                            borderColor: "rgb(236 72 153)",
                            color: "rgb(219 39 119)",
                          }}
                        >
                          {sub.plan}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          {sub.students}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{sub.teachers}</span>
                      </td>
                      <td className="py-4 px-4 text-center">{getStatusBadge(sub.status)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(sub.renewalDate).toLocaleDateString("en-BT", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(sub.totalPaid)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
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

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest invoices generated</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All Invoices
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invoices found
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
                          {new Date(invoice.dueDate).toLocaleDateString("en-BT", {
                            month: "short",
                            day: "numeric",
                          })}
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
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {invoice.status !== "paid" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
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

      {/* Payment Settings Quick Access */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Gateway</CardTitle>
            <CardDescription>Configure payment processing</CardDescription>
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
              <Button variant="outline" size="sm">
                Configure
              </Button>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Settings</CardTitle>
            <CardDescription>Configure tax rates and rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">GST Rate</p>
                <p className="text-sm text-gray-500">Goods and Services Tax</p>
              </div>
              <span className="text-lg font-bold text-gray-900">7%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Tax Inclusive Pricing</p>
                <p className="text-sm text-gray-500">Show prices including tax</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Enabled
              </Badge>
            </div>
            <Button variant="outline" className="w-full">
              Edit Tax Settings
            </Button>
          </CardContent>
        </Card>
      </div>

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
                  Select Subscription *
                </label>
                <select
                  required
                  value={selectedSubscription}
                  onChange={(e) => setSelectedSubscription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                >
                  <option value="">Choose a subscription...</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.schoolName} - {sub.plan} ({formatCurrency(sub.price)})
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
                disabled={generatingInvoice || !selectedSubscription || !invoiceAmount}
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
    </div>
  );
}
