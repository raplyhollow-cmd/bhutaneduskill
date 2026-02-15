/**
 * MINISTRY OF EDUCATION - BILLING & REVENUE OVERVIEW
 *
 * VIEW-ONLY page for transparency. Ministry users can view billing data
 * but CANNOT modify any billing settings, plans, or subscriptions.
 */

"use client";

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
} from "lucide-react";
import { useState } from "react";

// Mock subscription plans (VIEW ONLY - Ministry cannot edit)
const subscriptionPlans = [
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

// Mock billing data for Ministry view
const billingData = {
  totalRevenue: 4589000,
  revenueChange: 12.5,
  activeSubscriptions: 12,
  newSubscriptionsThisMonth: 2,
  monthlyRecurring: 382416,
};

// Monthly revenue trend (last 12 months)
const monthlyRevenue = [
  { month: "Mar", revenue: 324000 },
  { month: "Apr", revenue: 358000 },
  { month: "May", revenue: 372000 },
  { month: "Jun", revenue: 368000 },
  { month: "Jul", revenue: 385000 },
  { month: "Aug", revenue: 401000 },
  { month: "Sep", revenue: 428000 },
  { month: "Oct", revenue: 415000 },
  { month: "Nov", revenue: 442000 },
  { month: "Dec", revenue: 458000 },
  { month: "Jan", revenue: 472000 },
  { month: "Feb", revenue: 498000 },
];

const invoices = [
  {
    id: "INV-2024-001",
    school: "Pelkhil School",
    plan: "Professional",
    amount: 59900,
    currency: "BTN",
    status: "paid",
    dueDate: "2024-01-15",
    paidDate: "2024-01-14",
  },
  {
    id: "INV-2024-002",
    school: "Druk School",
    plan: "Starter",
    amount: 29900,
    currency: "BTN",
    status: "paid",
    dueDate: "2024-01-20",
    paidDate: "2024-01-18",
  },
  {
    id: "INV-2024-003",
    school: "Yangchenphug HSS",
    plan: "Professional",
    amount: 59900,
    currency: "BTN",
    status: "pending",
    dueDate: "2024-02-01",
    paidDate: null,
  },
  {
    id: "INV-2024-004",
    school: "Motithang HSS",
    plan: "Enterprise",
    amount: 129900,
    currency: "BTN",
    status: "pending",
    dueDate: "2024-02-05",
    paidDate: null,
  },
  {
    id: "INV-2024-005",
    school: "Rinchen HSS",
    plan: "Starter",
    amount: 29900,
    currency: "BTN",
    status: "overdue",
    dueDate: "2024-01-10",
    paidDate: null,
  },
];

const schoolSubscriptions = [
  {
    id: 1,
    schoolName: "Pelkhil School",
    plan: "professional",
    planPrice: 59900,
    status: "active",
    students: 342,
    teachers: 28,
    startDate: "2023-12-15",
    renewalDate: "2024-12-15",
    totalPaid: 179700,
  },
  {
    id: 2,
    schoolName: "Druk School",
    plan: "starter",
    planPrice: 29900,
    status: "active",
    students: 198,
    teachers: 15,
    startDate: "2023-11-20",
    renewalDate: "2024-11-20",
    totalPaid: 59800,
  },
  {
    id: 3,
    schoolName: "Yangchenphug HSS",
    plan: "professional",
    planPrice: 59900,
    status: "trial",
    students: 456,
    teachers: 35,
    startDate: "2024-01-15",
    renewalDate: "2024-02-15",
    totalPaid: 0,
  },
  {
    id: 4,
    schoolName: "Motithang HSS",
    plan: "enterprise",
    planPrice: 129900,
    status: "active",
    students: 389,
    teachers: 42,
    startDate: "2023-10-01",
    renewalDate: "2024-10-01",
    totalPaid: 389700,
  },
  {
    id: 5,
    schoolName: "Rinchen HSS",
    plan: "starter",
    planPrice: 29900,
    status: "past_due",
    students: 267,
    teachers: 18,
    startDate: "2023-01-10",
    renewalDate: "2024-01-10",
    totalPaid: 29900,
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
    case "trial":
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
          <AlertCircle className="w-3 h-3 mr-1" />
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
  }).format(amount);
}

export default function MinistryBillingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filter subscriptions based on search and filters
  const filteredSubscriptions = schoolSubscriptions.filter((sub) => {
    const matchesSearch = sub.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = !planFilter || sub.plan === planFilter;
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate revenue by plan
  const revenueByPlan = {
    starter: schoolSubscriptions.filter(s => s.plan === "starter").length * 29900,
    professional: schoolSubscriptions.filter(s => s.plan === "professional").length * 59900,
    enterprise: schoolSubscriptions.filter(s => s.plan === "enterprise").length * 129900,
  };

  const totalRevenueByPlan = revenueByPlan.starter + revenueByPlan.professional + revenueByPlan.enterprise;

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
          <Button variant="outline">
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
              {formatCurrency(billingData.monthlyRecurring)}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +{billingData.revenueChange}% vs last month
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
              {billingData.activeSubscriptions}
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
              {billingData.newSubscriptionsThisMonth}
            </div>
            <p className="text-xs text-gray-500 mt-1">New subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{billingData.revenueChange}%
            </div>
            <p className="text-xs text-gray-500 mt-1">vs last month</p>
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
              {monthlyRevenue.map((month, index) => {
                const maxValue = Math.max(...monthlyRevenue.map(m => m.revenue));
                const height = (month.revenue / maxValue) * 100;
                const isCurrentMonth = index === monthlyRevenue.length - 1;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative group">
                      <div
                        className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${height}%`,
                          background: isCurrentMonth
                            ? "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)"
                            : "linear-gradient(135deg, rgb(167 139 250) 0%, rgb(147 51 234) 100%)",
                          minHeight: "4px",
                        }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {formatCurrency(month.revenue)}
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
              {[
                { name: "Enterprise", amount: revenueByPlan.enterprise, color: "rgb(124 58 237)", percent: (revenueByPlan.enterprise / totalRevenueByPlan) * 100 },
                { name: "Professional", amount: revenueByPlan.professional, color: "rgb(139 92 246)", percent: (revenueByPlan.professional / totalRevenueByPlan) * 100 },
                { name: "Starter", amount: revenueByPlan.starter, color: "rgb(167 139 250)", percent: (revenueByPlan.starter / totalRevenueByPlan) * 100 },
              ].map((plan) => (
                <div key={plan.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{plan.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{plan.percent.toFixed(0)}%</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(plan.amount)}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${plan.percent}%`,
                        background: plan.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(subscriptionPlans.find(p => p.name.toLowerCase() === plan.name.toLowerCase())?.price || 0)} / year
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
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border-2 p-6 relative ${
                  plan.popular
                    ? "border-violet-400 shadow-md"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-semibold"
                    style={{
                      background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
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
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Cannot modify plans
                </div>
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
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past_due">Past Due</option>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Start Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Next Billing</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => (
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
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(sub.startDate).toLocaleDateString("en-BT", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
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
                  </tr>
                ))}
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {invoice.id}
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
                          className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Stripe</p>
                <p className="text-sm text-gray-500">International payments</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900">PayPal</p>
                <p className="text-sm text-gray-500">Global payments (not configured)</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
              Inactive
            </Badge>
          </div>
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
            <span className="text-lg font-bold text-gray-900">7%</span>
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
    </div>
  );
}
