/**
 * STUDENT LEAVE MANAGEMENT PAGE
 *
 * Students can:
 * - View their leave request history
 * - Create new leave requests
 * - Cancel pending requests
 * - Track leave balance
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================================================
// TYPES
// ============================================================================

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
type ApplicantType = "student" | "teacher" | "staff";
type LeaveType = "sick" | "vacation" | "emergency" | "family" | "other" | "casual" | "official";

interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  applicantId: string;
  applicantType: ApplicantType;
  substituteTeacherId?: string | null;
  leaveHandoverNotes?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  documents?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  applicant?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  approver?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  substituteTeacher?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

interface LeaveBalanceInfo {
  total: number;
  used: number;
  remaining: number;
  byType: Record<string, { total: number; used: number; remaining: number }>;
}

interface LeaveResponse {
  leaveRequests: LeaveRequest[];
  leaveBalance?: LeaveBalanceInfo;
  currentUser: {
    id: string;
    type: string;
    role: string;
    canApprove: boolean;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LEAVE_TYPES: readonly { value: LeaveType; label: string; icon: string; description: string }[] = [
  { value: "sick", label: "Sick Leave", icon: "🏥", description: "For illness or medical appointments" },
  { value: "casual", label: "Casual Leave", icon: "🌴", description: "For personal matters" },
  { value: "emergency", label: "Emergency Leave", icon: "🚨", description: "For urgent situations" },
  { value: "vacation", label: "Vacation", icon: "✈️", description: "For planned holidays" },
  { value: "family", label: "Family Leave", icon: "👨‍👩‍👧‍👦", description: "For family events" },
  { value: "official", label: "Official Duty", icon: "📋", description: "For school-related activities" },
  { value: "other", label: "Other", icon: "📝", description: "Other types of leave" },
] as const;

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; icon: typeof AlertCircle }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: AlertCircle,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: XCircle,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StudentLeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { toast, success, error: toastError } = useToast();

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/leave");
        if (!response.ok) {
          throw new Error("Failed to fetch leave requests");
        }
        const data: LeaveResponse = await response.json();
        setLeaveRequests(data.leaveRequests || []);
        setLeaveBalance(data.leaveBalance || null);
      } catch (err) {
        console.error("Error fetching leave requests:", err);
        toastError({
          title: "Error",
          description: "Failed to load leave requests. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [toastError]);

  // Submit new leave request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveType || !reason || !startDate || !endDate) {
      toastError({
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      toastError({
        title: "Invalid Dates",
        description: "End date must be after start date.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: leaveType,
          reason,
          startDate,
          endDate,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add new request to list
        setLeaveRequests([data.leaveRequest, ...leaveRequests]);

        // Reset form and close dialog
        setLeaveType("");
        setReason("");
        setStartDate("");
        setEndDate("");
        setShowNewDialog(false);

        success({
          title: "Leave Request Submitted",
          description: "Your leave request has been submitted for approval.",
        });
      } else {
        toastError({
          title: "Submission Failed",
          description: data.error || "Failed to submit leave request. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error submitting leave request:", err);
      toastError({
        title: "Network Error",
        description: "Failed to submit leave request. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel leave request
  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the status in the list
        setLeaveRequests(
          leaveRequests.map((req) =>
            req.id === id ? { ...req, status: "cancelled" } : req
          )
        );
        success({
          title: "Leave Cancelled",
          description: "Your leave request has been cancelled.",
        });
      } else {
        toastError({
          title: "Cancellation Failed",
          description: data.error || "Failed to cancel leave request.",
        });
      }
    } catch (err) {
      console.error("Error cancelling leave request:", err);
      toastError({
        title: "Network Error",
        description: "Failed to cancel leave request. Please check your connection.",
      });
    }
  };

  // Calculate days between dates
  const calculateDays = (): number | null => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : null;
    }
    return null;
  };

  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeDate = (dateString: string | Date): string => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  // Filter leave requests
  const filteredRequests = filterStatus === "all"
    ? leaveRequests
    : leaveRequests.filter((req) => req.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage your leave requests and track balance</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <Select
                    value={leaveType}
                    onValueChange={(value) => setLeaveType(value as LeaveType)}
                    required
                  >
                    <SelectTrigger id="leaveType">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{type.icon}</span>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {leaveType && leaveBalance?.byType[leaveType] && (
                    <p className="text-xs text-gray-600">
                      Available balance:{" "}
                      <strong className="text-orange-600">
                        {leaveBalance.byType[leaveType].remaining} days
                      </strong>
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">From Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">To Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
                {startDate && endDate && (
                  <p className="text-sm text-gray-600">
                    Duration: <strong>{calculateDays()} day{calculateDays()! > 1 ? "s" : ""}</strong>
                  </p>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a reason for your leave request..."
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{leaveRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {leaveRequests.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leaveRequests.filter((r) => r.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Total Days Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {leaveBalance?.used || 0} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Card */}
      {leaveBalance && (
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Leave Balance ({new Date().getFullYear()})
            </CardTitle>
            <CardDescription>
              Your remaining leave balance for the current academic year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(leaveBalance.byType).map(([type, balance]) => {
                const typeInfo = LEAVE_TYPES.find((t) => t.value === type);
                const percentage = (balance.used / balance.total) * 100;
                return (
                  <div
                    key={type}
                    className="bg-white rounded-lg p-3 border border-orange-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{typeInfo?.icon}</span>
                      <span className="text-xs font-medium text-gray-700">
                        {typeInfo?.label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Used</span>
                        <span className="font-medium">{balance.used}/{balance.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-orange-600">
                        {balance.remaining} remaining
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-orange-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Balance</span>
                <span className="text-lg font-bold text-orange-700">
                  {leaveBalance.remaining} of {leaveBalance.total} days
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Your leave request history</CardDescription>
            </div>
            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-500 mb-4">
                {filterStatus !== "all"
                  ? `No ${filterStatus} leave requests found.`
                  : "You haven't submitted any leave requests yet."}
              </p>
              <Button
                onClick={() => setShowNewDialog(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status];
                const StatusIcon = statusConfig.icon;
                const leaveTypeInfo = LEAVE_TYPES.find((t) => t.value === request.type);

                // Calculate number of days
                const start = new Date(request.startDate);
                const end = new Date(request.endDate);
                const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                return (
                  <div
                    key={request.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{leaveTypeInfo?.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">
                                {leaveTypeInfo?.label}
                              </h3>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatRelativeDate(request.startDate)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{numberOfDays} day{numberOfDays > 1 ? "s" : ""}</span>
                          </div>
                          {request.approver && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                Approved by {request.approver.firstName} {request.approver.lastName}
                              </span>
                            </div>
                          )}
                          {request.rejectionReason && (
                            <div className="text-red-600">
                              <span>Reason: {request.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {request.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleCancel(request.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
