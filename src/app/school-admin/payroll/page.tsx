/**
 * SCHOOL ADMIN - PAYROLL MANAGEMENT
 *
 * Features:
 * - View all payroll records
 * - Run monthly payroll
 * - Manage salary structures
 * - Generate payslips
 * - Process payments
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Search,
  Play,
  Download,
  Eye,
  Edit,
  Trash2,
  Wallet,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/payroll/calculator";
import { useRouter } from "next/navigation";

// Types
interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  payrollMonth: number;
  payrollYear: number;
  basicSalary: number;
  totalAllowances: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: "pending" | "processing" | "paid" | "failed";
  paymentMethod: string;
  isLocked: boolean;
}

interface PayrollSummary {
  totalRecords: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/school-admin/payroll?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.records || []);
        setSummary(data.summary || { totalRecords: 0, totalAmount: 0, paidCount: 0, pendingCount: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch payroll records:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run payroll for selected month
  const runPayroll = async () => {
    if (!confirm(`Are you sure you want to run payroll for ${monthNames[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    try {
      setProcessingPayroll(true);
      const response = await fetch("/api/school-admin/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Payroll processed successfully!\n\nProcessed: ${data.summary.processedEmployees} employees\nTotal Net Pay: ${formatCurrency(data.summary.totalNetPay)}\nFailed: ${data.summary.failedEmployees}`
        );
        fetchPayrollRecords();
      } else {
        alert(data.error || "Failed to process payroll");
      }
    } catch (error) {
      console.error("Failed to run payroll:", error);
      alert("Failed to process payroll. Please try again.");
    } finally {
      setProcessingPayroll(false);
    }
  };

  // Delete payroll record
  const deleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payroll record?")) {
      return;
    }

    try {
      const response = await fetch(`/api/school-admin/payroll/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchPayrollRecords();
      } else {
        alert(data.error || "Failed to delete record");
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Failed to delete record");
    }
  };

  // Update payment status
  const updatePaymentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/school-admin/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPayrollRecords();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  // Filter records by search
  const filteredRecords = records.filter(
    (record) =>
      record.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
            <CheckCircle className="w-3 h-3" /> Paid
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
            <Clock className="w-3 h-3" /> Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
            <XCircle className="w-3 h-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-1">Manage teacher salaries and payments</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => router.push("/school-admin/payroll/structures")}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Salary Structures
            </Button>
            <Button onClick={runPayroll} disabled={processingPayroll}>
              <Play className="w-4 h-4 mr-2" />
              {processingPayroll ? "Processing..." : "Run Payroll"}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalRecords}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payroll</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-green-600">{summary.paidCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, code, or designation..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
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
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
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
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>
              {monthNames[selectedMonth - 1]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No payroll records found</p>
                <p className="text-sm mt-2">Run payroll to generate salary records for this month</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{record.employeeName}</p>
                            <p className="text-sm text-gray-500">{record.employeeCode || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-gray-900">{record.designation}</p>
                            <p className="text-sm text-gray-500">{record.department}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(record.totalEarnings)}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {formatCurrency(record.totalDeductions)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(record.netPay)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.paymentStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/school-admin/payroll/${record.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {record.paymentStatus === "pending" && !record.isLocked && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updatePaymentStatus(record.id, "paid")}
                                  title="Mark as Paid"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteRecord(record.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
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
    </div>
  );
}
