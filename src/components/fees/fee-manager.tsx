"use client";

/**
 * FEE MANAGER COMPONENT
 *
 * Comprehensive fee management system for schools.
 * Manages fee structures, student fees, payments, and receipts.
 */


import { useState } from "react";
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
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Receipt,
  FileText,
} from "lucide-react";
import Link from "next/link";

// Types
export interface FeeStructure {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "yearly" | "one-time" | "semester";
  category: "tuition" | "transport" | "library" | "lab" | "sports" | "other";
  applicableTo: "all" | "class" | "individual";
  applicableClasses?: number[];
  dueDate?: string;
  isActive: boolean;
}

export interface StudentFee {
  id: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  section: string;
  feeStructureId: string;
  feeName: string;
  amount: number;
  paidAmount: number;
  waivedAmount: number;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  dueDate: string;
  paidDate?: string;
  parentId?: string;
  parentName?: string;
}

export interface Payment {
  id: string;
  studentFeeId: string;
  studentId: string;
  studentName: string;
  amount: number;
  feeName: string;
  method: "cash" | "online" | "bank" | "waived";
  transactionId?: string;
  receivedBy: string;
  date: string;
  receiptNumber: string;
}

export interface FeeSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalWaived: number;
  collectionRate: number;
  defaulters: number;
}

interface FeeManagerProps {
  structures: FeeStructure[];
  studentFees: StudentFee[];
  payments: Payment[];
  summary: FeeSummary;
  onPrintReceipt?: (paymentId: string) => void;
  onExport?: (type: "csv" | "pdf") => void;
  onCreateStructure?: () => void;
  onRecordPayment?: () => void;
}

export function FeeManager({
  structures,
  studentFees,
  payments,
  summary,
  onPrintReceipt,
  onExport,
  onCreateStructure,
  onRecordPayment,
}: FeeManagerProps) {
  const [view, setView] = useState<"overview" | "structures" | "student-fees" | "payments">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Filter student fees
  const filteredFees = studentFees.filter((fee) => {
    const matchesSearch =
      fee.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.feeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === "all" || fee.classGrade === selectedClass;
    const matchesStatus = selectedStatus === "all" || fee.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Calculate category totals
  const categoryTotals = structures.reduce((acc, structure) => {
    const category = structure.category;
    acc[category] = (acc[category] || 0) + structure.amount;
    return acc;
  }, {} as Record<string, number>);

  const statusColors = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    partial: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    waived: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const formatCurrency = (amount: number) => {
    return `Nu ${amount.toLocaleString()}.-`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>
          <p className="text-gray-600 mt-1">Manage school fees and payments</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === "overview" ? "default" : "outline"}
            onClick={() => setView("overview")}
            className={view === "overview" ? "gap-2" : ""}
          >
            <TrendingUp className="w-4 h-4" />
            Overview
          </Button>
          <Button
            variant={view === "structures" ? "default" : "outline"}
            onClick={() => setView("structures")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Structures
          </Button>
          <Button
            variant={view === "student-fees" ? "default" : "outline"}
            onClick={() => setView("student-fees")}
          >
            <Users className="w-4 h-4 mr-2" />
            Student Fees
          </Button>
          <Button
            variant={view === "payments" ? "default" : "outline"}
            onClick={() => setView("payments")}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </Button>
        </div>
      </div>

      {/* Overview View */}
      {view === "overview" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Expected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalExpected)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalCollected)}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {summary.collectionRate.toFixed(1)}% collection rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary.totalPending)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Waived</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {formatCurrency(summary.totalWaived)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Defaulters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.defaulters}</div>
                <p className="text-xs text-gray-500 mt-1">Students with pending fees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.collectionRate.toFixed(1)}%
                  </div>
                  {summary.collectionRate >= 80 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fee Categories Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Categories</CardTitle>
              <CardDescription>Breakdown by fee type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(categoryTotals).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize text-gray-900">{category}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Latest fee transactions</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border-b border-gray-100">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{payment.studentName}</p>
                      <p className="text-sm text-gray-500">{payment.feeName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{payment.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Structures View */}
      {view === "structures" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fee Structures</CardTitle>
                <CardDescription>Define fee types and amounts</CardDescription>
              </div>
              <Button onClick={onCreateStructure}>
                <Plus className="w-4 h-4 mr-2" />
                Add Structure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {structures.map((structure) => (
                <div key={structure.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{structure.name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {structure.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={structure.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}
                      >
                        {structure.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{structure.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-semibold text-gray-900">{formatCurrency(structure.amount)}</span>
                      {structure.applicableTo !== "all" && (
                        <span className="text-gray-500">Applies to: {structure.applicableTo}</span>
                      )}
                      {structure.dueDate && (
                        <span className="text-gray-500">Due: {structure.dueDate}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Fees View */}
      {view === "student-fees" && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by student name or fee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="all">All Classes</option>
                  <option value="PP">PP</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="waived">Waived</option>
                </select>

                {onRecordPayment && (
                  <Button onClick={onRecordPayment}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student Fees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Fees</CardTitle>
              <CardDescription>Showing {filteredFees.length} of {studentFees.length} students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Class</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Fee</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Amount</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Paid</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Due Date</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFees.map((fee) => (
                      <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{fee.studentName}</p>
                            {fee.parentName && (
                              <p className="text-xs text-gray-500">Parent: {fee.parentName}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{fee.classGrade}-{fee.section}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">{fee.feeName}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(fee.amount)}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="text-sm text-gray-600">{formatCurrency(fee.paidAmount)}</p>
                          <p className="text-xs text-gray-500">
                            {((fee.paidAmount / fee.amount) * 100).toFixed(0)}%
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className={statusColors[fee.status]}>
                            {fee.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-gray-600">{fee.dueDate}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {onPrintReceipt && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onPrintReceipt(fee.id)}
                              >
                                <Receipt className="w-4 h-4" />
                              </Button>
                            )}
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

      {/* Payments View */}
      {view === "payments" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All recorded payments</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payment.studentName}</p>
                        <p className="text-sm text-gray-500">{payment.feeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Method: {payment.method}</span>
                      <span>Receipt: {payment.receiptNumber}</span>
                      <span>By: {payment.receivedBy}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-gray-500">{payment.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
