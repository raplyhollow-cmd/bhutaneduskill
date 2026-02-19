"use client";

/**
 * STUDENT FEES PAGE
 * View fee structure, payment history, and AI-powered insights
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, CheckCircle, Clock, Download, Receipt, AlertCircle, Lightbulb, CreditCard, Calendar, FileText } from "lucide-react";
import { fetchFeeStatus } from "../_actions";
import { AICareerCoach } from "@/components/ai/career-coach";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FeeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  paid: number;
  waived: number;
  dueDate: string | null;
  status: "paid" | "partial" | "pending" | "overdue";
  paidDate?: string;
}

interface Payment {
  id: string;
  receiptNumber: string;
  feeName: string;
  amount: number;
  method: string;
  date: string;
}

interface FeeData {
  id: string;
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  amountWaived: number;
  status: string;
  dueDate: string | null;
  recentPayments: Payment[];
}

// Loading skeleton
function FeesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Empty state component
function FeesEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Receipt className="w-10 h-10 text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Fee Information Available</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Your fee structure hasn't been set up yet. Please contact your school administration for details about your fees.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" asChild>
            <a href="/student/settings">Contact Admin</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentFeesPage() {
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchFeeStatus();
        setFeeData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load fee data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusBadge = (status: string, dueDate?: string | null) => {
    // Check if overdue
    if (dueDate && new Date(dueDate) < new Date() && status !== "paid") {
      return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
    }

    const config: Record<string, { label: string; color: string }> = {
      paid: { label: "Paid", color: "bg-green-100 text-green-700" },
      partial: { label: "Partial", color: "bg-blue-100 text-blue-700" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
      overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
      waived: { label: "Waived", color: "bg-gray-100 text-gray-700" },
    };
    const { label, color } = config[status] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      online: "Online Payment",
      cheque: "Cheque",
      card: "Card Payment",
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return <FeesSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Fee Data</h3>
          <p className="text-red-700">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!feeData) {
    return <FeesEmptyState />;
  }

  const paymentProgress = feeData.totalAmount > 0
    ? (feeData.amountPaid / feeData.totalAmount) * 100
    : 0;

  const hasOverduePayment = feeData.dueDate && new Date(feeData.dueDate) < new Date() && feeData.status !== "paid";
  const isPartial = feeData.status === "partial";
  const hasPending = feeData.amountPending > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fee Management</h1>
          <p className="text-slate-600 mt-1">Track your fee payments and pending dues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Statement
          </Button>
          {hasPending && (
            <Button className="text-white" style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Pending Fees
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">Nu.{feeData.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Total Fees</p>
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
                <p className="text-xl font-bold text-slate-900">Nu.{feeData.amountPaid.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Amount Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={hasOverduePayment ? "border-red-200 bg-red-50/50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                hasOverduePayment ? "bg-red-100" : "bg-yellow-100"
              )}>
                <Clock className={cn(
                  "w-6 h-6",
                  hasOverduePayment ? "text-red-600" : "text-yellow-600"
                )} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">Nu.{feeData.amountPending.toLocaleString()}</p>
                <p className={cn(
                  "text-xs",
                  hasOverduePayment ? "text-red-600 font-medium" : "text-slate-500"
                )}>
                  {hasOverduePayment ? "Overdue!" : "Pending"}
                </p>
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
                <p className="text-xl font-bold text-slate-900">{feeData.recentPayments?.length || 0}</p>
                <p className="text-xs text-slate-500">Payment Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Payment Progress
              </CardTitle>
              <CardDescription>
                {feeData.dueDate && (
                  <>Due Date: {new Date(feeData.dueDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</>
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn(
              "text-sm px-3 py-1",
              feeData.status === "paid" && "bg-green-100 text-green-700 border-green-200",
              feeData.status === "partial" && "bg-blue-100 text-blue-700 border-blue-200",
              feeData.status === "pending" && "bg-yellow-100 text-yellow-700 border-yellow-200",
            )}>
              {feeData.status.charAt(0).toUpperCase() + feeData.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Payment Progress</span>
              <span className="text-sm font-semibold text-slate-900">{Math.round(paymentProgress)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">Nu.{feeData.amountPaid.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">Nu.{feeData.amountPending.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">Nu.{feeData.amountWaived.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Waived</p>
            </div>
          </div>

          {hasOverduePayment && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Payment Overdue</p>
                <p className="text-sm text-red-700">Your fee payment was due on {new Date(feeData.dueDate!).toLocaleDateString()}. Please make the payment as soon as possible to avoid late fees.</p>
              </div>
            </div>
          )}

          {isPartial && !hasOverduePayment && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Partial Payment</p>
                <p className="text-sm text-blue-700">You've made a partial payment. Continue paying the remaining amount before the due date.</p>
              </div>
            </div>
          )}

          {feeData.status === "paid" && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">All Fees Paid</p>
                <p className="text-sm text-green-700">Congratulations! You've completed all fee payments for this term.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Payment History
                </CardTitle>
                <CardDescription>Recent payment records</CardDescription>
              </div>
              {feeData.recentPayments && feeData.recentPayments.length > 0 && (
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {feeData.recentPayments && feeData.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {feeData.recentPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Fee Payment</p>
                        <p className="text-sm text-slate-500">
                          Receipt: {payment.receiptNumber}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg text-slate-900">Nu.{payment.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="capitalize text-xs mt-1">
                          {getPaymentMethodLabel(payment.method)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <Receipt className="w-4 h-4 mr-1" />
                        View Receipt
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No payment history yet</p>
                <p className="text-sm">Your payments will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Lightbulb className="w-5 h-5" />
              AI Fee Insights
            </CardTitle>
            <CardDescription className="text-orange-700">
              Personalized guidance for managing your fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasOverduePayment && (
              <div className="p-4 bg-white/70 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 mb-2">⚠️ Overdue Payment Alert</p>
                <p className="text-sm text-orange-800">
                  Your fee payment is overdue. Contact your school immediately to discuss payment options or potential late fee waivers.
                </p>
              </div>
            )}

            {isPartial && !hasOverduePayment && (
              <div className="p-4 bg-white/70 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900 mb-2">💡 Payment Planning</p>
                <p className="text-sm text-orange-800">
                  You've paid {Math.round(paymentProgress)}% of your fees. Consider setting up a payment schedule to clear the remaining Nu.{feeData.amountPending.toLocaleString()} before the due date.
                </p>
              </div>
            )}

            {feeData.status === "paid" && (
              <div className="p-4 bg-white/70 rounded-lg border border-green-200">
                <p className="font-medium text-green-900 mb-2">✅ All Clear!</p>
                <p className="text-sm text-green-800">
                  Great job! All your fees have been paid. Keep track of upcoming term fees to maintain your payment record.
                </p>
              </div>
            )}

            <div className="p-4 bg-white/70 rounded-lg border border-orange-200">
              <p className="font-medium text-orange-900 mb-2">💰 Fee Management Tips</p>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Set up automatic reminders before due dates</li>
                <li>• Ask about scholarship opportunities</li>
                <li>• Inquire about installment payment options</li>
              </ul>
            </div>

            <Button className="w-full" variant="outline">
              <Lightbulb className="w-4 h-4 mr-2" />
              Ask AI About Fee Assistance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Career Coach for additional help */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Lightbulb className="w-5 h-5" />
            Need Help With Fees?
          </CardTitle>
          <CardDescription className="text-blue-700">
            Ask our AI assistant about scholarships, fee waivers, and financial aid options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AICareerCoach />
        </CardContent>
      </Card>
    </div>
  );
}