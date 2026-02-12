/**
 * TEACHER LEAVE MANAGEMENT PAGE
 *
 * Teachers can:
 * - View their leave request history
 * - Create new leave requests with substitute teacher assignment
 * - Cancel pending requests
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
  UserCog,
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

interface LeaveRequest {
  id: string;
  leaveType: string;
  reason: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  leaveHandoverNotes?: string;
  substituteTeacherId?: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  substituteTeacher?: {
    firstName: string;
    lastName: string;
  };
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave", icon: "🏥" },
  { value: "casual", label: "Casual Leave", icon: "🌴" },
  { value: "emergency", label: "Emergency Leave", icon: "🚨" },
  { value: "vacation", label: "Vacation", icon: "✈️" },
  { value: "official", label: "Official Duty", icon: "📋" },
] as const;

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertCircle,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-700",
    icon: XCircle,
  },
};

export default function TeacherLeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [substituteTeacherId, setSubstituteTeacherId] = useState("");
  const [leaveHandoverNotes, setLeaveHandoverNotes] = useState("");

  // Fetch leave requests and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leaveRes, teachersRes] = await Promise.all([
          fetch("/api/leave"),
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

    fetchData();
  }, []);

  // Submit new leave request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveType || !reason || !fromDate || !toDate) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          reason,
          fromDate,
          toDate,
          substituteTeacherId,
          leaveHandoverNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeaveRequests([data.leaveRequest, ...leaveRequests]);
        setLeaveType("");
        setReason("");
        setFromDate("");
        setToDate("");
        setSubstituteTeacherId("");
        setLeaveHandoverNotes("");
        setShowNewDialog(false);
      } else {
        alert(data.error || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert("Failed to submit leave request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel leave request
  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) {
      return;
    }

    try {
      const response = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await response.json();

      if (data.success) {
        setLeaveRequests(
          leaveRequests.map((req) =>
            req.id === id ? { ...req, status: "cancelled" } : req
          )
        );
      } else {
        alert(data.error || "Failed to cancel leave request");
      }
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      alert("Failed to cancel leave request. Please try again.");
    }
  };

  // Calculate days between dates
  const calculateDays = () => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? `${days} day${days > 1 ? "s" : ""}` : "Invalid dates";
    }
    return "";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage your leave requests and substitutions</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request and assign a substitute teacher
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <Select value={leaveType} onValueChange={setLeaveType} required>
                    <SelectTrigger id="leaveType">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date *</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date *</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                {fromDate && toDate && (
                  <p className="text-sm text-gray-600">
                    Duration: <strong>{calculateDays()}</strong>
                  </p>
                )}

                {/* Substitute Teacher */}
                <div className="space-y-2">
                  <Label htmlFor="substitute">Substitute Teacher (Optional)</Label>
                  <Select value={substituteTeacherId} onValueChange={setSubstituteTeacherId}>
                    <SelectTrigger id="substitute">
                      <SelectValue placeholder="Select substitute teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Handover Notes */}
                <div className="space-y-2">
                  <Label htmlFor="handover">Handover Notes</Label>
                  <Textarea
                    id="handover"
                    value={leaveHandoverNotes}
                    onChange={(e) => setLeaveHandoverNotes(e.target.value)}
                    placeholder="Notes for substitute teacher about classes and topics..."
                    rows={2}
                  />
                </div>

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
            <CardTitle className="text-xs font-medium text-gray-500">Leave Days (This Year)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {leaveRequests.reduce((total, req) => total + (req.status === "approved" ? req.numberOfDays : 0), 0)} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Your leave request history</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-500 mb-4">
                You haven't submitted any leave requests yet.
              </p>
              <Button onClick={() => setShowNewDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status];
                const StatusIcon = statusConfig.icon;
                const leaveTypeInfo = LEAVE_TYPES.find(t => t.value === request.leaveType);

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
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {leaveTypeInfo?.label}
                              </h3>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{request.numberOfDays} day{request.numberOfDays > 1 ? "s" : ""}</span>
                          </div>
                          {request.substituteTeacher && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <UserCog className="w-4 h-4" />
                              <span>
                                Substitute: {request.substituteTeacher.firstName} {request.substituteTeacher.lastName}
                              </span>
                            </div>
                          )}
                          {request.approvedAt && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approved by {request.approvedBy?.firstName} {request.approvedBy?.lastName}</span>
                            </div>
                          )}
                          {request.rejectionReason && (
                            <div className="text-red-600">
                              <span>Reason: {request.rejectionReason}</span>
                            </div>
                          )}
                        </div>

                        {request.leaveHandoverNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Handover Notes:</p>
                            <p className="text-sm text-blue-700 mt-1">{request.leaveHandoverNotes}</p>
                          </div>
                        )}
                      </div>

                      {request.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
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
