"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Mail,
  Phone,
  FileText,
  Loader2,
  AlertCircle,
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentApplication {
  id: string;
  studentId: string;
  schoolId: string;
  status: "pending" | "approved" | "rejected";
  requestedGrade: number | null;
  requestedSection: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  previousSchool: string | null;
  specialNeeds: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    profileImage: string | null;
  };
}

interface ClassOption {
  id: string;
  name: string;
  grade: number;
  section: string;
}

export default function PendingStudentsPage() {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    application: StudentApplication | null;
    selectedClassId: string;
    isProcessing: boolean;
  }>({
    open: false,
    application: null,
    selectedClassId: "",
    isProcessing: false,
  });

  // Rejection dialog state
  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean;
    application: StudentApplication | null;
    reason: string;
    isProcessing: boolean;
  }>({
    open: false,
    application: null,
    reason: "",
    isProcessing: false,
  });

  // Available classes for enrollment
  const [classes, setClasses] = useState<ClassOption[]>([]);

  useEffect(() => {
    fetchApplications();
    fetchClasses();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/school-admin/student-applications?status=${filter}`);
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load student applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/school-admin/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  const handleApprove = async () => {
    if (!approvalDialog.application || !approvalDialog.selectedClassId) {
      return;
    }

    setApprovalDialog({ ...approvalDialog, isProcessing: true });

    try {
      const response = await fetch("/api/school-admin/enroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: approvalDialog.application.id,
          studentId: approvalDialog.application.studentId,
          classId: approvalDialog.selectedClassId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve student");
      }

      // Refresh applications and close dialog
      await fetchApplications();
      setApprovalDialog({
        open: false,
        application: null,
        selectedClassId: "",
        isProcessing: false,
      });
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to approve student. Please try again.");
      setApprovalDialog({ ...approvalDialog, isProcessing: false });
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog.application) {
      return;
    }

    setRejectionDialog({ ...rejectionDialog, isProcessing: true });

    try {
      const response = await fetch("/api/school-admin/reject-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: rejectionDialog.application.id,
          reason: rejectionDialog.reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject application");
      }

      // Refresh applications and close dialog
      await fetchApplications();
      setRejectionDialog({
        open: false,
        application: null,
        reason: "",
        isProcessing: false,
      });
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject application. Please try again.");
      setRejectionDialog({ ...rejectionDialog, isProcessing: false });
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6" />
          Student Applications
        </h1>
        <p className="text-gray-500">
          Review and approve student enrollment applications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter((a) => a.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {applications.filter((a) => a.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {applications.filter((a) => a.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "pending" | "approved" | "rejected")}>
        <TabsList>
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter((a) => a.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({applications.filter((a) => a.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter((a) => a.status === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No applications found
                </h3>
                <p className="text-gray-500">
                  {filter === "all"
                    ? "No student applications yet"
                    : `No ${filter} applications`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {application.student.firstName} {application.student.lastName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {application.student.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(application.status)} variant="outline">
                        {application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Student Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Grade:</span>
                        <span className="ml-2 font-medium">
                          {application.requestedGrade || "Not specified"}
                          {application.requestedSection && ` - ${application.requestedSection}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <span className="ml-2 font-medium capitalize">
                          {application.student.gender || "Not specified"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Guardian:</span>
                        <span className="ml-2 font-medium">
                          {application.guardianName || "Not specified"}
                          {application.guardianPhone && (
                            <>
                              <span className="mx-1">•</span>
                              <Phone className="h-3 w-3 inline" />
                              {application.guardianPhone}
                            </>
                          )}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Applied:</span>
                        <span className="ml-2 font-medium">
                          {new Date(application.submittedAt).toLocaleDateString()} at{" "}
                          {new Date(application.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions for pending applications */}
                    {application.status === "pending" && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={() =>
                            setApprovalDialog({
                              ...approvalDialog,
                              open: true,
                              application,
                              selectedClassId: "",
                            })
                          }
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve & Enroll
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRejectionDialog({
                              ...rejectionDialog,
                              open: true,
                              application,
                              reason: "",
                            })
                          }
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Rejection reason */}
                    {application.status === "rejected" && application.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{application.rejectionReason}</p>
                      </div>
                    )}

                    {/* Approved info */}
                    {application.status === "approved" && application.reviewedAt && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Approved on {new Date(application.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog.open}
        onOpenChange={(open) =>
          setApprovalDialog({ ...approvalDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Enroll Student</DialogTitle>
            <DialogDescription>
              Select a class to enroll{" "}
              <strong>
                {approvalDialog.application?.student.firstName}{" "}
                {approvalDialog.application?.student.lastName}
              </strong>{" "}
              into
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-select">Select Class</Label>
              <Select
                value={approvalDialog.selectedClassId}
                onValueChange={(value) =>
                  setApprovalDialog({ ...approvalDialog, selectedClassId: value })
                }
              >
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} (Grade {cls.grade} - {cls.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classes.length === 0 && (
                <p className="text-sm text-gray-500">
                  No classes available. Please create a class first.
                </p>
              )}
            </div>

            {approvalDialog.application && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div>
                  <span className="font-medium">Requested Grade:</span>{" "}
                  <span>{approvalDialog.application.requestedGrade || "Not specified"}</span>
                </div>
                <div>
                  <span className="font-medium">Requested Section:</span>{" "}
                  <span>{approvalDialog.application.requestedSection || "Not specified"}</span>
                </div>
                <div>
                  <span className="font-medium">Guardian:</span>{" "}
                  <span>{approvalDialog.application.guardianName || "Not specified"}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setApprovalDialog({
                  open: false,
                  application: null,
                  selectedClassId: "",
                  isProcessing: false,
                })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!approvalDialog.selectedClassId || approvalDialog.isProcessing}
            >
              {approvalDialog.isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Approve & Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectionDialog.open}
        onOpenChange={(open) => setRejectionDialog({ ...rejectionDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting{" "}
              <strong>
                {rejectionDialog.application?.student.firstName}{" "}
                {rejectionDialog.application?.student.lastName}
              </strong>
              's enrollment application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Rejection</Label>
              <textarea
                id="rejection-reason"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain why this application is being rejected..."
                value={rejectionDialog.reason}
                onChange={(e) =>
                  setRejectionDialog({ ...rejectionDialog, reason: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectionDialog({
                  open: false,
                  application: null,
                  reason: "",
                  isProcessing: false,
                })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionDialog.reason || rejectionDialog.isProcessing}
            >
              {rejectionDialog.isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
