/**
 * PARENT FEE PAYMENT PAGE
 *
 * Allows parents to:
 * - View outstanding fee balances for their children
 * - Select fees to pay
 * - Pay online using RMA (Royal Monetary Authority) payment gateway
 * - View payment history
 * - Download receipts
 *
 * Payment Methods Supported:
 * - Internet Banking
 * - Mobile Banking
 * - Card Payment
 * - QR Code Payment
 * - Mobile Wallet
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChildSelector, Child } from "@/components/parent/child-selector";
import {
  DollarSign,
  CreditCard,
  Smartphone,
  Building2,
  QrCode,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Calendar,
  User,
  ArrowRight,
  Info,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface FeeItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "pending" | "overdue" | "paid" | "partial";
  category: "tuition" | "transport" | "library" | "lab" | "sports" | "other";
  academicYear: string;
  term: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface PaymentHistory {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
  method: string;
  status: "completed" | "pending" | "failed";
  receiptUrl: string;
}

// ============================================================================
// MOCK DATA - Will be replaced with API calls
// ============================================================================

const mockChildren: Child[] = [
  {
    id: "child1",
    name: "Tashi Dorji",
    grade: "Class 10",
    school: "Yangchenphug HSS",
  },
  {
    id: "child2",
    name: "Pema Lhamo",
    grade: "Class 8",
    school: "Motithang HSS",
  },
];

const mockFees: Record<string, FeeItem[]> = {
  child1: [
    {
      id: "fee1",
      name: "Term 2 Tuition Fee",
      description: "Tuition fee for Term 2 Academic Year 2025",
      amount: 15000,
      dueDate: "2025-03-15",
      status: "pending",
      category: "tuition",
      academicYear: "2025",
      term: "Term 2",
    },
    {
      id: "fee2",
      name: "Library Fee",
      description: "Annual library membership and resources",
      amount: 500,
      dueDate: "2025-02-01",
      status: "overdue",
      category: "library",
      academicYear: "2025",
      term: "Full Year",
    },
    {
      id: "fee3",
      name: "Transport Fee",
      description: "Monthly school bus service",
      amount: 1200,
      dueDate: "2025-02-10",
      status: "overdue",
      category: "transport",
      academicYear: "2025",
      term: "February",
    },
    {
      id: "fee4",
      name: "Lab Fee",
      description: "Science laboratory materials and equipment",
      amount: 800,
      dueDate: "2025-01-15",
      status: "paid",
      category: "lab",
      academicYear: "2025",
      term: "Term 1",
    },
  ],
  child2: [
    {
      id: "fee5",
      name: "Term 2 Tuition Fee",
      description: "Tuition fee for Term 2 Academic Year 2025",
      amount: 13500,
      dueDate: "2025-03-15",
      status: "pending",
      category: "tuition",
      academicYear: "2025",
      term: "Term 2",
    },
    {
      id: "fee6",
      name: "Sports Fee",
      description: "Sports equipment and facility usage",
      amount: 300,
      dueDate: "2025-02-01",
      status: "paid",
      category: "sports",
      academicYear: "2025",
      term: "Full Year",
    },
  ],
};

const paymentMethods: PaymentMethod[] = [
  {
    id: "internet_banking",
    name: "Internet Banking",
    description: "Pay using your bank internet banking",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: "mobile_banking",
    name: "Mobile Banking",
    description: "Pay using Bhutanese mobile banking apps",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    id: "card",
    name: "Card Payment",
    description: "Pay with credit or debit card",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "qr_code",
    name: "QR Code Payment",
    description: "Scan QR code to pay",
    icon: <QrCode className="w-5 h-5" />,
  },
  {
    id: "wallet",
    name: "Mobile Wallet",
    description: "Pay using mobile wallet",
    icon: <Wallet className="w-5 h-5" />,
  },
];

const mockPaymentHistory: PaymentHistory[] = [
  {
    id: "pay1",
    transactionId: "RMA_20250201_123456",
    amount: 800,
    date: "2025-01-15",
    method: "Internet Banking",
    status: "completed",
    receiptUrl: "/receipts/pay1.pdf",
  },
  {
    id: "pay2",
    transactionId: "RMA_20250120_789012",
    amount: 300,
    date: "2025-01-20",
    method: "Mobile Banking",
    status: "completed",
    receiptUrl: "/receipts/pay2.pdf",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentFeePaymentPage() {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [paymentStep, setPaymentStep] = useState<"select" | "confirm" | "processing" | "success">("select");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Get fees for selected child
  const childFees = mockFees[selectedChild.id] || [];

  // Calculate totals
  const pendingFees = childFees.filter((f) => f.status === "pending" || f.status === "overdue");
  const overdueFees = childFees.filter((f) => f.status === "overdue");
  const totalDue = pendingFees.reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = overdueFees.reduce((sum, f) => sum + f.amount, 0);
  const selectedTotal = Array.from(selectedFees)
    .map((id) => childFees.find((f) => f.id === id))
    .filter((f): f is FeeItem => f !== undefined)
    .reduce((sum, f) => sum + f.amount, 0);

  const getStatusBadge = (status: FeeItem["status"]) => {
    const config = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Calendar },
      overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertCircle },
      paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
      partial: { label: "Partial", color: "bg-blue-100 text-blue-700", icon: Info },
    };
    const { label, color, icon: Icon } = config[status];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getCategoryIcon = (category: FeeItem["category"]) => {
    const icons = {
      tuition: <DollarSign className="w-4 h-4" />,
      transport: <Building2 className="w-4 h-4" />,
      library: <FileText className="w-4 h-4" />,
      lab: <FileText className="w-4 h-4" />,
      sports: <User className="w-4 h-4" />,
      other: <Info className="w-4 h-4" />,
    };
    return icons[category];
  };

  const toggleFeeSelection = (feeId: string) => {
    const newSelection = new Set(selectedFees);
    if (newSelection.has(feeId)) {
      newSelection.delete(feeId);
    } else {
      newSelection.add(feeId);
    }
    setSelectedFees(newSelection);
  };

  const selectAllPending = () => {
    const pendingIds = pendingFees.map((f) => f.id);
    setSelectedFees(new Set(pendingIds));
  };

  const clearSelection = () => {
    setSelectedFees(new Set());
  };

  const initiatePayment = async () => {
    if (selectedFees.size === 0 || !selectedPaymentMethod) return;

    setPaymentStep("processing");
    setProcessingPayment(true);

    // Simulate payment processing
    // In production, this would call the RMA gateway API
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setProcessingPayment(false);
    setPaymentStep("success");
  };

  const resetPayment = () => {
    setPaymentStep("select");
    setSelectedFees(new Set());
    setSelectedPaymentMethod("");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Fee Payment
        </h1>
        <p className="text-gray-600">
          Pay fees securely using RMA payment gateway
        </p>
      </div>

      {/* Child Selector */}
      <ChildSelector
        children={mockChildren}
        selectedChildId={selectedChild.id}
        onChildChange={setSelectedChild}
      />

      {/* Fee Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Due</p>
                <p className="text-2xl font-bold" style={{ color: "rgb(107 114 128)" }}>
                  Nu.{totalDue.toLocaleString()}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
              >
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  Nu.{totalOverdue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            {overdueFees.length > 0 && (
              <p className="text-xs text-red-600 mt-2">
                {overdueFees.length} fee{overdueFees.length > 1 ? "s" : ""} overdue
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Fees</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingFees}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {paymentStep === "select" && (
        <>
          {/* Fee Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Fees to Pay</CardTitle>
                  <CardDescription>
                    Choose which fees you want to pay now
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllPending}>
                    Select All Pending
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingFees.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">No pending fees for {selectedChild.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {childFees.map((fee) => {
                    const isPending = fee.status === "pending" || fee.status === "overdue";
                    const isSelected = selectedFees.has(fee.id);

                    return (
                      <div
                        key={fee.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isSelected
                            ? "border-gray-500 bg-gray-50"
                            : isPending
                            ? "border-gray-200 hover:border-gray-300"
                            : "border-gray-100 bg-gray-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            id={fee.id}
                            checked={isSelected}
                            onChange={() => isPending && toggleFeeSelection(fee.id)}
                            disabled={!isPending}
                            className="mt-1 w-4 h-4 text-gray-600 rounded focus:ring-gray-500 disabled:opacity-50"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <label
                                  htmlFor={fee.id}
                                  className={`font-medium ${isPending ? "cursor-pointer" : ""}`}
                                >
                                  {fee.name}
                                </label>
                                <p className="text-sm text-gray-600 mt-1">{fee.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Due: {new Date(fee.dueDate).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    {getCategoryIcon(fee.category)}
                                    {fee.category}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">Nu.{fee.amount.toLocaleString()}</p>
                                {getStatusBadge(fee.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          {selectedFees.size > 0 && (
            <Card
              className="border-2"
              style={{ borderColor: "rgb(107 114 128)" }}
            >
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
                <CardDescription>
                  Choose your preferred payment method (Total: Nu.{selectedTotal.toLocaleString()})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-gray-500 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      disabled={method.disabled}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedPaymentMethod === method.id
                              ? "bg-white"
                              : "bg-gray-100"
                          }`}
                          style={
                            selectedPaymentMethod === method.id
                              ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                              : {}
                          }
                        >
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === method.id ? "border-gray-600" : "border-gray-300"
                          }`}
                        >
                          {selectedPaymentMethod === method.id && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: "rgb(107 114 128)" }}
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Proceed Button */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{selectedFees.size}</span> fee
                    {selectedFees.size > 1 ? "s" : ""} selected
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setPaymentStep("confirm")}
                    disabled={!selectedPaymentMethod}
                    className="min-w-[200px]"
                    style={{
                      background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
                    }}
                  >
                    Proceed to Payment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {paymentStep === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Payment</CardTitle>
            <CardDescription>
              Please review your payment details before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Payment Summary</h3>

              <div className="space-y-3">
                {Array.from(selectedFees)
                  .map((id) => childFees.find((f) => f.id === id))
                  .filter((f): f is FeeItem => f !== undefined)
                  .map((fee) => (
                    <div key={fee.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="font-medium">{fee.name}</p>
                        <p className="text-sm text-gray-500">{fee.term} - {fee.academicYear}</p>
                      </div>
                      <p className="font-semibold">Nu.{fee.amount.toLocaleString()}</p>
                    </div>
                  ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                <p className="text-lg font-bold">Total Amount</p>
                <p className="text-2xl font-bold" style={{ color: "rgb(107 114 128)" }}>
                  Nu.{selectedTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Payment Method</h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.icon}
                <span className="font-medium">
                  {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name}
                </span>
              </div>
            </div>

            {/* Student Info */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Paying For</h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                >
                  {selectedChild.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{selectedChild.name}</p>
                  <p className="text-sm text-gray-500">{selectedChild.grade}</p>
                </div>
              </div>
            </div>

            {/* RMA Notice */}
            <div
              className="mt-6 p-4 rounded-lg border"
              style={{ background: "linear-gradient(to right, rgb(249 250 251), rgb(243 244 246))" }}
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 mt-0.5" style={{ color: "rgb(107 114 128)" }} />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Secure Payment by RMA</p>
                  <p>
                    You will be redirected to the Royal Monetary Authority of Bhutan payment
                    gateway. Your payment information is secure and encrypted.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setPaymentStep("select")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={initiatePayment}
                disabled={processingPayment}
                style={{
                  background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
                }}
              >
                {processingPayment ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay Nu.{selectedTotal.toLocaleString()}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentStep === "processing" && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div
                  className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: "rgb(107 114 128) transparent transparent transparent" }}
                ></div>
              </div>
              <h2 className="text-xl font-bold mb-2">Processing Your Payment</h2>
              <p className="text-gray-600 mb-6">
                Please wait while we connect to the RMA payment gateway...
              </p>
              <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">Payment Details:</p>
                <p>Amount: Nu.{selectedTotal.toLocaleString()}</p>
                <p>Student: {selectedChild.name}</p>
                <p>Fees: {selectedFees.size} item(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentStep === "success" && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)" }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your payment of Nu.{selectedTotal.toLocaleString()} has been processed successfully.
              </p>
              <div className="max-w-md mx-auto bg-green-50 rounded-lg p-4 text-sm text-green-800 mb-6">
                <p className="font-medium mb-2">Transaction ID: RMA_{Date.now()}</p>
                <p>A receipt has been sent to your registered email.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={resetPayment}>
                  Make Another Payment
                </Button>
                <Button
                  style={{
                    background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
                  }}
                  asChild
                >
                  <Link href="/parent">
                    Return to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Your payment history for the current academic year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {mockPaymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(payment.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{payment.transactionId}</td>
                    <td className="py-3 px-4 font-medium">Nu.{payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">{payment.method}</td>
                    <td className="py-3 px-4 text-center">
                      {payment.status === "completed" ? (
                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                      ) : (
                        <Badge variant="outline">{payment.status}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={payment.receiptUrl}>
                          <Download className="w-4 h-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="pt-4">
        <Button variant="outline" asChild>
          <Link href="/parent">
            ← Back to Parent Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
