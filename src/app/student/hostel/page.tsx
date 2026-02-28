"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT HOSTEL PAGE
 *
 * Students can:
 * - View their hostel allocation (if any)
 * - Request hostel accommodation
 * - View hostel facilities and rules
 * - Request leave from hostel
 * - View attendance record
 * - Track fee payments
 * - Submit complaints
 * - Request room change
 */


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Bed,
  Users,
  Calendar,
  MapPin,
  Utensils,
  Wifi,
  Shield,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  LogOut,
  DollarSign,
  FileText,
  Home,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ============================================================================
// Types
// ============================================================================

interface HostelAllocation {
  id: string;
  hostelId: string;
  roomId: string;
  bedNumber?: string;
  roomType?: string;
  feeAmount?: number;
  feePaid?: number;
  feeOutstanding?: number;
  checkInDate?: string;
  hostel?: {
    id: string;
    name: string;
    type: string;
    code?: string;
  };
  room?: {
    id: string;
    roomNumber: string;
    floor: number;
    capacity: number;
  };
  recentPayments?: HostelPayment[];
}

interface HostelPayment {
  id: string;
  feeType: string;
  amount: number;
  paymentDate: string;
  status: string;
  receiptNumber?: string;
}

interface HostelFacility {
  id: string;
  name: string;
  available: boolean;
  type?: string;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  leaveReason: string;
  fromDate: string;
  toDate: string;
  status: "pending" | "approved" | "rejected" | "completed";
  numberOfDays?: number;
  destination?: string;
  gatePassNumber?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused" | "on_leave";
  checkInTime?: string;
  leaveType?: string;
}

interface HostelComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
}

// ============================================================================
// Component
// ============================================================================

export default function StudentHostelPage() {
  const [allocation, setAllocation] = useState<HostelAllocation | null>(null);
  const [facilities, setFacilities] = useState<HostelFacility[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  });
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);
  const [rules, setRules] = useState<Array<{ id: string; title: string; description: string; category?: string }>>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasHostel, setHasHostel] = useState(false);

  // Dialog states
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [showRoomChangeDialog, setShowRoomChangeDialog] = useState(false);

  // Form states
  const [preferredRoomType, setPreferredRoomType] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "", relation: "" });

  // Leave form
  const [leaveType, setLeaveType] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [destination, setDestination] = useState("");
  const [companionName, setCompanionName] = useState("");
  const [companionPhone, setCompanionPhone] = useState("");

  // Complaint form
  const [complaintCategory, setComplaintCategory] = useState("");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");

  useEffect(() => {
    fetchHostelData();
  }, []);

  const fetchHostelData = async () => {
    try {
      setLoading(true);
      const [allocRes, facRes, leaveRes, attRes, compRes, rulesRes] = await Promise.all([
        fetch("/api/hostel?action=my-location"),
        fetch("/api/hostel?action=facilities"),
        fetch("/api/hostel?action=leave-requests"),
        fetch("/api/hostel?action=attendance"),
        fetch("/api/hostel?action=complaints"),
        fetch("/api/hostel?action=rules"),
      ]);

      const allocData = await allocRes.json();
      const facData = await facRes.json();
      const leaveData = await leaveRes.json();
      const attData = await attRes.json();
      const compData = await compRes.json();
      const rulesData = await rulesRes.json();

      setAllocation(allocData.allocation);
      setHasHostel(allocData.allocation !== null);
      setFacilities(facData.facilities || []);
      setLeaveRequests(leaveData.leaveRequests || []);
      setAttendance(attData.attendance || []);
      setAttendanceStats(attData.stats || { total: 0, present: 0, absent: 0, late: 0 });
      setComplaints(compData.complaints || []);
      setRules(rulesData.rules || []);
    } catch (error) {
      logger.error("Error fetching hostel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-allocation",
          preferredRoomType,
          specialRequirements,
          medicalConditions: {
            bloodGroup: medicalConditions,
            conditions: specialRequirements,
          },
          emergencyContact,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Hostel allocation request submitted successfully!");
        setShowRequestDialog(false);
        fetchHostelData();
      } else {
        alert(data.error || "Failed to submit request");
      }
    } catch (error) {
      logger.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-leave",
          leaveType,
          leaveReason,
          fromDate,
          toDate,
          destination,
          companionName,
          companionPhone,
          parentApproval: {
            name: emergencyContact.name,
            phone: emergencyContact.phone,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Leave request submitted successfully!");
        setShowLeaveDialog(false);
        fetchHostelData();
      } else {
        alert(data.error || "Failed to submit leave request");
      }
    } catch (error) {
      logger.error("Error submitting leave request:", error);
      alert("Failed to submit leave request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-complaint",
          category: complaintCategory,
          title: complaintTitle,
          description: complaintDescription,
          hostelId: allocation?.hostelId,
          roomId: allocation?.roomId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Complaint submitted successfully!");
        setShowComplaintDialog(false);
        fetchHostelData();
      } else {
        alert(data.error || "Failed to submit complaint");
      }
    } catch (error) {
      logger.error("Error submitting complaint:", error);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRoomChange = async () => {
    if (!allocation) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-room",
          allocationId: allocation.id,
          newRoomId: preferredRoomType,
          reason: specialRequirements,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Room change request submitted successfully!");
        setShowRoomChangeDialog(false);
      } else {
        alert(data.error || "Failed to submit room change request");
      }
    } catch (error) {
      logger.error("Error submitting room change request:", error);
      alert("Failed to submit room change request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const ROOM_TYPES = [
    { value: "single", label: "Single Room", icon: "🛏️", description: "Private room with attached bathroom" },
    { value: "double", label: "Double Sharing", icon: "👥", description: "Share with one roommate" },
    { value: "triple", label: "Triple Sharing", icon: "🛏️", description: "Share with two roommates" },
    { value: "dormitory", label: "Dormitory", icon: "🛏️", description: "Large shared room with 4-8 students" },
  ];

  const LEAVE_TYPES = [
    { value: "weekend", label: "Weekend Leave", description: "Regular weekend go-home" },
    { value: "holiday", label: "Holiday Leave", description: "During school holidays" },
    { value: "permission", label: "Short Permission", description: "Short duration permission" },
    { value: "medical", label: "Medical Leave", description: "For medical reasons" },
    { value: "emergency", label: "Emergency Leave", description: "For emergencies" },
  ];

  const COMPLAINT_CATEGORIES = [
    { value: "maintenance", label: "Maintenance", icon: "🔧" },
    { value: "electricity", label: "Electricity", icon: "⚡" },
    { value: "plumbing", label: "Plumbing", icon: "🚿" },
    { value: "furniture", label: "Furniture", icon: "🪑" },
    { value: "food", label: "Food/Mess", icon: "🍽️" },
    { value: "discipline", label: "Discipline", icon: "📋" },
    { value: "other", label: "Other", icon: "📝" },
  ];

  const getLeaveStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getAttendanceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: "text-green-600",
      absent: "text-red-600",
      late: "text-yellow-600",
      excused: "text-blue-600",
      on_leave: "text-purple-600",
    };
    return colors[status] || "text-gray-600";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="w-8 h-8 text-purple-600" />
            Hostel Accommodation
          </h1>
          <p className="text-gray-600 mt-1">
            {hasHostel ? "Manage your hostel accommodation" : "Apply for hostel accommodation"}
          </p>
        </div>
        {!hasHostel && (
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowRequestDialog(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            Request Accommodation
          </Button>
        )}
      </div>

      {!hasHostel ? (
        <>
          {/* No Allocation Card */}
          <Card>
            <CardContent className="py-16 text-center">
              <Bed className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Hostel Allocation
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                You are not currently allocated to hostel accommodation.
                If you need hostel accommodation, please submit a request.
              </p>
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowRequestDialog(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Request Accommodation
              </Button>
            </CardContent>
          </Card>

          {/* Hostel Rules Card */}
          <Card>
            <CardHeader>
              <CardTitle>Hostel Rules & Regulations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>Students must maintain discipline and follow school rules at all times within the hostel premises.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>Visitors are not allowed in student rooms without prior permission from the warden.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>All students must be in their rooms by 10:00 PM on weekdays and by 11:00 PM on weekends.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <p>Mobile phones are not permitted during study hours and after 10:00 PM.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Allocation Card */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-purple-800">Your Hostel Allocation</CardTitle>
                  <Badge className="bg-purple-600 text-white">Allocated</Badge>
                </div>
                <CardDescription>
                  {allocation?.hostel?.name} - Room {allocation?.room?.roomNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Room Number</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allocation?.room?.roomNumber || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Floor {allocation?.room?.floor}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bed Number</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allocation?.bedNumber || "N/A"}
                    </p>
                    <Badge className="mt-1" style={{
                      background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)'
                    }}>
                      {ROOM_TYPES.find(t => t.value === allocation?.roomType)?.label || allocation?.roomType || "Standard"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Check-in Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {allocation?.checkInDate
                        ? new Date(allocation.checkInDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-purple-200 flex gap-3">
                  <Button
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => setShowRoomChangeDialog(true)}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Request Room Change
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Request Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fee Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Fee Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Total Fee</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Nu. {allocation?.feeAmount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      Nu. {allocation?.feePaid || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className={`text-2xl font-bold ${(allocation?.feeOutstanding || 0) > 0 ? "text-orange-600" : "text-green-600"}`}>
                      Nu. {allocation?.feeOutstanding || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Tab */}
          <TabsContent value="leave" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Leave Requests</h2>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowLeaveDialog(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                New Leave Request
              </Button>
            </div>

            {leaveRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No leave requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {leaveRequests.map((leave) => (
                  <Card key={leave.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 capitalize">
                              {leave.leaveType.replace("_", " ")} Leave
                            </h3>
                            <Badge className={getLeaveStatusBadge(leave.status)}>
                              {leave.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                            {leave.numberOfDays && ` (${leave.numberOfDays} days)`}
                          </p>
                          {leave.destination && (
                            <p className="text-sm text-gray-600">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {leave.destination}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            {leave.leaveReason}
                          </p>
                        </div>
                        {leave.gatePassNumber && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Gate Pass</p>
                            <p className="font-mono font-semibold text-purple-600">{leave.gatePassNumber}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{attendanceStats.total}</p>
                    <p className="text-sm text-gray-600">Total Days</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{attendanceStats.present}</p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">{attendanceStats.late}</p>
                    <p className="text-sm text-gray-600">Late</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No attendance records yet</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.slice(0, 30).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          {record.checkInTime && (
                            <p className="text-sm text-gray-500">Check-in: {record.checkInTime}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-medium capitalize ${getAttendanceStatusColor(record.status)}`}>
                            {record.status.replace("_", " ")}
                          </p>
                          {record.leaveType && (
                            <p className="text-xs text-gray-500 capitalize">{record.leaveType}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Total Fee Amount</span>
                    <span className="font-semibold">Nu. {allocation?.feeAmount || 0}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-semibold text-green-600">Nu. {allocation?.feePaid || 0}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Outstanding</span>
                    <span className={`font-semibold ${(allocation?.feeOutstanding || 0) > 0 ? "text-orange-600" : "text-green-600"}`}>
                      Nu. {allocation?.feeOutstanding || 0}
                    </span>
                  </div>

                  {allocation?.recentPayments && allocation.recentPayments.length > 0 && (
                    <div className="pt-4">
                      <h4 className="font-semibold mb-3">Recent Payments</h4>
                      <div className="space-y-2">
                        {allocation.recentPayments.map((payment) => (
                          <div key={payment.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium capitalize">{payment.feeType}</p>
                              <p className="text-gray-500">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">Nu. {payment.amount}</p>
                              {payment.receiptNumber && (
                                <p className="text-xs text-gray-500">Receipt: {payment.receiptNumber}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Complaints & Issues</h2>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowComplaintDialog(true)}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                New Complaint
              </Button>
            </div>

            {complaints.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-300" />
                  <p>No complaints submitted</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {complaints.map((complaint) => (
                  <Card key={complaint.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                            <Badge
                              className={{
                                open: "bg-yellow-100 text-yellow-800",
                                in_progress: "bg-blue-100 text-blue-800",
                                resolved: "bg-green-100 text-green-800",
                                closed: "bg-gray-100 text-gray-800",
                              }[complaint.status] || "bg-gray-100 text-gray-800"}
                            >
                              {complaint.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(complaint.createdAt).toLocaleDateString()} - {complaint.category}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hostel Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                {facilities.length > 0 ? (
                  <div className="grid md:grid-cols-4 gap-4">
                    {facilities.map((facility) => (
                      <div
                        key={facility.id}
                        className={`p-4 rounded-lg border ${
                          facility.available
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            facility.available ? "bg-green-500" : "bg-gray-400"
                          }`}>
                            <span className="text-white text-lg">
                              {facility.type === "wifi" && "📶"}
                              {facility.type === "utility" && "💧"}
                              {facility.type === "recreation" && "📺"}
                              {facility.type === "study" && "📚"}
                              {facility.type === "washing" && "🧺"}
                              {facility.type === "sports" && "🏃"}
                              {!facility.type && "✓"}
                            </span>
                          </div>
                          <span
                            className={`font-medium ${
                              facility.available ? "text-green-700" : "text-gray-500"
                            }`}
                          >
                            {facility.name}
                          </span>
                        </div>
                        {!facility.available && (
                          <p className="text-xs text-gray-500 mt-2">(Coming Soon)</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No facilities information available
                  </div>
                )}
              </CardContent>
            </Card>

            {rules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hostel Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rules.map((rule, index) => (
                      <div key={rule.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{rule.title}</p>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Request Accommodation Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Hostel Accommodation</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your hostel accommodation request
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Preferred Room Type *</Label>
                <Select value={preferredRoomType} onValueChange={setPreferredRoomType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-gray-500">{type.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Special Requirements</Label>
                <Textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Any special requirements or preferences..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Medical Conditions / Blood Group</Label>
                <Input
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="Blood group and any medical conditions"
                />
              </div>

              <div className="space-y-2">
                <Label>Emergency Contact Name</Label>
                <Input
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact({...emergencyContact, name: e.target.value})}
                  placeholder="Emergency contact person name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input
                    value={emergencyContact.phone}
                    onChange={(e) => setEmergencyContact({...emergencyContact, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relation</Label>
                  <Input
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({...emergencyContact, relation: e.target.value})}
                    placeholder="Father/Mother/etc"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Info className="w-4 h-4 inline mr-1" />
                  <strong>Note:</strong> Hostel allocation is subject to availability and approval.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
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
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave Request Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Leave from Hostel</DialogTitle>
            <DialogDescription>
              Submit your leave request for warden approval
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLeave}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Leave Type *</Label>
                <Select value={leaveType} onValueChange={setLeaveType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date *</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date *</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Destination</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where are you going?"
                />
              </div>

              <div className="space-y-2">
                <Label>Reason for Leave *</Label>
                <Textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Explain why you need leave"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Companion Details (if any)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={companionName}
                    onChange={(e) => setCompanionName(e.target.value)}
                    placeholder="Companion name"
                  />
                  <Input
                    value={companionPhone}
                    onChange={(e) => setCompanionPhone(e.target.value)}
                    placeholder="Companion phone"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLeaveDialog(false)}
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
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit a Complaint</DialogTitle>
            <DialogDescription>
              Report an issue or submit a complaint
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitComplaint}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={complaintCategory} onValueChange={setComplaintCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="mr-2">{cat.icon}</span>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  placeholder="Brief title of the issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="Describe the issue in detail"
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowComplaintDialog(false)}
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
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Complaint
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room Change Dialog */}
      <Dialog open={showRoomChangeDialog} onOpenChange={setShowRoomChangeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Room Change</DialogTitle>
            <DialogDescription>
              Submit a request to change your room
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preferred Room Type</Label>
              <Select value={preferredRoomType} onValueChange={setPreferredRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred room type" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason for Change *</Label>
              <Textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Explain why you need to change rooms"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoomChangeDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestRoomChange} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
