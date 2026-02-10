/**
 * TEACHER EARNINGS PAGE
 * View tuition earnings, payment history, and payout information
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Users,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

// Mock data - will be replaced with real data from database
const mockEarningsData = {
  totalEarnings: 45600,
  currentMonthEarnings: 12400,
  pendingEarnings: 3200,
  lastPayout: 8500,
  lastPayoutDate: "January 31, 2026",
  nextPayoutDate: "February 28, 2026",
  currency: "Nu.",
};

const mockTransactions = [
  {
    id: "txn-1",
    type: "course_sale",
    title: "Introduction to Algebra - Full Course",
    amount: 2500,
    fee: 250,
    netAmount: 2250,
    status: "completed" as const,
    date: "2026-02-08",
    student: "Tashi Dorji",
    enrollmentCount: 9,
  },
  {
    id: "txn-2",
    type: "live_session",
    title: "Calculus Live Session - 4 Classes",
    amount: 1600,
    fee: 160,
    netAmount: 1440,
    status: "completed" as const,
    date: "2026-02-07",
    student: "Karma Wangmo",
  },
  {
    id: "txn-3",
    type: "payout",
    title: "Monthly Payout - January 2026",
    amount: -8500,
    status: "completed" as const,
    date: "2026-01-31",
    method: "Bank Transfer",
  },
  {
    id: "txn-4",
    type: "course_sale",
    title: "Advanced Mathematics - Module 1",
    amount: 1800,
    fee: 180,
    netAmount: 1620,
    status: "pending" as const,
    date: "2026-02-10",
    student: "Pema Lhamo",
  },
  {
    id: "txn-5",
    type: "live_session",
    title: "Geometry Crash Course",
    amount: 1200,
    fee: 120,
    netAmount: 1080,
    status: "processing" as const,
    date: "2026-02-09",
    student: "Dorji Wangchuk",
  },
];

const mockCourseStats = [
  {
    id: "course-1",
    title: "Introduction to Algebra",
    type: "Recorded Course",
    enrollments: 45,
    totalRevenue: 112500,
    avgRating: 4.7,
    price: 2500,
    completionRate: 82,
  },
  {
    id: "course-2",
    title: "Calculus Masterclass",
    type: "Live Sessions",
    enrollments: 12,
    totalRevenue: 19200,
    avgRating: 4.9,
    price: 1600,
    sessionsCompleted: 8,
  },
  {
    id: "course-3",
    title: "Geometry Basics",
    type: "Physical Tuition",
    enrollments: 8,
    totalRevenue: 6400,
    avgRating: 4.5,
    price: 800,
  },
];

type TimePeriod = "all" | "month" | "quarter" | "year";
type TransactionStatus = "all" | "completed" | "pending" | "processing";

export default function TeacherEarningsPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter transactions
  const filteredTransactions = mockTransactions.filter((txn) => {
    const matchesStatus = statusFilter === "all" || txn.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      txn.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ("student" in txn && txn.student?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "course_sale":
        return <BookOpen className="w-4 h-4 text-green-600" />;
      case "live_session":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "payout":
        return <Wallet className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track your tuition earnings and payouts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Statement
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription>Total Earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {mockEarningsData.currency} {mockEarningsData.totalEarnings.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {mockEarningsData.currency} {mockEarningsData.currentMonthEarnings.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {mockEarningsData.currency} {mockEarningsData.pendingEarnings.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription>Last Payout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {mockEarningsData.currency} {mockEarningsData.lastPayout.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{mockEarningsData.lastPayoutDate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Info Banner */}
      <Card className="border-blue-200" style={{ background: "linear-gradient(to right, rgb(239 246 255), rgb(219 234 254))" }}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Next Payout Date</p>
                <p className="text-sm text-blue-700">
                  Scheduled for {mockEarningsData.nextPayoutDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-blue-600">Estimated Amount</p>
                <p className="font-semibold text-blue-900">
                  {mockEarningsData.currency} {mockEarningsData.pendingEarnings.toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transactions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>Recent earnings and payouts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={timePeriod} onValueChange={(v: TimePeriod) => setTimePeriod(v)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(v: TransactionStatus) => setStatusFilter(v)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No transactions found
                  </div>
                ) : (
                  filteredTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          {getTransactionIcon(txn.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{txn.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(txn.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {"student" in txn && txn.student && (
                              <span> • {txn.student}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            txn.amount < 0 ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {txn.amount < 0 ? "-" : "+"}
                          {mockEarningsData.currency}{" "}
                          {Math.abs(txn.netAmount || txn.amount).toLocaleString()}
                        </p>
                        {getStatusBadge(txn.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Performance */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Course Performance
              </CardTitle>
              <CardDescription>Your top performing courses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockCourseStats.map((course) => (
                <div
                  key={course.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-xs text-gray-500">{course.type}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {course.avgRating} ★
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Enrollments</p>
                      <p className="font-semibold text-gray-900">{course.enrollments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="font-semibold text-green-600">
                        {mockEarningsData.currency} {course.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {"completionRate" in course && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Completion</span>
                        <span className="font-medium">{course.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
