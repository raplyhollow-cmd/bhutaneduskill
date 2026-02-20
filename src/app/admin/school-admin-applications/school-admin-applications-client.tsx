"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Search,
  Filter,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Application {
  id: string;
  status: string;
  paymentStatus: string;
  paymentAmount: string | number | null;
  paymentDate: Date | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  appliedAt: Date | string;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  notes: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
}

interface SchoolAdminApplicationsClientProps {
  applications: Application[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingPaymentCount: number;
}

export function SchoolAdminApplicationsClient({
  applications,
  pendingCount,
  approvedCount,
  rejectedCount,
  pendingPaymentCount,
}: SchoolAdminApplicationsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showVerifyPaymentDialog, setShowVerifyPaymentDialog] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: "",
    reference: "",
    method: "bank_transfer",
  });
  const [loading, setLoading] = useState<string | null>(null);

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      app.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = async (applicationId: string) => {
    setLoading(applicationId);
    try {
      const response = await fetch(`/api/admin/school-admin-applications/${applicationId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to approve application");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    setLoading(selectedApplication.id);
    try {
      const response = await fetch(`/api/admin/school-admin-applications/${selectedApplication.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason }),
      });

      if (response.ok) {
        setShowRejectDialog(false);
        setRejectionReason("");
        setSelectedApplication(null);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to reject application");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedApplication) return;
    setLoading(selectedApplication.id);
    try {
      const response = await fetch(`/api/admin/school-admin-applications/${selectedApplication.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "paid",
          paymentAmount: parseFloat(paymentDetails.amount),
          paymentReference: paymentDetails.reference,
          paymentMethod: paymentDetails.method,
          paymentDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setShowVerifyPaymentDialog(false);
        setPaymentDetails({ amount: "", reference: "", method: "bank_transfer" });
        setSelectedApplication(null);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to verify payment");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <DollarSign className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Payment Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            School Admin Applications
          </h1>
          <p className="text-gray-600">
            Review and approve school administrator signup applications
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Approved applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Rejected applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingPaymentCount}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by school name, code, or admin details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[150px] justify-between">
                  {statusFilter === "all"
                    ? "All Status"
                    : statusFilter === "pending_approval"
                    ? "Pending"
                    : statusFilter === "approved"
                    ? "Approved"
                    : "Rejected"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending_approval")}>
                  Pending Approval
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("approved")}>Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Rejected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            {filteredApplications.length} {filteredApplications.length === 1 ? "application" : "applications"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">No applications found</p>
                <p className="text-gray-500 text-sm">
                  {statusFilter !== "all" || searchQuery
                    ? "Try adjusting your filters"
                    : "Applications will appear here when school admins sign up"}
                </p>
              </div>
            ) : (
              filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Application Details */}
                    <div className="flex-1 space-y-4">
                      {/* School Info */}
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{
                            background: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
                          }}
                        >
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{application.schoolName}</h3>
                          <p className="text-sm text-gray-500">School Code: {application.schoolCode}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(application.status)}
                          {getPaymentStatusBadge(application.paymentStatus)}
                        </div>
                      </div>

                      {/* Admin Info */}
                      <div className="grid sm:grid-cols-2 gap-4 pl-16">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{application.userName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{application.userEmail}</span>
                          </div>
                          {application.userPhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{application.userPhone}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Applied: {formatDate(application.appliedAt)}</span>
                          </div>
                          {application.paymentAmount && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                Amount: Nu.{application.paymentAmount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {application.paymentReference && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="w-4 h-4" />
                              <span>Ref: {application.paymentReference}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {application.status === "rejected" && application.rejectionReason && (
                        <div className="pl-16">
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-900">
                              <strong>Rejection Reason:</strong> {application.rejectionReason}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 lg:w-40">
                      {application.status === "pending_approval" && (
                        <>
                          {application.paymentStatus !== "paid" ? (
                            <Button
                              variant="outline"
                              className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowVerifyPaymentDialog(true);
                              }}
                              disabled={loading === application.id}
                            >
                              {loading === application.id ? "Processing..." : "Verify Payment"}
                            </Button>
                          ) : (
                            <>
                              <Button
                                className="flex-1"
                                style={{
                                  background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
                                }}
                                onClick={() => handleApprove(application.id)}
                                disabled={loading === application.id}
                              >
                                {loading === application.id ? "Approving..." : "Approve"}
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowRejectDialog(true);
                                }}
                                disabled={loading === application.id}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      {application.status === "approved" && application.reviewedAt && (
                        <div className="text-sm text-gray-500 text-center">
                          Approved on {formatDate(application.reviewedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="e.g., Payment not verified, School code invalid, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            {selectedApplication && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>School:</strong> {selectedApplication.schoolName}
                  <br />
                  <strong>Applicant:</strong> {selectedApplication.userName}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || loading === selectedApplication?.id}
            >
              {loading === selectedApplication?.id ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Payment Dialog */}
      <Dialog open={showVerifyPaymentDialog} onOpenChange={setShowVerifyPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Confirm payment details for this school admin application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">Payment Amount (Nu.)</Label>
              <input
                id="paymentAmount"
                type="number"
                placeholder="e.g., 10000"
                value={paymentDetails.amount}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <div>
              <Label htmlFor="paymentReference">Payment Reference</Label>
              <input
                id="paymentReference"
                type="text"
                placeholder="e.g., Bank transaction ID, Receipt number"
                value={paymentDetails.reference}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, reference: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                value={paymentDetails.method}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, method: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="online">Online Payment</option>
                <option value="check">Check</option>
              </select>
            </div>
            {selectedApplication && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>School:</strong> {selectedApplication.schoolName}
                  <br />
                  <strong>Applicant:</strong> {selectedApplication.userName}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              style={{
                background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
              }}
              onClick={handleVerifyPayment}
              disabled={!paymentDetails.amount || !paymentDetails.reference || loading === selectedApplication?.id}
            >
              {loading === selectedApplication?.id ? "Verifying..." : "Verify & Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
