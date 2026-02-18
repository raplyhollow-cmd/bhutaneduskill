/**
 * TEACHER - PAYSLIPS PAGE
 *
 * Features:
 * - View all payslips
 * - Download payslip PDF
 * - View earnings breakdown
 * - Filter by year/month
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Download,
  Eye,
  Wallet,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/payroll/calculator";

// Types
interface PayslipRecord {
  id: string;
  payrollMonth: number;
  payrollYear: number;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  basicSalary: number;
  gradePay: number;
  totalAllowances: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: string;
  paymentMethod: string;
  paidAt: string | null;
}

interface PayslipSummary {
  totalRecords: number;
  totalNetPay: number;
  totalEarnings: number;
  totalDeductions: number;
  averageNetPay: number;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TeacherPayslipsPage() {
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [summary, setSummary] = useState<PayslipSummary>({
    totalRecords: 0,
    totalNetPay: 0,
    totalEarnings: 0,
    totalDeductions: 0,
    averageNetPay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [expandedPayslip, setExpandedPayslip] = useState<string | null>(null);

  // Fetch payslips
  useEffect(() => {
    fetchPayslips();
  }, [selectedYear, selectedMonth]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year: selectedYear });
      if (selectedMonth !== "all") {
        params.append("month", selectedMonth);
      }

      const response = await fetch(`/api/teacher/payslips?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayslips(data.payslips || []);
        setSummary(data.summary || {
          totalRecords: 0,
          totalNetPay: 0,
          totalEarnings: 0,
          totalDeductions: 0,
          averageNetPay: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch payslips:", error);
    } finally {
      setLoading(false);
    }
  };

  // Download payslip
  const downloadPayslip = (id: string) => {
    window.open(`/api/teacher/payslips/${id}/pdf`, "_blank");
  };

  // Toggle payslip details
  const togglePayslipDetails = (id: string) => {
    setExpandedPayslip(expandedPayslip === id ? null : id);
  };

  // Status badge component
  const StatusBadge = ({ status, paidAt }: { status: string; paidAt: string | null }) => {
    if (status === "paid") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
          <CheckCircle className="w-3 h-3" /> Paid
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
        <Clock className="w-3 h-3" /> Pending
      </Badge>
    );
  };

  // Get available years from payslips
  const availableYears = Array.from(
    new Set(payslips.map((p) => p.payrollYear))
  ).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-64">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600 mt-1">View and download your salary payslips</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payslips</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalRecords}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalEarnings)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDeductions)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Pay (Avg)</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.averageNetPay)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthNames.map((name, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payslips List */}
        <Card>
          <CardHeader>
            <CardTitle>Payslip History</CardTitle>
            <CardDescription>
              {selectedYear} {selectedMonth !== "all" && `- ${monthNames[parseInt(selectedMonth) - 1]}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : payslips.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No payslips found</p>
                <p className="text-sm mt-2">Payslips will appear here once payroll is processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payslips.map((payslip) => (
                  <div key={payslip.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Summary Row */}
                    <div
                      className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={() => togglePayslipDetails(payslip.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {monthNames[payslip.payrollMonth - 1]} {payslip.payrollYear}
                          </p>
                          <p className="text-sm text-gray-500">{payslip.designation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{formatCurrency(payslip.netPay)}</p>
                          <p className="text-xs text-gray-500">Net Pay</p>
                        </div>
                        <StatusBadge status={payslip.paymentStatus} paidAt={payslip.paidAt} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPayslip(payslip.id);
                          }}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedPayslip === payslip.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedPayslip === payslip.id && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Earnings */}
                          <div>
                            <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" /> Earnings
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Basic Salary</span>
                                <span className="font-medium">{formatCurrency(payslip.basicSalary)}</span>
                              </div>
                              {payslip.gradePay > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Grade Pay</span>
                                  <span className="font-medium">{formatCurrency(payslip.gradePay)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Allowances</span>
                                <span className="font-medium">{formatCurrency(payslip.totalAllowances)}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                                <span className="font-semibold">Total Earnings</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(payslip.totalEarnings)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Deductions */}
                          <div>
                            <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" /> Deductions
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Deductions</span>
                                <span className="font-medium">{formatCurrency(payslip.totalDeductions)}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                                <span className="font-semibold">Net Payable</span>
                                <span className="font-semibold text-purple-600">
                                  {formatCurrency(payslip.netPay)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>
                              <strong>Payment Method:</strong> {payslip.paymentMethod?.replace("_", " ").toUpperCase() || "N/A"}
                            </span>
                            {payslip.paidAt && (
                              <span>
                                <strong>Paid On:</strong> {new Date(payslip.paidAt).toLocaleDateString("en-GB")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => downloadPayslip(payslip.id)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
