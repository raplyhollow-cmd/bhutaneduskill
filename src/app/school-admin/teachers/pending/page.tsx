/**
 * SCHOOL ADMIN - PENDING TEACHER APPLICATIONS
 *
 * Features:
 * - List of pending teacher applications
 * - Bulk approve/reject
 * - Compact premium design
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  Building2,
  Award,
  Clock,
  Check,
  CheckSquare,
  Square,
  X,
  GraduationCap,
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  user?: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    employeeId: string | null;
    profileImage: string | null;
    cidNo: string | null;
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

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

  const parseJsonArray = (jsonStr: string | null): Array<{ subject: string; grade?: number }> => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) return [];

      // Group by subject name and collect unique grades
      const subjectGradeMap = new Map<string, Set<number>>();

      parsed.forEach((item: unknown) => {
        if (typeof item === 'string') {
          // Old format: just subject name
          subjectGradeMap.set(item, new Set());
        } else if (typeof item === 'object' && item !== null && 'subject' in item) {
          // New format: { subject: "Biology", grade: 9 }
          const subjectItem = item as { subject: string; grade?: number };
          if (!subjectGradeMap.has(subjectItem.subject)) {
            subjectGradeMap.set(subjectItem.subject, new Set());
          }
          if (subjectItem.grade !== undefined) {
            subjectGradeMap.get(subjectItem.subject)!.add(subjectItem.grade);
          }
        }
      });

      // Convert to array and sort
      return Array.from(subjectGradeMap.entries())
        .map(([subject, grades]) => ({
          subject,
          grades: Array.from(grades).sort((a, b) => a - b),
        }))
        .sort((a, b) => a.subject.localeCompare(b.subject));
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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((app) => app.id)));
    }
  };

  const isAllSelected = applications.length > 0 && selectedIds.size === applications.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < applications.length;

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessingBulk(true);
    try {
      const approvePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/school-admin/teachers/pending`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", applicationId: id }),
        })
      );
      await Promise.allSettled(approvePromises);
      setApplications((prev) => prev.filter((app) => !selectedIds.has(app.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to bulk approve:", error);
      alert("Failed to approve some applications");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-0 z-10"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-violet-600 rounded-xl shadow-lg shadow-violet-200/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{selectedIds.size} selected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearSelection}
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10 h-8 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleBulkApprove}
                  disabled={isProcessingBulk}
                  className="bg-white text-violet-600 hover:bg-violet-50 h-8 rounded-lg text-sm font-medium"
                >
                  {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Approve All</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pending Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {applications.length} {applications.length === 1 ? "teacher" : "teachers"} awaiting review
          </p>
        </div>
        {applications.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-violet-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      {/* Applications List */}
      <AnimatePresence mode="popLayout">
        {applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No pending applications</h3>
            <p className="text-sm text-gray-500">New applications will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {applications.map((application, index) => {
              const subjects = parseJsonArray(application.subjects);
              const isSelected = selectedIds.has(application.id);

              return (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <Card className={cn(
                    "transition-all duration-200",
                    isSelected
                      ? "border-violet-300 ring-1 ring-violet-200 bg-violet-50/30"
                      : "border-gray-200 hover:border-gray-300"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelection(application.id)}
                          className={cn(
                            "flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5",
                            isSelected
                              ? "bg-violet-600 border-violet-600"
                              : "border-gray-300 hover:border-violet-400"
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                            style={{ background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)' }}
                          >
                            {application.user?.profileImage ? (
                              <img src={application.user.profileImage} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              getInitials(application.user?.firstName || null, application.user?.lastName || null)
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{application.user?.name}</h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                  Pending
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                {application.user?.email && (
                                  <span className="flex items-center gap-1.5 truncate">
                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{application.user.email}</span>
                                  </span>
                                )}
                                {application.experience !== null && (
                                  <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    {application.experience}y exp
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                  {formatDate(application.appliedAt)}
                                </span>
                              </div>

                              {/* Qualifications, CID & Subjects */}
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                {application.user?.cidNo && (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                    <span className="font-medium">CID:</span> {application.user.cidNo}
                                  </span>
                                )}
                                {application.qualifications && (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                    <Award className="w-3 h-3" />
                                    {application.qualifications}
                                  </span>
                                )}
                                {subjects.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 text-gray-400" />
                                    <div className="flex gap-1">
                                      {subjects.slice(0, 3).map((item, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-xs">
                                          {item.subject}
                                          {item.grades && item.grades.length > 0 && (
                                            <span className="text-violet-500 ml-0.5">
                                              {item.grades.length === 1
                                                ? ` (Gr ${item.grades[0]})`
                                                : item.grades.length === subjects.length || item.grades.length <= 2
                                                  ? ` (${item.grades.join(', ')})`
                                                  : ` (${item.grades[0]}-${item.grades[item.grades.length - 1]})`
                                              }
                                            </span>
                                          )}
                                        </span>
                                      ))}
                                      {subjects.length > 3 && (
                                        <span className="text-xs text-gray-400">+{subjects.length - 3}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                onClick={() => handleApprove(application.id)}
                                disabled={processingId === application.id}
                                className="h-8 px-3 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                              >
                                {processingId === application.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</>
                                )}
                              </Button>
                              <Button
                                onClick={() => setRejectDialog({ open: true, applicationId: application.id })}
                                disabled={processingId === application.id}
                                variant="outline"
                                className="h-8 px-3 rounded-lg text-sm border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, applicationId: "" })}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
