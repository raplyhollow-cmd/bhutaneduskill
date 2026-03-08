/**
 * SCHOOL ADMIN - PAYROLL MANAGEMENT (Enhanced)
 *
 * Features:
 * - AI-powered one-click payroll processing
 * - Real-time progress tracking
 * - Automatic anomaly detection
 * - RMA batch disbursement
 * - Luxury UI with glassmorphism
 * - Advanced analytics dashboard
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sparkles,
  Search,
  Play,
  Download,
  Eye,
  Wallet,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Zap,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  payrollMonth: number;
  payrollYear: number;
  payrollRunId?: string;
  basicSalary: number;
  grossEarnings: number;
  totalAllowances: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: "pending" | "processing" | "paid" | "failed";
  paymentMethod: string;
  isLocked: boolean;
  payslipUrl?: string;
}

interface PayrollSummary {
  totalRecords: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
}

interface AIValidation {
  summary: string;
  anomalies?: string[];
  suggestions?: string[];
  riskLevel?: "low" | "medium" | "high";
}

interface PayrollRunResult {
  payrollRunId: string;
  status: string;
  summary: {
    totalEmployees: number;
    processedEmployees: number;
    failedEmployees: number;
    totalBasicSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    totalNetPay: number;
  };
  aiValidation?: AIValidation;
  error?: string;
  success?: boolean;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Format currency in BTN
const formatCurrency = (amount: number): string => {
  return `Nu. ${amount.toLocaleString('en-BT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function SchoolAdminPayrollPage() {
  const router = useRouter();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalRecords: 0,
    totalAmount: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [payrollProgress, setPayrollProgress] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiValidation, setAIValidation] = useState<AIValidation | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [disbursing, setDisbursing] = useState(false);

  // Fetch payroll records
  useEffect(() => {
    fetchPayrollRecords();
  }, [selectedMonth, selectedYear, statusFilter]);

  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        limit: "100",
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/school-admin/payroll/records?${params}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setRecords(data.records || []);
        if (data.analytics) {
          setSummary({
            totalRecords: data.analytics.totalEmployees || 0,
            totalAmount: data.analytics.totalNetPay || 0,
            paidCount: data.analytics.paidEmployees || 0,
            pendingCount: data.analytics.pendingEmployees || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch payroll records:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run payroll with AI validation
  const runPayroll = async () => {
    try {
      setProcessingPayroll(true);
      setPayrollProgress(0);
      setShowRunModal(false);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setPayrollProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch("/api/school-admin/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          validateWithAI: true,
        }),
      });

      clearInterval(progressInterval);
      setPayrollProgress(100);

      const data: PayrollRunResult = await response.json();

      // Check if request was successful
      if (!response.ok) {
        alert(data.error || "Failed to process payroll");
        return;
      }

      setAIValidation(data.aiValidation || null);
      await fetchPayrollRecords();
    } catch (error) {
      console.error("Failed to run payroll:", error);
      alert("Failed to process payroll. Please try again.");
    } finally {
      setProcessingPayroll(false);
      setPayrollProgress(0);
    }
  };

  // Disburse salaries via RMA
  const disburseSalaries = async () => {
    const runId = records[0]?.payrollRunId;
    if (!runId) {
      alert("No payroll run found. Please run payroll first.");
      return;
    }

    try {
      setDisbursing(true);
      const response = await fetch("/api/school-admin/payroll/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payrollRunId: runId,
          paymentMethod: "bank_transfer",
          sendNotifications: true,
          generatePayslips: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Disbursement completed!\n\nTotal: ${formatCurrency(data.disbursementSummary.totalAmount)}\nBank Transfers: ${data.disbursementSummary.bankTransfers}`);
        await fetchPayrollRecords();
      } else {
        alert(data.error?.message || data.error || "Failed to disburse salaries");
      }
    } catch (error) {
      console.error("Failed to disburse:", error);
      alert("Failed to disburse salaries. Please try again.");
    } finally {
      setDisbursing(false);
    }
  };

  // Filter records by search
  const filteredRecords = records.filter(
    (record) =>
      record.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status badge component with luxury styling
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      paid: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm",
      processing: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm",
      failed: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 shadow-sm",
      pending: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 shadow-sm",
    };

    const icons = {
      paid: <CheckCircle className="w-3 h-3" />,
      processing: <Clock className="w-3 h-3 animate-spin" />,
      failed: <XCircle className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
    };

    return (
      <Badge className={`${styles[status as keyof typeof styles] || styles.pending} gap-1.5 border px-3 py-1`}>
        {icons[status as keyof typeof icons] || icons.pending}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // AI Risk Level Badge
  const RiskBadge = ({ level }: { level?: string }) => {
    if (!level) return null;

    const styles = {
      low: "bg-emerald-100 text-emerald-700 border-emerald-300",
      medium: "bg-amber-100 text-amber-700 border-amber-300",
      high: "bg-red-100 text-red-700 border-red-300",
    };

    return (
      <Badge className={`${styles[level as keyof typeof styles]} gap-1.5 border`}>
        <AlertCircle className="w-3 h-3" />
        Risk Level: {level.toUpperCase()}
      </Badge>
    );
  };

  const hasUnpaidRecords = records.some(r => r.paymentStatus === "pending" && !r.isLocked);
  const allPaid = records.length > 0 && records.every(r => r.paymentStatus === "paid");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Payroll Management
                </h1>
                <p className="text-gray-600 mt-0.5">AI-powered salary processing & disbursement</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => router.push("/school-admin/payroll/structures")}
              className="border-slate-200 hover:bg-slate-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Structures
            </Button>
            <Button
              onClick={() => setShowRunModal(true)}
              disabled={processingPayroll}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-200"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {processingPayroll ? "Processing..." : "Run Payroll"}
            </Button>
          </div>
        </div>

        {/* AI Validation Alert */}
        <AnimatePresence>
          {aiValidation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className={`border-l-4 ${
                aiValidation.riskLevel === "high" ? "border-l-red-500 bg-red-50/50" :
                aiValidation.riskLevel === "medium" ? "border-l-amber-500 bg-amber-50/50" :
                "border-l-emerald-500 bg-emerald-50/50"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        aiValidation.riskLevel === "high" ? "bg-red-100" :
                        aiValidation.riskLevel === "medium" ? "bg-amber-100" :
                        "bg-emerald-100"
                      }`}>
                        <Sparkles className={`w-5 h-5 ${
                          aiValidation.riskLevel === "high" ? "text-red-600" :
                          aiValidation.riskLevel === "medium" ? "text-amber-600" :
                          "text-emerald-600"
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">AI Validation Complete</h4>
                        <p className="text-sm text-gray-600 mt-1">{aiValidation.summary}</p>
                        {aiValidation.anomalies && aiValidation.anomalies.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Detected Anomalies:</p>
                            <ul className="text-xs text-gray-600 list-disc list-inside">
                              {aiValidation.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={aiValidation.riskLevel} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAIValidation(null)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing Progress */}
        <AnimatePresence>
          {processingPayroll && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-violet-600">
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">Processing Payroll with AI...</p>
                        <p className="text-sm text-violet-600 font-medium">{payrollProgress}%</p>
                      </div>
                      <Progress value={payrollProgress} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalRecords}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Payroll</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Paid</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{summary.paidCount}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{summary.pendingCount}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        {hasUnpaidRecords && (
          <Card className="mb-6 border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-600">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Ready to Disburse</p>
                    <p className="text-sm text-gray-600">
                      {records.filter(r => r.paymentStatus === "pending").length} employees pending payment
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-violet-300 text-violet-700 hover:bg-violet-100"
                    disabled={disbursing}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    onClick={disburseSalaries}
                    disabled={disbursing}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  >
                    {disbursing ? "Processing..." : "Disburse via RMA"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, code, or designation..."
                  className="pl-10 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-[180px] border-slate-200">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-[120px] border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] border-slate-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>
              {monthNames[selectedMonth - 1]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-200 border-t-violet-600 mb-4"></div>
                <p>Loading payroll records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-lg font-medium text-gray-700">No payroll records found</p>
                <p className="text-sm mt-2 text-gray-500">
                  Run payroll to generate salary records for this month
                </p>
                <Button
                  onClick={() => setShowRunModal(true)}
                  className="mt-4 bg-gradient-to-r from-violet-600 to-indigo-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Payroll Now
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                      <TableHead className="font-semibold text-gray-700">Designation</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Earnings</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Deductions</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Net Pay</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{record.employeeName}</p>
                            <p className="text-sm text-gray-500">{record.employeeCode || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-gray-900">{record.designation || "—"}</p>
                            <p className="text-sm text-gray-500">{record.department || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-emerald-600 font-semibold">
                            {formatCurrency(record.totalEarnings)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-600 font-semibold">
                            {formatCurrency(record.totalDeductions)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(record.netPay)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.paymentStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/school-admin/payroll/${record.id}`)}
                              className="hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {record.paymentStatus === "paid" && record.payslipUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(record.payslipUrl, '_blank')}
                                className="hover:bg-slate-100"
                                title="Download Payslip"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Run Payroll Confirmation Modal */}
      <AnimatePresence>
        {showRunModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRunModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md shadow-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Run Payroll with AI</CardTitle>
                      <CardDescription>
                        Process salaries for {monthNames[selectedMonth - 1]} {selectedYear}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">AI Validation</span>
                      <span className="font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Enabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Anomaly Detection</span>
                      <span className="font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Enabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Auto-Attendance Sync</span>
                      <span className="font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Enabled
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    This will calculate salaries for all active employees using their assigned salary structures.
                    AI will validate the results for any anomalies.
                  </p>
                </CardContent>
                <div className="p-6 pt-0 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRunModal(false)}
                    className="flex-1 border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={runPayroll}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run Payroll
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
