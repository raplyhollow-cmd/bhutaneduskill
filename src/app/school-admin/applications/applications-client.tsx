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
  stats: {
    totalStudents: number;
    totalTeachers: number;
    approvedStudents: number;
    approvedTeachers: number;
    pendingStudents: number;
    pendingTeachers: number;
  };
}

export function ApplicationsClient({
  pendingStudents,
  pendingTeachers,
  stats,
}: ApplicationsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("students");
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [userType, setUserType] = useState<"student" | "teacher">("student");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

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
    <div
      key={user.id}
      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* User Details */}
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
              style={{
                background:
                  type === "student"
                    ? "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)"
                    : "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
              }}
            >
              {type === "student" ? (
                <GraduationCap className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">
                {type === "student" ? "Student Application" : "Teacher Application"}
              </p>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pl-16">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              {type === "student" && user.classGrade && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>Class {user.classGrade}</span>
                </div>
              )}
              {type === "teacher" && user.subjects && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>Subjects: {parseJsonArray(user.subjects).join(", ")}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Applied: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex lg:flex-col gap-2 lg:w-40">
          <Button
            className="flex-1"
            style={{
              background: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
            }}
            onClick={() => handleApprove(user.id, type)}
            disabled={loading === user.id}
          >
            {loading === user.id ? "Approving..." : "Approve"}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
            onClick={() => openRejectDialog(user, type)}
            disabled={loading === user.id}
          >
            Reject
            <XCircle className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
          <p className="text-gray-600">Review and approve student and teacher applications</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Pending Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingStudents}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.totalStudents} total students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <User className="w-4 h-4" />
              Pending Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.pendingTeachers}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.totalTeachers} total teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Approved Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approvedStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Approved Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approvedTeachers}</div>
            <p className="text-xs text-gray-500 mt-1">Active teachers</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Students
            {stats.pendingStudents > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pendingStudents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Teachers
            {stats.pendingTeachers > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pendingTeachers}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Student Applications</CardTitle>
              <CardDescription>
                {stats.pendingStudents} {stats.pendingStudents === 1 ? "application" : "applications"} awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">No pending student applications</p>
                  <p className="text-gray-500 text-sm">
                    Students will appear here when they sign up with your school code
                  </p>
                </div>
              ) : (
                <div className="space-y-4">{pendingStudents.map((student) => renderUserCard(student, "student"))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Teacher Applications</CardTitle>
              <CardDescription>
                {stats.pendingTeachers} {stats.pendingTeachers === 1 ? "application" : "applications"} awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTeachers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">No pending teacher applications</p>
                  <p className="text-gray-500 text-sm">
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

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
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
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Applicant:</strong> {selectedUser.name}
                  <br />
                  <strong>Email:</strong> {selectedUser.email}
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
