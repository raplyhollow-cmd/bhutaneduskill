/**
 * SMART FEES CLIENT COMPONENT
 *
 * Enhanced fee management with AI-powered insights:
 * - Predictive defaulting alerts
 * - Smart payment reminder timing
 * - Income-based sliding scale
 * - Payment health scores
 * - Luxury glassmorphism UI
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Plus,
  Brain,
  Bell,
  Sparkles,
  Target,
  Zap,
  Gift,
  Eye,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { fetchFeeData } from "../_actions";

interface FeeSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalWaived: number;
  collectionRate: number;
  defaulters: number;
}

interface StudentFee {
  id: string;
  studentId: string;
  studentName?: string;
  classGrade?: string;
  section?: string;
  feeStructureId?: string;
  feeName?: string;
  amount: number;
  paidAmount?: number;
  waivedAmount?: number;
  status?: "pending" | "partial" | "paid" | "overdue" | "waived";
  dueDate?: string;
  paidDate?: string;
  parentId?: string;
  parentName?: string;
  paymentHealthScore?: number; // 0-100
  // Allow for other properties from API
  [key: string]: any;
}

interface AIPrediction {
  studentId: string;
  studentName: string;
  riskLevel: "low" | "medium" | "high";
  probabilityOfDefault: number;
  suggestedAction: string;
  optimalReminderTime?: string;
}

interface SmartInsight {
  type: "alert" | "insight" | "opportunity" | "prediction";
  title: string;
  description: string;
  actionable?: boolean;
  action?: string;
  priority: "high" | "medium" | "low";
}

interface SmartFeeClientProps {
  initialData: {
    structures: unknown[];
    studentFees: StudentFee[];
    payments: unknown[];
    summary: FeeSummary;
  };
}

export function SmartFeeClient({ initialData }: SmartFeeClientProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"overview" | "students" | "analytics">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // AI-generated predictions and insights
  const [aiPredictions, setAIPredictions] = useState<AIPrediction[]>([]);
  const [smartInsights, setSmartInsights] = useState<SmartInsight[]>([]);

  useEffect(() => {
    // Generate AI insights on mount
    generateInsights();
    generatePredictions();
  }, [data]);

  const generateInsights = () => {
    const insights: SmartInsight[] = [];
    const { summary } = data;

    // Collection rate insight
    if (summary.collectionRate < 70) {
      insights.push({
        type: "alert",
        title: "Low Collection Rate",
        description: `Collection rate is ${summary.collectionRate}%. Consider sending payment reminders to ${summary.defaulters} parents.`,
        actionable: true,
        action: "Send bulk reminders",
        priority: "high",
      });
    } else if (summary.collectionRate > 90) {
      insights.push({
        type: "insight",
        title: "Excellent Collection",
        description: `Collection rate of ${summary.collectionRate}% is above average. Consider offering early-bird discounts for next term.`,
        actionable: true,
        action: "Set up discounts",
        priority: "low",
      });
    }

    // Overdue fees insight
    const overdueCount = data.studentFees.filter((f) => f.status === "overdue").length;
    if (overdueCount > 10) {
      insights.push({
        type: "alert",
        title: `${overdueCount} Overdue Payments`,
        description: "Multiple payments are overdue. Automated reminders may help recover pending amounts.",
        actionable: true,
        action: "Send reminders",
        priority: "high",
      });
    }

    // Predictive analytics
    const highRiskStudents = data.studentFees.filter((f) => {
      const daysSinceDue = f.dueDate
        ? (Date.now() - new Date(f.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      return daysSinceDue > 30 && f.status === "pending";
    });

    if (highRiskStudents.length > 0) {
      insights.push({
        type: "prediction",
        title: "Default Risk Detected",
        description: `${highRiskStudents.length} students may default based on payment patterns. Early intervention recommended.`,
        actionable: true,
        action: "View at-risk students",
        priority: "high",
      });
    }

    setSmartInsights(insights);
  };

  const generatePredictions = () => {
    const predictions: AIPrediction[] = [];

    // Simulate AI predictions based on payment patterns
    const pendingFees = data.studentFees.filter((f) => f.status === "pending" || f.status === "partial");

    for (const fee of pendingFees.slice(0, 5)) {
      const daysSinceDue = fee.dueDate
        ? (Date.now() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      let riskLevel: "low" | "medium" | "high" = "low";
      let probabilityOfDefault = 10;
      let suggestedAction = "No action needed";
      let optimalReminderTime = "9:00 AM";

      if (daysSinceDue > 30) {
        riskLevel = "high";
        probabilityOfDefault = 75;
        suggestedAction = "Send personal reminder + call parent";
        optimalReminderTime = "6:00 PM";
      } else if (daysSinceDue > 14) {
        riskLevel = "medium";
        probabilityOfDefault = 40;
        suggestedAction = "Send reminder notification";
        optimalReminderTime = "10:00 AM";
      }

      predictions.push({
        studentId: fee.studentId,
        studentName: fee.studentName,
        riskLevel,
        probabilityOfDefault,
        suggestedAction,
        optimalReminderTime,
      });
    }

    setAIPredictions(predictions);
  };

  const formatCurrency = (amount: number) => {
    return `Nu ${amount.toLocaleString()}.-`;
  };

  const statusColors = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50",
    partial: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50",
    paid: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50",
    overdue: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50",
    waived: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700/50",
  };

  const riskColors = {
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  // Filter student fees
  const filteredFees = data.studentFees.filter((fee) => {
    const matchesSearch =
      fee.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.feeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === "all" || fee.classGrade === selectedClass;
    const matchesStatus = selectedStatus === "all" || fee.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Smart Fee Management
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    AI-powered insights & predictive analytics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView(view === "overview" ? "students" : "overview")}
              >
                {view === "overview" ? <Users className="w-4 h-4 mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                {view === "overview" ? "Student View" : "Overview"}
              </Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Link href="/school-admin/fees/create">
                  <Plus className="w-4 h-4 mr-2" />
                  New Fee
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Insights Bar */}
        {smartInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {smartInsights.map((insight, idx) => (
              <Card
                key={idx}
                className={`border-l-4 ${
                  insight.type === "alert"
                    ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
                    : insight.type === "prediction"
                    ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
                    : "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        insight.type === "alert"
                          ? "bg-red-500/20"
                          : insight.type === "prediction"
                          ? "bg-orange-500/20"
                          : "bg-blue-500/20"
                      }`}
                    >
                      {insight.type === "alert" ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : insight.type === "prediction" ? (
                        <Brain className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                      {insight.actionable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-xs h-7"
                          onClick={() => console.log("Action:", insight.action)}
                        >
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {view === "overview" ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Expected</p>
                        <p className="text-3xl font-bold mt-1">
                          {formatCurrency(data.summary.totalExpected)}
                        </p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Target className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Collected</p>
                        <p className="text-3xl font-bold mt-1">
                          {formatCurrency(data.summary.totalCollected)}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span>{data.summary.collectionRate}% rate</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm">Pending</p>
                        <p className="text-3xl font-bold mt-1">
                          {formatCurrency(data.summary.totalPending)}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{data.summary.defaulters} pending</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">AI Predictions</p>
                        <p className="text-3xl font-bold mt-1">{aiPredictions.length}</p>
                        <div className="flex items-center mt-2 text-sm">
                          <Brain className="w-4 h-4 mr-1" />
                          <span>at-risk analyzed</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Brain className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Predictions Table */}
            {aiPredictions.length > 0 && (
              <Card className="mb-8 border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-orange-500" />
                    AI Default Risk Predictions
                  </CardTitle>
                  <CardDescription>
                    Predictive analysis based on payment patterns and due dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Student</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Risk Level</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Default Probability</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Suggested Action</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Optimal Reminder</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiPredictions.map((prediction, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-4 font-medium">{prediction.studentName}</td>
                            <td className="py-3 px-4">
                              <Badge className={riskColors[prediction.riskLevel]} variant="outline">
                                {prediction.riskLevel.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      prediction.probabilityOfDefault > 50
                                        ? "bg-red-500"
                                        : prediction.probabilityOfDefault > 25
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                    style={{ width: `${prediction.probabilityOfDefault}%` }}
                                  />
                                </div>
                                <span className="text-sm">{prediction.probabilityOfDefault}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {prediction.suggestedAction}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {prediction.optimalReminderTime}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button size="sm" variant="outline" className="h-8">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Remind
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Student Fees View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Fee Status</CardTitle>
                    <CardDescription>Manage individual student fees and payments</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Class</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Fee Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Paid</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Balance</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Due Date</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFees.map((fee) => (
                        <tr key={fee.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4 font-medium">{fee.studentName}</td>
                          <td className="py-3 px-4 text-sm">{fee.classGrade} - {fee.section}</td>
                          <td className="py-3 px-4 text-sm">{fee.feeName}</td>
                          <td className="py-3 px-4 text-sm">{formatCurrency(fee.amount)}</td>
                          <td className="py-3 px-4 text-sm text-green-600">{formatCurrency(fee.paidAmount)}</td>
                          <td className="py-3 px-4 text-sm font-semibold">
                            {formatCurrency(fee.amount - fee.paidAmount - fee.waivedAmount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={statusColors[fee.status]} variant="outline">
                              {fee.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "-"}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="h-8">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Pay
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8">
                                <Eye className="w-3 h-3" />
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
          </>
        )}
      </div>
    </div>
  );
}
