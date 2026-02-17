"use client";

/**
 * STUDENT FEES PAGE
 * View fee structure and payment history
 */

import { PortalHeader } from "@/components/shared/portal-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, CheckCircle, Clock, Download, Receipt } from "lucide-react";

// Mock fee data
const mockFees = [
  {
    id: "f1",
    name: "Tuition Fee - Term 1",
    category: "tuition",
    amount: 15000,
    paid: 15000,
    waived: 0,
    dueDate: "2025-01-31",
    status: "paid",
    paidDate: "2025-01-25",
  },
  {
    id: "f2",
    name: "Library Fee",
    category: "library",
    amount: 500,
    paid: 500,
    waived: 0,
    dueDate: "2025-02-01",
    status: "paid",
    paidDate: "2025-01-28",
  },
  {
    id: "f3",
    name: "Tuition Fee - Term 2",
    category: "tuition",
    amount: 15000,
    paid: 5000,
    waived: 0,
    dueDate: "2025-04-30",
    status: "partial",
  },
  {
    id: "f4",
    name: "Lab Fee - Science",
    category: "lab",
    amount: 2000,
    paid: 0,
    waived: 0,
    dueDate: "2025-03-15",
    status: "pending",
  },
  {
    id: "f5",
    name: "Sports Fee",
    category: "sports",
    amount: 800,
    paid: 0,
    waived: 0,
    dueDate: "2025-03-01",
    status: "pending",
  },
];

const mockPayments = [
  {
    id: "p1",
    receiptNumber: "REC-2025-001234",
    feeName: "Tuition Fee - Term 1",
    amount: 15000,
    method: "bank_transfer",
    date: "2025-01-25",
  },
  {
    id: "p2",
    receiptNumber: "REC-2025-001235",
    feeName: "Library Fee",
    amount: 500,
    method: "cash",
    date: "2025-01-28",
  },
  {
    id: "p3",
    receiptNumber: "REC-2025-001240",
    feeName: "Tuition Fee - Term 2 (Partial)",
    amount: 5000,
    method: "online",
    date: "2025-02-05",
  },
];

const feeSummary = {
  totalExpected: 33300,
  totalPaid: 20500,
  totalPending: 12800,
  totalWaived: 0,
};

export default function StudentFeesPage() {
  const getStatusBadge = (status: string) => {
    const config = {
      paid: { label: "Paid", color: "bg-green-100 text-green-700" },
      partial: { label: "Partial", color: "bg-blue-100 text-blue-700" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
      overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
      waived: { label: "Waived", color: "bg-gray-100 text-gray-700" },
    };
    const { label, color } = config[status as keyof typeof config];
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="My Fees" />
      <div className="lg:ml-64 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">Nu.{feeSummary.totalExpected.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Expected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">Nu.{feeSummary.totalPaid.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
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
                  <p className="text-xl font-bold">Nu.{feeSummary.totalPending.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{mockPayments.length}</p>
                  <p className="text-xs text-muted-foreground">Receipts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Fee Structure */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Fee Structure</h3>

              <div className="space-y-3">
                {mockFees.map((fee) => {
                  const pending = fee.amount - fee.paid - fee.waived;
                  const progress = fee.amount > 0 ? (fee.paid / fee.amount) * 100 : 0;

                  return (
                    <div key={fee.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{fee.name}</p>
                            {getStatusBadge(fee.status)}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{fee.category}</p>

                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Total: Nu.{fee.amount.toLocaleString()}</span>
                            <span className="text-green-600">Paid: Nu.{fee.paid.toLocaleString()}</span>
                            {pending > 0 && (
                              <span className="text-yellow-600">Pending: Nu.{pending.toLocaleString()}</span>
                            )}
                          </div>

                          {fee.status !== "paid" && fee.status !== "waived" && (
                            <Progress value={progress} className="h-2 mt-2" />
                          )}

                          {fee.dueDate && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {new Date(fee.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {pending > 0 && (
                          <Button size="sm">Pay Now</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Payment History</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>

              <div className="space-y-3">
                {mockPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{payment.feeName}</p>
                        <p className="text-sm text-muted-foreground">
                          Receipt: {payment.receiptNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg">Nu.{payment.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="capitalize text-xs">
                          {payment.method.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <Receipt className="w-4 h-4 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
