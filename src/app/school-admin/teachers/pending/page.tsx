/**
 * SCHOOL ADMIN - PENDING TEACHER APPLICATIONS
 *
 * Features:
 * - List of pending teacher applications
 * - Approve/Reject actions
 * - View teacher details
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  Building2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeacherApplication {
  id: string;
  userId: string;
  schoolId: string;
  status: string;
  qualifications: string | null;
  experience: number | null;
  subjects: string | null;
  desiredClasses: string | null;
  previousSchool: string | null;
  specialization: string | null;
  appliedAt: string;
  rejectionReason: string | null;
  notes: string | null;
  // User details
  user?: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    employeeId: string | null;
    profileImage: string | null;
  };
}

export default function PendingTeacherApplicationsPage() {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; applicationId: string }>({
    open: false,
    applicationId: "",
  });
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/school-admin/teachers/pending");
      if (response.ok) {
        const data = await response.json();
        setApplications(data.data?.applications || []);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      setProcessingId(applicationId);
      const response = await fetch(`/api/school-admin/teachers/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", applicationId }),
      });

      if (response.ok) {
        // Remove from list
        setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to approve application");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingId(rejectDialog.applicationId);
      const response = await fetch(`/api/school-admin/teachers/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          applicationId: rejectDialog.applicationId,
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        // Remove from list
        setApplications((prev) => prev.filter((app) => app.id !== rejectDialog.applicationId));
        setRejectDialog({ open: false, applicationId: "" });
        setRejectionReason("");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to reject application");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject application");
    } finally {
      setProcessingId(null);
    }
  };

  const parseJsonArray = (jsonStr: string | null): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "T";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Teacher Applications</h1>
          <p className="text-gray-600 mt-1">
            {applications.length} {applications.length === 1 ? "application" : "applications"} awaiting review
          </p>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <GraduationCap className="w-10 h-10 text-violet-400" />
              </div>
              <p className="text-gray-900 font-semibold text-lg">No pending applications</p>
              <p className="text-gray-500 text-sm mt-1">
                All teacher applications have been reviewed
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const subjects = parseJsonArray(application.subjects);
            const desiredClasses = parseJsonArray(application.desiredClasses);
            return (
              <Card
                key={application.id}
                className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Teacher Info */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                        style={{ background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)' }}
                      >
                        {application.user?.profileImage ? (
                          <img
                            src={application.user.profileImage}
                            alt={application.user.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          getInitials(application.user?.firstName || null, application.user?.lastName || null)
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {application.user?.name}
                            </h3>
                            {application.user?.employeeId && (
                              <p className="text-sm text-gray-500 font-mono mt-0.5">
                                {application.user.employeeId}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            Pending
                          </Badge>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {application.user?.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{application.user.email}</span>
                          </div>
                        )}
                        {application.user?.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{application.user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Applied {formatDate(application.appliedAt)}</span>
                        </div>
                        {application.experience !== null && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span>{application.experience} years experience</span>
                          </div>
                        )}
                      </div>

                      {/* Qualifications */}
                      {application.qualifications && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Qualifications</p>
                          <p className="text-sm text-gray-700">{application.qualifications}</p>
                        </div>
                      )}

                      {/* Specialization */}
                      {application.specialization && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Specialization</p>
                          <p className="text-sm text-gray-700">{application.specialization}</p>
                        </div>
                      )}

                      {/* Subjects */}
                      {subjects.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Subjects ({subjects.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {subjects.map((subject, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs border-violet-200 text-violet-700 bg-violet-50"
                              >
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Previous School */}
                      {application.previousSchool && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Previous School</p>
                          <p className="text-sm text-gray-700">{application.previousSchool}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-40">
                      <Button
                        onClick={() => handleApprove(application.id)}
                        disabled={processingId === application.id}
                        className="flex-1 gap-2"
                        style={{ background: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)' }}
                      >
                        {processingId === application.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => setRejectDialog({ open: true, applicationId: application.id })}
                        disabled={processingId === application.id}
                        variant="outline"
                        className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, applicationId: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Teacher Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this application. This will be communicated to the applicant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
