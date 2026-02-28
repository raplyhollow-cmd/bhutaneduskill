"use client";

/**
 * PARENT PORTAL - FEES PAGE
 *
 * View and manage child's fee payments including:
 * - Fee summary and breakdown
 * - Overdue alerts
 * - Payment history
 * - Online payment options
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, AlertTriangle, CheckCircle, Clock, CreditCard, FileText, Calendar } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface FeeRecord {
  id: string;
  feeType: string;
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  status: "pending" | "partial" | "paid" | "overdue";
  dueDate: string;
  paidDate?: string;
  academicYear: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  transactionId?: string;
  paidDate: string;
}

interface FeeData {
  fees: FeeRecord[];
  summary: {
    totalOutstanding: number;
    totalPaid: number;
    pendingFees: number;
  };
  recentPayments: Payment[];
}

interface ChildData {
  id: string;
  name: string;
  classGrade: number;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function FeeCard({ fee, onPay }: { fee: FeeRecord; onPay: (fee: FeeRecord) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700 border-green-200";
      case "partial": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "overdue": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const isOverdue = new Date(fee.dueDate) < new Date() && fee.status !== "paid";
  const finalStatus = isOverdue && fee.status !== "paid" ? "overdue" : fee.status;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-medium text-gray-900">{fee.feeType}</h4>
          <Badge className={getStatusColor(finalStatus)} variant="outline">
            {finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1)}
          </Badge>
          {isOverdue && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due: {new Date(fee.dueDate).toLocaleDateString()}
          </span>
          <span>{fee.academicYear}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">Nu. {fee.amountPending.toLocaleString()}</p>
        <p className="text-xs text-gray-500">
          of Nu. {fee.totalAmount.toLocaleString()}
        </p>
        {fee.status !== "paid" && (
          <Button size="sm" className="mt-2" onClick={() => onPay(fee)}>
            Pay Now
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ParentFeesPage() {
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchFeeData(selectedChildId);
    }
  }, [selectedChildId]);

  async function fetchChildren() {
    try {
      const response = await fetch("/api/parent/children");
      const data = await response.json();

      if (data.success && data.data?.children) {
        setChildren(data.data.children);
        if (data.data.children.length > 0) {
          setSelectedChildId(data.data.children[0].id);
        }
      }
    } catch (err) {
      setError("Failed to load children");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFeeData(childId: string) {
    try {
      const response = await fetch(`/api/parent/fees?studentId=${childId}`);
      const data = await response.json();

      if (data.fees || data.data?.fees) {
        setFeeData({
          fees: data.fees || data.data?.fees || [],
          summary: data.summary || data.data?.summary || { totalOutstanding: 0, totalPaid: 0, pendingFees: 0 },
          recentPayments: data.recentPayments || data.data?.recentPayments || [],
        });
      }
    } catch (err) {
      setError("Failed to load fee data");
    }
  }

  function handlePayFee(fee: FeeRecord) {
    // Navigate to payment page with fee details
    window.location.href = `/parent/fees/pay?feeId=${fee.id}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Payment</h1>
          <p className="text-gray-500">View and manage school fee payments</p>
        </div>
        {feeData?.summary.totalOutstanding > 0 && (
          <Button className="bg-orange-600 hover:bg-orange-700">
            <CreditCard className="w-4 h-4 mr-2" />
            Pay All Pending
          </Button>
        )}
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((child) => (
            <Button
              key={child.id}
              variant={selectedChildId === child.id ? "default" : "outline"}
              onClick={() => setSelectedChildId(child.id)}
            >
              {child.name} (Grade {child.classGrade})
            </Button>
          ))}
        </div>
      )}

      {feeData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">Nu. {feeData.summary.totalOutstanding.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Outstanding</p>
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
                    <p className="text-2xl font-bold text-gray-900">Nu. {feeData.summary.totalPaid.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Paid</p>
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
                    <p className="text-2xl font-bold text-gray-900">{feeData.summary.pendingFees}</p>
                    <p className="text-sm text-gray-500">Pending Fees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fees List */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
              <CardDescription>Breakdown of all fees and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {feeData.fees.length > 0 ? (
                <div className="space-y-3">
                  {feeData.fees.map((fee) => (
                    <FeeCard key={fee.id} fee={fee} onPay={handlePayFee} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No fee records found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {feeData.recentPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feeData.recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Nu. {payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {payment.method} • {new Date(payment.paidDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {payment.transactionId && (
                        <span className="text-xs text-gray-500">#{payment.transactionId}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
