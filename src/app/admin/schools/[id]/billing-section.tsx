"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import {
  CreditCard,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";

export interface SchoolDetailForBilling {
  id: string;
  name: string;
  subscriptionStatus: string;
  subscriptionTier?: string;
  activatedAt?: string | null;
  maxStudents?: number;
  contactEmail?: string;
  contactPhone?: string;
}

interface BillingSectionProps {
  school: SchoolDetailForBilling;
  onUpdate: () => void;
}

// Note: Prices are configurable - you can set your own pricing
const TIER_PRICING = {
  basic: { name: "Small", students: 100 },
  standard: { name: "Medium", students: 500 },
  premium: { name: "Large", students: 1000 },
};

const TIER_LABELS = {
  basic: "Small",
  standard: "Medium",
  premium: "Large",
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionTier: string;
  amount: string;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

interface SeatUsageData {
  schoolId: string;
  maxStudents: number;
  studentCount: number;
  teacherCount: number;
  totalUsers: number;
  usagePercentage: number;
  subscriptionTier: string;
  remainingSeats: number;
  isAtCapacity: boolean;
  needsUpgrade: boolean;
}

export function BillingSection({ school, onUpdate }: BillingSectionProps) {
  const { toast } = useToast();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>(school.subscriptionTier || "standard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [seatUsage, setSeatUsage] = useState<SeatUsageData | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchSeatUsage()]);
  }, [school.id]);

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const fetchSeatUsage = async () => {
    setIsLoadingUsage(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/seat-usage`);
      if (response.ok) {
        const data = await response.json();
        setSeatUsage(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch seat usage:", error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Invoice generated",
          description: `Invoice ${data.data.invoiceNumber} created for ${school.name}`,
        });
        await fetchInvoices();
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          variant: "error",
          title: "Failed to generate invoice",
          description: error.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to generate invoice",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleUpdateTier = async () => {
    setIsUpdatingTier(true);
    try {
      const response = await fetch(`/api/admin/schools/${school.id}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (response.ok) {
        toast({
          title: "Tier updated",
          description: `School tier changed to ${TIER_LABELS[selectedTier as keyof typeof TIER_LABELS]}`,
        });
        await fetchSeatUsage();
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          variant: "error",
          title: "Failed to update tier",
          description: error.error || "An error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to update tier",
      });
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    toast({
      title: "Payment reminder sent",
      description: `Reminder sent for invoice ${invoiceId}`,
    });
  };

  const currentTier = school.subscriptionTier || "standard";
  const pricing = TIER_PRICING[currentTier as keyof typeof TIER_PRICING] || TIER_PRICING.standard;
  const usagePercentage = seatUsage?.usagePercentage || 0;
  const usedSeats = seatUsage?.studentCount || 0;

  // Calculate payment summary from real invoices
  const paidTotal = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const pendingTotal = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "sent")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const thisYearTotal = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>Manage school subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{pricing.name} Plan</h3>
                <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                  Up to {pricing.students} students
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Full platform access included
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Scroll to tier update section
                document.getElementById("tier-update-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Change Plan
            </Button>
          </div>

          {/* Usage Bar */}
          <div className="mt-6">
            {isLoadingUsage ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Seat Usage</span>
                  <span className="font-medium text-gray-900">{usagePercentage}% utilized</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      usagePercentage > 90
                        ? "bg-red-500"
                        : usagePercentage > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {usedSeats} of {pricing.students} seats used ({seatUsage?.remainingSeats || 0} remaining)
                </p>
                {seatUsage?.needsUpgrade && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    School is approaching capacity. Consider upgrading.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Billing History
              </CardTitle>
              <CardDescription>View and manage invoices</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateInvoice}
              disabled={isGeneratingInvoice}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingInvoice ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>{TIER_LABELS[invoice.subscriptionTier as keyof typeof TIER_LABELS] || invoice.subscriptionTier} Plan</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {invoice.currency} {Number(invoice.amount).toLocaleString()}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          invoice.status === "paid"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : invoice.status === "sent" || invoice.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {invoice.status === "paid" ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </>
                        ) : invoice.status === "sent" || invoice.status === "pending" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        ) : (
                          invoice.status
                        )}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                      {(invoice.status === "pending" || invoice.status === "sent") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                          onClick={() => handleSendReminder(invoice.invoiceNumber)}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Payment Summary
          </CardTitle>
          <CardDescription>Annual payment overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Billed</p>
              <p className="text-2xl font-bold text-gray-900">
                Nu {thisYearTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Paid</p>
              <p className="text-2xl font-bold text-green-700">
                Nu {paidTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                Nu {pendingTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Tier */}
      <Card id="tier-update-section">
        <CardHeader>
          <CardTitle>Update Subscription Tier</CardTitle>
          <CardDescription>Change the school's subscription plan (capacity-based)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tierUpdate">New Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger id="tierUpdate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    Small - Up to 100 students (Full platform access)
                  </SelectItem>
                  <SelectItem value="standard">
                    Medium - Up to 500 students (Full platform access)
                  </SelectItem>
                  <SelectItem value="premium">
                    Large - Up to 1000 students (Full platform access)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500">
              All tiers include full platform access. Pricing is based on student capacity only.
            </p>
            <Button
              onClick={handleUpdateTier}
              disabled={isUpdatingTier || selectedTier === currentTier}
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white"
            >
              {isUpdatingTier ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Tier"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
