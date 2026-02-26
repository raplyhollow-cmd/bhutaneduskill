"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  Filter,
  LayoutGrid,
  List,
  Table,
  Grid3x3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BulkApprovalGrid,
  type PendingApplication,
  type Department as BulkDepartment,
  type ClassItem as BulkClassItem,
} from "@/components/school-admin/bulk-approval-grid";
import { useToast } from "@/components/ui/toaster";
import { CeramicCallout } from "@/components/ui/ceramic-callout";

interface PendingUser {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  classGrade?: string | null;
  subjects?: string | null;
  createdAt: Date | string;
}

interface ApplicationsClientProps {
  pendingStudents: PendingUser[];
  pendingTeachers: PendingUser[];
  departments?: BulkDepartment[];
  classes?: BulkClassItem[];
  stats: {
    totalStudents: number;
    totalTeachers: number;
    approvedStudents: number;
    approvedTeachers: number;
    pendingStudents: number;
    pendingTeachers: number;
  };
}

type ApplicationStatus = "pending" | "approved" | "rejected";

export function ApplicationsClient({
  pendingStudents,
  pendingTeachers,
  departments = [],
  classes = [],
  stats,
}: ApplicationsClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [userType, setUserType] = useState<"student" | "teacher">("student");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>("pending");

  // Bulk approval modal state
  const [showBulkModal, setShowBulkModal] = useState(false);

  const handleApprove = async (userId: string, type: "student" | "teacher") => {
    setLoading(userId);
    try {
      const response = await fetch(`/api/school-admin/applications/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
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
    if (!selectedUser) return;
    setLoading(selectedUser.id);
    try {
      const response = await fetch(`/api/school-admin/applications/${selectedUser.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: userType,
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        setShowRejectDialog(false);
        setRejectionReason("");
        setSelectedUser(null);
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

  const openRejectDialog = (user: PendingUser, type: "student" | "teacher") => {
    setSelectedUser(user);
    setUserType(type);
    setShowRejectDialog(true);
  };

  // =============================================================================
  // BATCH HANDLERS for BulkApprovalGrid
  // =============================================================================

  const handleBatchApprove = async (
    userIds: string[],
    assignments: Record<string, { departmentId?: string; classIds?: string[] }>
  ) => {
    try {
      const response = await fetch("/api/school-admin/applications/approve-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, assignments }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve applications");
      }

      toast.success({
        title: "Approved",
        description: `${userIds.length} ${userIds.length === 1 ? "applicant" : "applicants"} approved successfully`,
      });

      router.refresh();
    } catch (error) {
      toast.error({
        title: "Approval failed",
        description: error instanceof Error ? error instanceof Error ? error.message : String(error) : "Could not approve selected applicants",
      });
      throw error;
    }
  };

  const handleBatchReject = async (userIds: string[], reason: string) => {
    try {
      const response = await fetch("/api/school-admin/applications/reject-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds,
          type: activeTab === "students" ? "student" : "teacher",
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject applications");
      }

      toast.success({
        title: "Rejected",
        description: `${userIds.length} ${userIds.length === 1 ? "applicant" : "applicants"} rejected`,
      });

      router.refresh();
    } catch (error) {
      toast.error({
        title: "Rejection failed",
        description: error instanceof Error ? error instanceof Error ? error.message : String(error) : "Could not reject selected applicants",
      });
      throw error;
    }
  };

  // Convert pending users to BulkApprovalGrid format
  const pendingApplications: PendingApplication[] = [
    ...pendingStudents.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      type: "student" as const,
      classGrade: s.classGrade,
      phone: s.phone,
    })),
    ...pendingTeachers.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      type: "teacher" as const,
      subjects: t.subjects,
      phone: t.phone,
    })),
  ];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const parseJsonArray = (jsonStr: string | null): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const renderUserCard = (user: PendingUser, type: "student" | "teacher") => (
    <Card key={user.id} variant="ceramic" className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4" style={{
      borderLeftColor: type === "student"
        ? "rgb(249 115 22)"
        : "rgb(59 130 246)"
    }}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* User Details */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-lg"
                style={{
                  background:
                    type === "student"
                      ? "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)"
                      : "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
                }}
              >
                {type === "student" ? (
                  <GraduationCap className="w-7 h-7" />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ceramic-primary text-lg">{user.name}</h3>
                <p className="text-sm text-ceramic-secondary">
                  {type === "student" ? "Student Application" : "Teacher Application"}
                </p>
              </div>
              <Badge variant="ceramic-warning" className="px-3 py-1">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pl-16">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-ceramic-secondary">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-ceramic-secondary">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {type === "student" && user.classGrade && (
                  <div className="flex items-center gap-2 text-sm text-ceramic-secondary">
                    <GraduationCap className="w-4 h-4" />
                    <span>Class {user.classGrade}</span>
                  </div>
                )}
                {type === "teacher" && user.subjects && (
                  <div className="flex items-center gap-2 text-sm text-ceramic-secondary">
                    <BookOpen className="w-4 h-4" />
                    <span>Subjects: {parseJsonArray(user.subjects).join(", ")}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-ceramic-secondary">
                  <Calendar className="w-4 h-4" />
                  <span>Applied: {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex lg:flex-col gap-2 lg:w-40">
            <Button
              className="flex-1 shadow-md hover:shadow-lg transition-shadow ceramic-success"
              onClick={() => handleApprove(user.id, type)}
              disabled={loading === user.id}
            >
              {loading === user.id ? "Approving..." : "Approve"}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="ceramic-error"
              className="flex-1"
              onClick={() => openRejectDialog(user, type)}
              disabled={loading === user.id}
            >
              Reject
              <XCircle className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ceramic-primary mb-2">Applications</h1>
          <p className="text-ceramic-secondary">Review and approve student and teacher applications</p>
        </div>
        <Button
          onClick={() => setShowBulkModal(true)}
          className="gap-2"
          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
        >
          <Grid3x3 className="w-4 h-4" />
          Bulk Approval
          {pendingApplications.length > 0 && (
            <Badge variant="ceramic-solid-brand" className="ml-1">
              {pendingApplications.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Stats Overview - Ceramic Styled */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="ceramic" className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-orange-500" />
              Pending Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-ceramic-primary">{stats.pendingStudents}</div>
            <p className="text-xs text-ceramic-secondary mt-1">{stats.totalStudents} total students</p>
          </CardContent>
        </Card>

        <Card variant="ceramic" className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Pending Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-ceramic-primary">{stats.pendingTeachers}</div>
            <p className="text-xs text-ceramic-secondary mt-1">{stats.totalTeachers} total teachers</p>
          </CardContent>
        </Card>

        <Card variant="ceramic" className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Approved Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-ceramic-primary">{stats.approvedStudents}</div>
            <p className="text-xs text-ceramic-secondary mt-1">Active students</p>
          </CardContent>
        </Card>

        <Card variant="ceramic" className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ceramic-secondary flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Approved Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-ceramic-primary">{stats.approvedTeachers}</div>
            <p className="text-xs text-ceramic-secondary mt-1">Active teachers</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Bar - Ceramic Styled */}
      <Card variant="ceramic" className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-ceramic-dimmed" />
              <span className="text-sm font-medium text-ceramic-primary">Filter by Status:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "pending" ? "ceramic" : "ceramic-ghost"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                <Clock className="w-4 h-4 mr-1" />
                Pending
              </Button>
              <Button
                variant={statusFilter === "approved" ? "ceramic-success" : "ceramic-ghost"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approved
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "ceramic-error" : "ceramic-ghost"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Tabs - Ceramic Styled */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="ceramic" className="grid w-full max-w-md grid-cols-2 shadow-sm">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Students
            {stats.pendingStudents > 0 && (
              <Badge variant="ceramic-warning" className="ml-1">
                {stats.pendingStudents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Teachers
            {stats.pendingTeachers > 0 && (
              <Badge variant="ceramic-info" className="ml-1">
                {stats.pendingTeachers}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4 mt-6">
          <Card variant="ceramic" className="shadow-sm">
            <CardHeader className="border-b border-ceramic-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-orange-500" />
                    Pending Student Applications
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {stats.pendingStudents} {stats.pendingStudents === 1 ? "application" : "applications"} awaiting approval
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {pendingStudents.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-ceramic-gray-50 to-transparent rounded-lg">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <GraduationCap className="w-10 h-10 text-orange-400" />
                  </div>
                  <p className="text-ceramic-primary font-semibold text-lg">No pending student applications</p>
                  <p className="text-ceramic-secondary text-sm mt-1">
                    Students will appear here when they sign up with your school code
                  </p>
                </div>
              ) : (
                <div className="space-y-4">{pendingStudents.map((student) => renderUserCard(student, "student"))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4 mt-6">
          <Card variant="ceramic" className="shadow-sm">
            <CardHeader className="border-b border-ceramic-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Pending Teacher Applications
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {stats.pendingTeachers} {stats.pendingTeachers === 1 ? "application" : "applications"} awaiting approval
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {pendingTeachers.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-blue-50 to-transparent rounded-lg">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <User className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-ceramic-primary font-semibold text-lg">No pending teacher applications</p>
                  <p className="text-ceramic-secondary text-sm mt-1">
                    Teachers will appear here when they sign up with your school code
                  </p>
                </div>
              ) : (
                <div className="space-y-4">{pendingTeachers.map((teacher) => renderUserCard(teacher, "teacher"))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Approval Modal - Ceramic Styled */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" variant="ceramic">
          <DialogHeader>
            <DialogTitle>Bulk Approval</DialogTitle>
            <DialogDescription>
              Approve multiple applications at once with department and class assignments
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <BulkApprovalGrid
              pendingApplications={pendingApplications}
              departments={departments}
              classes={classes}
              onBatchApprove={handleBatchApprove}
              onBatchReject={handleBatchReject}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog - Ceramic Styled */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent variant="ceramic">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {userType} application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="e.g., Invalid school code, Incomplete information, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            {selectedUser && (
              <CeramicCallout variant="ceramic-info">
                <p className="text-sm text-ceramic-primary">
                  <strong>Applicant:</strong> {selectedUser.name}
                  <br />
                  <strong>Email:</strong> {selectedUser.email}
                </p>
              </CeramicCallout>
            )}
          </div>
          <DialogFooter variant="ceramic">
            <Button variant="ceramic-ghost" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="ceramic-error"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || loading === selectedUser?.id}
            >
              {loading === selectedUser?.id ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
