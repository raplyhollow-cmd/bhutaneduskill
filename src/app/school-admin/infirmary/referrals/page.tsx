"use client";

/**
 * SCHOOL ADMIN MEDICAL REFERRALS PAGE
 *
 * School administrators can:
 * - Create external medical referrals
 * - Track referral status
 * - Manage appointments
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Phone,
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  classGrade?: number;
  section?: string;
}

interface MedicalReferral {
  id: string;
  referralDate: string;
  facilityName: string;
  facilityType: string;
  urgency: string;
  status: string;
  reason: string;
  appointmentDate?: string;
  appointmentTime?: string;
  student: Student;
  parentNotified: boolean;
}

export default function InfirmaryReferralsPage() {
  const [referrals, setReferrals] = useState<MedicalReferral[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<MedicalReferral | null>(null);

  const [addFormData, setAddFormData] = useState({
    reason: "",
    facilityName: "",
    facilityType: "hospital",
    facilityAddress: "",
    facilityPhone: "",
    urgency: "routine",
    specialty: "",
  });

  const [statusFormData, setStatusFormData] = useState({
    status: "",
    appointmentDate: "",
    appointmentTime: "",
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students
      const studentsRes = await fetch(`/api/school-admin/students?limit=200`);
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        setStudents(studentsData.data.students || []);
      }

      // Fetch referrals
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const referralsRes = await fetch(`/api/school-admin/medical/referrals?${params.toString()}`);
      const referralsData = await referralsRes.json();
      if (referralsData.success) {
        setReferrals(referralsData.data.referrals || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReferral = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert("Please select a student");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch("/api/school-admin/medical/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addFormData,
          studentId: selectedStudent.id,
          parentNotified: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddDialog(false);
        setSelectedStudent(null);
        setAddFormData({
          reason: "",
          facilityName: "",
          facilityType: "hospital",
          facilityAddress: "",
          facilityPhone: "",
          urgency: "routine",
          specialty: "",
        });
        await fetchData();
        alert("Referral created successfully!");
      } else {
        alert(data.error || "Failed to create referral");
      }
    } catch (error) {
      console.error("Error creating referral:", error);
      alert("Failed to create referral");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;

    setUpdating(true);

    try {
      const response = await fetch("/api/school-admin/medical/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReferral.id,
          ...statusFormData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowStatusDialog(false);
        setSelectedReferral(null);
        setStatusFormData({ status: "", appointmentDate: "", appointmentTime: "" });
        await fetchData();
        alert("Referral updated successfully!");
      } else {
        alert(data.error || "Failed to update referral");
      }
    } catch (error) {
      console.error("Error updating referral:", error);
      alert("Failed to update referral");
    } finally {
      setUpdating(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReferrals = referrals.filter((r) =>
    r.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-600 text-white";
      case "urgent":
        return "bg-orange-500 text-white";
      case "routine":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/school-admin/infirmary">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-purple-600" />
              Medical Referrals
            </h1>
            <p className="text-gray-600 mt-1">Manage external medical referrals</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Medical Referral</DialogTitle>
                <DialogDescription>Refer a student to an external healthcare provider</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddReferral} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedStudent(null);
                      }}
                      className="pl-10"
                    />
                  </div>
                  {searchQuery && filteredStudents.length > 0 && !selectedStudent && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {filteredStudents.slice(0, 10).map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSearchQuery("");
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                        >
                          <span>{student.name}</span>
                          <span className="text-sm text-gray-500">
                            {student.classGrade && `Class ${student.classGrade}`}
                            {student.section && `-${student.section}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedStudent && (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">{selectedStudent.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(null)}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facility Name *</Label>
                    <Input
                      required
                      value={addFormData.facilityName}
                      onChange={(e) => setAddFormData({ ...addFormData, facilityName: e.target.value })}
                      placeholder="e.g., JDWNRH"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Facility Type *</Label>
                    <Select
                      value={addFormData.facilityType}
                      onValueChange={(value) => setAddFormData({ ...addFormData, facilityType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="specialist">Specialist</SelectItem>
                        <SelectItem value="diagnostic_center">Diagnostic Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Urgency *</Label>
                    <Select
                      value={addFormData.urgency}
                      onValueChange={(value) => setAddFormData({ ...addFormData, urgency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Input
                      value={addFormData.specialty}
                      onChange={(e) => setAddFormData({ ...addFormData, specialty: e.target.value })}
                      placeholder="e.g., Pediatrician, Orthopedic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facility Address</Label>
                    <Input
                      value={addFormData.facilityAddress}
                      onChange={(e) => setAddFormData({ ...addFormData, facilityAddress: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Facility Phone</Label>
                    <Input
                      value={addFormData.facilityPhone}
                      onChange={(e) => setAddFormData({ ...addFormData, facilityPhone: e.target.value })}
                      placeholder="+975 ..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason for Referral *</Label>
                  <Textarea
                    required
                    value={addFormData.reason}
                    onChange={(e) => setAddFormData({ ...addFormData, reason: e.target.value })}
                    rows={3}
                    placeholder="Describe the reason for referral..."
                  />
                </div>

                <Button type="submit" disabled={adding || !selectedStudent} className="w-full">
                  {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Create Referral
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by student, facility, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
          <CardDescription>
            {filteredReferrals.length} referrals found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p>No referrals found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{referral.student.name}</p>
                          <Badge className={getUrgencyColor(referral.urgency)} variant="outline">
                            {referral.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {referral.student.classGrade && `Class ${referral.student.classGrade}`}
                          {referral.student.section && `-${referral.student.section}`}
                        </p>
                        <p className="font-medium text-gray-900 mt-1">{referral.facilityName}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {referral.facilityType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(referral.status)} variant="outline">
                        {referral.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Referred: {formatDate(referral.referralDate)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{referral.reason}</span>
                    </div>

                    {referral.appointmentDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Appointment: </span>
                        <span>{formatDate(referral.appointmentDate)}</span>
                        {referral.appointmentTime && <span>at {referral.appointmentTime}</span>}
                      </div>
                    )}

                    {referral.parentNotified && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Parent notified</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReferral(referral);
                        setStatusFormData({
                          status: referral.status,
                          appointmentDate: referral.appointmentDate || "",
                          appointmentTime: referral.appointmentTime || "",
                        });
                        setShowStatusDialog(true);
                      }}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Referral Status</DialogTitle>
            <DialogDescription>
              {selectedReferral && `Update status for ${selectedReferral.student.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFormData.status}
                onValueChange={(value) => setStatusFormData({ ...statusFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(statusFormData.status === "scheduled" || statusFormData.status === "pending") && (
              <>
                <div className="space-y-2">
                  <Label>Appointment Date</Label>
                  <Input
                    type="date"
                    value={statusFormData.appointmentDate}
                    onChange={(e) => setStatusFormData({ ...statusFormData, appointmentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Appointment Time</Label>
                  <Input
                    type="time"
                    value={statusFormData.appointmentTime}
                    onChange={(e) => setStatusFormData({ ...statusFormData, appointmentTime: e.target.value })}
                  />
                </div>
              </>
            )}

            <Button type="submit" disabled={updating} className="w-full">
              {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Update Referral
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
