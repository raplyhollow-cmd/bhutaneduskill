"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  FileText,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  UserCog,
  Filter,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeaveRequest {
  id: string;
  type: string;
  reason: string;
  startDate: string;
  endDate: string;
  numberOfDays?: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  leaveHandoverNotes?: string;
  substituteTeacherId?: string;
  applicantType: "student" | "teacher" | "staff";
  applicant?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  substituteTeacher?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

const LEAVE_TYPES: Record<string, { label: string; icon: string }> = {
  sick: { label: "Sick Leave", icon: "🏥" },
  casual: { label: "Casual Leave", icon: "🌴" },
  emergency: { label: "Emergency Leave", icon: "🚨" },
  vacation: { label: "Vacation", icon: "✈️" },
  official: { label: "Official Duty", icon: "📋" },
  family: { label: "Family Leave", icon: "👨‍👩‍👧‍👦" },
  other: { label: "Other", icon: "📝" },
};

const STATUS_CONFIG = {
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

export default function LeaveApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignSubstituteId, setAssignSubstituteId] = useState("");
  const [assignHandoverNotes, setAssignHandoverNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("type", filterType);

      const [leaveRes, teachersRes] = await Promise.all([
        fetch(`/api/leave?${params.toString()}`),
        fetch("/api/teachers"),
      ]);

      const leaveData = await leaveRes.json();
      const teachersData = await teachersRes.json();

      setLeaveRequests(leaveData.leaveRequests || []);
      setTeachers(teachersData.teachers || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      const response = await fetch(`/api/leave/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          substituteTeacherId: assignSubstituteId || undefined,
          leaveHandoverNotes: assignHandoverNotes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeaveRequests(
          leaveRequests.map((req) =>
            req.id === selectedRequest.id
              ? { ...req, status: "approved" as const, approvedAt: new Date().toISOString() }
              : req
          )
        );
        setApproveDialogOpen(false);
        resetDialog();
      } else {
        alert(data.error || "Failed to approve leave request");
      }
    } catch (error) {
      console.error("Error approving leave:", error);
      alert("Failed to approve leave request. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`/api/leave/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeaveRequests(
          leaveRequests.map((req) =>
            req.id === selectedRequest.id
              ? { ...req, status: "rejected" as const, rejectionReason }
              : req
          )
        );
        setRejectDialogOpen(false);
        resetDialog();
      } else {
        alert(data.error || "Failed to reject leave request");
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert("Failed to reject leave request. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const openApproveDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setAssignSubstituteId(request.substituteTeacherId || "");
    setAssignHandoverNotes(request.leaveHandoverNotes || "");
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const resetDialog = () => {
    setSelectedRequest(null);
    setRejectionReason("");
    setAssignSubstituteId("");
    setAssignHandoverNotes("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const pendingCount = leaveRequests.filter((r) => r.status === "pending").length;
  const approvedCount = leaveRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = leaveRequests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="text-gray-600 mt-1">Review and manage leave requests from teachers and students</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Total Requests</CardTitle>
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
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="casual">Casual Leave</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="official">Official Duty</SelectItem>
                <SelectItem value="family">Family Leave</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            {filterStatus !== "all" ? `Showing ${STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label} requests` : "Showing all leave requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-500">
                {filterStatus !== "all" || filterType !== "all"
                  ? "No leave requests match the current filters."
                  : "There are no leave requests to review."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status];
                const StatusIcon = statusConfig.icon;
                const leaveTypeInfo = LEAVE_TYPES[request.type] || { label: request.type, icon: "📝" };
                const numberOfDays = request.numberOfDays || calculateDays(request.startDate, request.endDate);

                return (
                  <div
                    key={request.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="text-2xl">{leaveTypeInfo.icon}</span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {leaveTypeInfo.label}
                              </h3>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {request.applicantType}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Applicant Info */}
                        {request.applicant && (
                          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span className="font-medium">
                                {request.applicant.firstName} {request.applicant.lastName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{request.applicant.email}</span>
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">
                          {request.reason}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
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
                          {request.substituteTeacher && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <UserCog className="w-4 h-4" />
                              <span>
                                Substitute: {request.substituteTeacher.firstName} {request.substituteTeacher.lastName}
                              </span>
                            </div>
                          )}
                        </div>

                        {request.leaveHandoverNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Handover Notes:</p>
                            <p className="text-sm text-blue-700 mt-1">{request.leaveHandoverNotes}</p>
                          </div>
                        )}

                        {request.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">{request.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {request.status === "pending" && (
                        <div className="flex lg:flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openApproveDialog(request)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => openRejectDialog(request)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Review and approve this leave request. Optionally assign a substitute teacher.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {LEAVE_TYPES[selectedRequest.type]?.label || selectedRequest.type}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                  ({calculateDays(selectedRequest.startDate, selectedRequest.endDate)} days)
                </p>
                <p className="text-sm text-gray-700 mt-2">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.applicantType === "teacher" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="substitute">Assign Substitute Teacher (Optional)</Label>
                    <Select value={assignSubstituteId} onValueChange={setAssignSubstituteId}>
                      <SelectTrigger id="substitute">
                        <SelectValue placeholder="Select substitute teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers
                          .filter((t) => t.id !== selectedRequest.applicant?.id)
                          .map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.firstName} {teacher.lastName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="handover">Handover Notes (Optional)</Label>
                    <Textarea
                      id="handover"
                      value={assignHandoverNotes}
                      onChange={(e) => setAssignHandoverNotes(e.target.value)}
                      placeholder="Notes for substitute teacher about classes and topics..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {LEAVE_TYPES[selectedRequest.type]?.label || selectedRequest.type}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                </p>
                <p className="text-sm text-gray-700 mt-2">{selectedRequest.reason}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason for rejecting this leave request..."
                  rows={3}
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
