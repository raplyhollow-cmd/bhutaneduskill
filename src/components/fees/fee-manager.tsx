/**
 * FEE MANAGER
 * School admin interface for managing fees, payments, and receipts
 */
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign,
  Search,
  Plus,
  Download,
  Receipt,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
} from "lucide-react";

export interface FeeStructure {
  id: string;
  name: string;
  category: "tuition" | "transport" | "library" | "lab" | "sports" | "other";
  amount: number;
  frequency: "monthly" | "quarterly" | "yearly" | "one-time";
  dueDay?: number; // Day of month
  classId?: string;
  applicableTo: "all" | "class" | "individual";
  isActive: boolean;
}

export interface StudentFee {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  classId: string;
  className: string;
  structureId: string;
  structureName: string;
  amount: number;
  paidAmount: number;
  waivedAmount: number;
  dueDate: string;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
}

export interface Payment {
  id: string;
  studentFeeId: string;
  studentName: string;
  amount: number;
  method: "cash" | "card" | "bank_transfer" | "check" | "online";
  transactionId?: string;
  date: string;
  receiptNumber: string;
  collectedBy: string;
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
  classId?: string;
  structures: FeeStructure[];
  studentFees: StudentFee[];
  payments: Payment[];
  summary: FeeSummary;
  onCreateStructure?: (structure: Omit<FeeStructure, "id">) => void | Promise<void>;
  onRecordPayment?: (payment: Omit<Payment, "id" | "receiptNumber" | "collectedBy">) => void | Promise<void>;
  onPrintReceipt?: (paymentId: string) => void;
  onExport?: (type: "fees" | "payments" | "defaulters") => void;
}

export function FeeManager({
  classId,
  structures,
  studentFees,
  payments,
  summary,
  onCreateStructure,
  onRecordPayment,
  onPrintReceipt,
  onExport,
}: FeeManagerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "fees" | "payments" | "structures">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null);

  // Filter student fees
  const filteredFees = useMemo(() => {
    return studentFees.filter((fee) => {
      const matchesSearch =
        fee.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fee.studentRoll.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || fee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [studentFees, searchQuery, statusFilter]);

  // Calculate status badge
  const getStatusBadge = (status: StudentFee["status"]) => {
    const config = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
      partial: { label: "Partial", color: "bg-blue-100 text-blue-700" },
      paid: { label: "Paid", color: "bg-green-100 text-green-700" },
      overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
      waived: { label: "Waived", color: "bg-gray-100 text-gray-700" },
    };
    const { label, color } = config[status];
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fee Management</h1>
              <p className="text-muted-foreground">Manage student fees and payments</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onExport?.("fees")}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {onCreateStructure && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Fee Structure
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">Nu.{summary.totalExpected.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Expected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">Nu.{summary.totalCollected.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold">Nu.{summary.totalPending.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.collectionRate}%</p>
                <p className="text-xs text-muted-foreground">Collection Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={summary.defaulters > 0 ? "border-red-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.defaulters}</p>
                <p className="text-xs text-muted-foreground">Defaulters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fees">Student Fees</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.receiptNumber} • {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Nu.{payment.amount.toLocaleString()}</span>
                      <Badge variant="outline" className="capitalize">
                        {payment.method.replace("_", " ")}
                      </Badge>
                      {onPrintReceipt && (
                        <Button variant="ghost" size="sm" onClick={() => onPrintReceipt(payment.id)}>
                          <Receipt className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Defaulters Alert */}
          {summary.defaulters > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Fee Defaulters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The following students have overdue fees:
                </p>
                <div className="space-y-2">
                  {studentFees
                    .filter((f) => f.status === "overdue")
                    .slice(0, 5)
                    .map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{fee.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {fee.studentRoll} • {fee.className}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            Nu.{(fee.amount - fee.paidAmount - fee.waivedAmount).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(fee.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Student Fees Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Student Fee Records</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <select
                  className="border rounded-md px-3 py-2"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="waived">Waived</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Student</th>
                      <th className="text-left py-3 px-4">Fee Type</th>
                      <th className="text-right py-3 px-4">Total</th>
                      <th className="text-right py-3 px-4">Paid</th>
                      <th className="text-right py-3 px-4">Pending</th>
                      <th className="text-left py-3 px-4">Due Date</th>
                      <th className="text-center py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFees.map((fee) => {
                      const pending = fee.amount - fee.paidAmount - fee.waivedAmount;
                      return (
                        <tr key={fee.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <p className="font-medium">{fee.studentName}</p>
                            <p className="text-sm text-muted-foreground">{fee.studentRoll}</p>
                          </td>
                          <td className="py-3 px-4">{fee.structureName}</td>
                          <td className="py-3 px-4 text-right">Nu.{fee.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-green-600">
                            Nu.{fee.paidAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-yellow-600">
                            Nu.{pending.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">{new Date(fee.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(fee.status)}</td>
                          <td className="py-3 px-4 text-right">
                            {pending > 0 && onRecordPayment && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStudent(fee)}
                              >
                                Record Payment
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Receipt No</th>
                      <th className="text-left py-3 px-4">Student</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Method</th>
                      <th className="text-left py-3 px-4">Transaction ID</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Collected By</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{payment.receiptNumber}</td>
                        <td className="py-3 px-4">{payment.studentName}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          Nu.{payment.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize">
                            {payment.method.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {payment.transactionId || "-"}
                        </td>
                        <td className="py-3 px-4">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{payment.collectedBy}</td>
                        <td className="py-3 px-4 text-right">
                          {onPrintReceipt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onPrintReceipt(payment.id)}
                            >
                              <Receipt className="w-4 h-4 mr-2" />
                              Receipt
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structures Tab */}
        <TabsContent value="structures">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {structures.map((structure) => (
                  <Card key={structure.id} className={structure.isActive ? "" : "opacity-60"}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{structure.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {structure.category} • {structure.frequency}
                          </p>
                        </div>
                        <Badge variant={structure.isActive ? "default" : "secondary"}>
                          {structure.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-2xl font-bold">Nu.{structure.amount.toLocaleString()}</span>
                        <span className="text-muted-foreground">
                          {structure.frequency === "monthly"
                            ? "/month"
                            : structure.frequency === "quarterly"
                            ? "/quarter"
                            : structure.frequency === "yearly"
                            ? "/year"
                            : ""}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {structure.applicableTo}
                        </Badge>
                        {structure.dueDay && (
                          <Badge variant="outline">Due: Day {structure.dueDay}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {selectedStudent && (
        <PaymentModal
          fee={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSubmit={(payment) => {
            onRecordPayment?.(payment);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}

interface PaymentModalProps {
  fee: StudentFee;
  onClose: () => void;
  onSubmit: (payment: Omit<Payment, "id" | "receiptNumber" | "collectedBy">) => void;
}

function PaymentModal({ fee, onClose, onSubmit }: PaymentModalProps) {
  const [amount, setAmount] = useState(fee.amount - fee.paidAmount - fee.waivedAmount);
  const [method, setMethod] = useState<Payment["method"]>("cash");
  const [transactionId, setTransactionId] = useState("");

  const handleSubmit = () => {
    onSubmit({
      studentFeeId: fee.id,
      studentName: fee.studentName,
      amount,
      method,
      transactionId: transactionId || undefined,
      date: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
          <p className="text-sm text-muted-foreground">
            {fee.studentName} • {fee.structureName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount (Nu.)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              max={fee.amount - fee.paidAmount - fee.waivedAmount}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pending: Nu.{(fee.amount - fee.paidAmount - fee.waivedAmount).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Payment Method</label>
            <select
              className="w-full border rounded-md px-3 py-2 mt-1"
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="online">Online Payment</option>
            </select>
          </div>

          {method !== "cash" && (
            <div>
              <label className="text-sm font-medium">Transaction ID</label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction/reference ID"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Record Payment</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
