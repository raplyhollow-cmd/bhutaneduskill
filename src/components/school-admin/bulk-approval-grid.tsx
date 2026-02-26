/**
 * BULK APPROVAL DATA GRID COMPONENT
 *
 * A premium table component for bulk approving pending student/teacher applications
 * with inline editing, auto-save, and bulk selection capabilities.
 *
 * Features:
 * - Bulk selection with checkboxes
 * - Inline department/class assignment
 * - Auto-save with 500ms debounce using useDebouncedSave hook
 * - Clerk-style toast notifications
 * - Sticky footer with action buttons (gray-900 background)
 * - Loading states during save operations
 * - Dialog for rejection reason input
 *
 * Usage:
 *   <BulkApprovalGrid
 *     pendingApplications={pendingUsers}
 *     departments={departments}
 *     classes={classes}
 */
"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, X, Check, XCircle, ChevronDown, ChevronUp, Loader2, AlertCircle, GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { portal, semantic, semanticGradients } from "@/styles/design-tokens";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { PremiumTable, PremiumTableRow, PremiumTableCell } from "@/components/admin/premium-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// =============================================================================
// TYPES
// =============================================================================

export interface PendingApplication {
  id: string;
  name: string;
  email: string;
  type: "student" | "teacher";
  classGrade?: string | null;
  subjects?: string | null;
  phone?: string | null;
  department?: string | null;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  section?: string;
}

export interface UserAssignment {
  departmentId?: string;
  classIds?: string[];
}

export interface BulkApprovalGridProps {
  /** Pending applications to display */
  pendingApplications: PendingApplication[];
  /** Available departments for teachers */
  departments?: Department[];
  /** Available classes for assignment */
  classes?: ClassItem[];
  /** Batch approve handler with assignments */
  onBatchApprove?: (
    userIds: string[],
    assignments: Record<string, { departmentId?: string; classIds?: string[] }>
  ) => Promise<void>;
  /** Batch reject handler with reason */
  onBatchReject?: (userIds: string[], reason: string) => Promise<void>;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface SavingIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

function SavingIndicator({ isSaving, lastSaved }: SavingIndicatorProps) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    const timeDiff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    let timeText = "just now";
    if (timeDiff > 60) timeText = `${Math.floor(timeDiff / 60)}m ago`;
    else if (timeDiff > 10) timeText = `${timeDiff}s ago`;

    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle className="w-3 h-3" />
        <span>Saved {timeText}</span>
      </div>
    );
  }

  return null;
}

interface RoleBadgeProps {
  type: "student" | "teacher";
}

function RoleBadge({ type }: RoleBadgeProps) {
  const isStudent = type === "student";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 font-medium",
        isStudent
          ? "bg-orange-100 text-orange-700 border-orange-200"
          : "bg-blue-100 text-blue-700 border-blue-200"
      )}
    >
      {isStudent ? (
        <GraduationCap className="w-3 h-3" />
      ) : (
        <User className="w-3 h-3" />
      )}
      {isStudent ? "Student" : "Teacher"}
    </Badge>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BulkApprovalGrid({
  pendingApplications,
  departments = [],
  classes = [],
  onBatchApprove,
  onBatchReject,
}: BulkApprovalGridProps) {
  const toast = useToast();

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = React.useState(false);
  const [isIndeterminate, setIsIndeterminate] = React.useState(false);

  // Loading states
  const [approvingIds, setApprovingIds] = React.useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = React.useState(false);
  const [isBulkRejecting, setIsBulkRejecting] = React.useState(false);

  // Assignment state (tracks what's been assigned but not yet saved)
  const [assignments, setAssignments] = React.useState<
    Record<string, Partial<UserAssignment>>
  >({});

  // Dialog state for rejection
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  // Auto-save hook for assignments
  const { debouncedSave, isSaving: isGlobalSaving } = useDebouncedSave({
    saveFn: async (data: { userId: string; assignment: UserAssignment }) => {
      const { userId, assignment } = data;
      const response = await fetch(
        `/api/school-admin/applications/${userId}/assignment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignment),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save assignment");
      }

      return response.json();
    },
    delay: 500,
    onSuccess: () => {
      toast.success({ description: "Changes saved" });
    },
    onError: (error) => {
      toast.error({ description: error instanceof Error ? error.message : String(error) });
    },
  });

  // Saving state per user
  const [savingStates, setSavingStates] = React.useState<
    Record<string, { isSaving: boolean; lastSaved: Date | null }>
  >({});

  // Convert classes to MultiSelect options
  const classOptions: MultiSelectOption[] = React.useMemo(() => {
    return classes.map((c) => ({
      value: c.id,
      label: `${c.grade} - ${c.name}`,
    }));
  }, [classes]);

  // =============================================================================
  // SELECTION HANDLERS
  // =============================================================================

  const handleToggleSelectAll = () => {
    if (isAllSelected || isIndeterminate) {
      setSelectedIds(new Set());
      setIsAllSelected(false);
      setIsIndeterminate(false);
    } else {
      const allIds = new Set(pendingApplications.map((u) => u.id));
      setSelectedIds(allIds);
      setIsAllSelected(true);
      setIsIndeterminate(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setIsAllSelected(newSelected.size === pendingApplications.length);
    setIsIndeterminate(
      newSelected.size > 0 && newSelected.size < pendingApplications.length
    );
  };

  // =============================================================================
  // FIELD CHANGE HANDLERS (with auto-save via useDebouncedSave)
  // =============================================================================

  const handleDepartmentChange = React.useCallback(
    (userId: string, departmentId: string) => {
      // Update local state immediately
      setAssignments((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], departmentId },
      }));

      // Set saving state
      setSavingStates((prev) => ({
        ...prev,
        [userId]: { isSaving: true, lastSaved: null },
      }));

      // Trigger debounced save
      debouncedSave({ userId, assignment: { ...assignments[userId], departmentId } });
    },
    [assignments, debouncedSave]
  );

  const handleClassesChange = React.useCallback(
    (userId: string, classIds: string[]) => {
      // Update local state immediately
      setAssignments((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], classIds },
      }));

      // Set saving state
      setSavingStates((prev) => ({
        ...prev,
        [userId]: { isSaving: true, lastSaved: null },
      }));

      // Trigger debounced save
      debouncedSave({ userId, assignment: { ...assignments[userId], classIds } });
    },
    [assignments, debouncedSave]
  );

  // =============================================================================
  // BULK ACTION HANDLERS
  // =============================================================================

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkApproving(true);
    try {
      // Include assignments in the approve call
      const assignmentsToSubmit: Record<string, UserAssignment> = {};
      selectedIds.forEach((id) => {
        if (assignments[id]) {
          assignmentsToSubmit[id] = assignments[id];
        }
      });

      await onBatchApprove(Array.from(selectedIds), assignmentsToSubmit);

      toast.success({
        title: "Approved",
        description: `${selectedIds.size} ${selectedIds.size === 1 ? "applicant" : "applicants"} approved successfully`,
      });

      // Clear selection
      setSelectedIds(new Set());
      setIsAllSelected(false);
      setIsIndeterminate(false);
    } catch (error) {
      toast.error({
        title: "Approval failed",
        description: "Could not approve selected applicants",
      });
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.size === 0) return;

    // Open dialog for rejection reason
    setShowRejectDialog(true);
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error({
        description: "Please provide a reason for rejection",
      });
      return;
    }

    setIsBulkRejecting(true);
    try {
      if (onBatchReject) {
        await onBatchReject(Array.from(selectedIds), rejectionReason);
      } else {
        // Default implementation using fetch
        const response = await fetch("/api/school-admin/applications/reject-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: Array.from(selectedIds),
            type: pendingApplications[0]?.type || "student",
            reason: rejectionReason,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to reject applications");
        }
      }

      toast.success({
        title: "Rejected",
        description: `${selectedIds.size} ${selectedIds.size === 1 ? "applicant" : "applicants"} rejected`,
      });

      // Clear selection and close dialog
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedIds(new Set());
      setIsAllSelected(false);
      setIsIndeterminate(false);
    } catch (error) {
      toast.error({
        title: "Rejection failed",
        description: error instanceof Error ? error instanceof Error ? error.message : String(error) : "Could not reject selected applicants",
      });
    } finally {
      setIsBulkRejecting(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const hasSelection = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  // Table headers
  const headers = [
    "",
    "Applicant",
    "Role",
    pendingApplications.some((u) => u.type === "teacher") ? "Department" : "Class",
    "Status",
  ];

  return (
    <div className="space-y-4">
      {/* Main Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <PremiumTable headers={headers} stickyHeader>
          {pendingApplications.length === 0 ? (
            <tbody>
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-16 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900">No pending applications</p>
                    <p className="text-sm">
                      Applications will appear here when users sign up with your school
                      code
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {pendingApplications.map((user) => {
                const isSelected = selectedIds.has(user.id);
                const savingState = savingStates[user.id];
                const assignment = assignments[user.id] || {};
                const isApproving = approvingIds.has(user.id);

                return (
                  <PremiumTableRow key={user.id}>
                    {/* Checkbox */}
                    <PremiumTableCell className="w-12">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                    </PremiumTableCell>

                    {/* Applicant Info */}
                    <PremiumTableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{
                            background:
                              user.type === "student"
                                ? portal.student.gradient
                                : portal.teacher.gradient,
                          }}
                        >
                          {user.type === "student" ? (
                            <GraduationCap className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </PremiumTableCell>

                    {/* Role Badge */}
                    <PremiumTableCell>
                      <RoleBadge type={user.type} />
                    </PremiumTableCell>

                    {/* Department/Class Assignment */}
                    <PremiumTableCell>
                      {user.type === "teacher" ? (
                        <div className="w-56">
                          <Select
                            value={assignment.departmentId || user.department || ""}
                            onValueChange={(value) =>
                              handleDepartmentChange(user.id, value)
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-9"
                              aria-label={`Select department for ${user.name}`}
                            >
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
              ))}
                              {departments.length === 0 && (
                                <div className="px-2 py-1.5 text-sm text-gray-500">
                                  No departments available
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          {savingState?.isSaving && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Saving...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-72">
                          <MultiSelect
                            options={classOptions}
                            selected={assignment.classIds || []}
                            onChange={(value) =>
                              handleClassesChange(user.id, value)
                            }
                            placeholder="Select classes"
                            searchPlaceholder="Search classes..."
                            maxDisplay={2}
                            aria-label={`Select classes for ${user.name}`}
                          />
                          {savingState?.isSaving && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Saving...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </PremiumTableCell>

                    {/* Status */}
                    <PremiumTableCell>
                      {savingState?.lastSaved ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>Saved</span>
                        </div>
                      ) : isApproving ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Approving...</span>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200"
                        >
                          Pending
                        </Badge>
                      )}
                    </PremiumTableCell>
                  </PremiumTableRow>
                );
              })}
            </tbody>
          )}
        </PremiumTable>
      </div>

      {/* Sticky Footer - shows when items are selected */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg transition-transform duration-200 ease-out",
          "bg-gray-900 text-white border-gray-700",
          hasSelection ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                <span className="text-sm font-semibold text-white">
                  {selectedCount}
                </span>
              </div>
              <div>
                <p className="font-medium text-white">
                  {selectedCount} {selectedCount === 1 ? "user" : "users"} selected
                </p>
                <p className="text-sm text-gray-400">
                  Assign departments/classes before approving
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedIds(new Set());
                  setIsAllSelected(false);
                  setIsIndeterminate(false);
                }}
                disabled={!hasSelection || isBulkApproving || isBulkRejecting}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Clear Selection
              </Button>
              <Button
                variant="outline"
                onClick={handleBatchReject}
                disabled={!hasSelection || isBulkApproving || isBulkRejecting}
                className="border-red-500 text-red-400 hover:bg-red-500/20 hover:border-red-400"
              >
                {isBulkRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Selected
                  </>
                )}
              </Button>
              <Button
                onClick={handleBatchApprove}
                disabled={!hasSelection || isBulkApproving || isBulkRejecting}
                style={{
                  background: semanticGradients.success.gradient,
                }}
                className="text-white shadow-md hover:shadow-lg transition-shadow border-0"
              >
                {isBulkApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Assign Selected
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed footer */}
      {hasSelection && <div className="h-24" />}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Applications</DialogTitle>
            <DialogDescription>
              You are about to reject {selectedIds.size} {selectedIds.size === 1 ? "applicant" : "applicants"}. Please provide a reason for the rejection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>{selectedIds.size} {selectedIds.size === 1 ? "applicant" : "applicants"} selected</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isBulkRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejection}
              disabled={!rejectionReason.trim() || isBulkRejecting}
            >
              {isBulkRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject {selectedIds.size} {selectedIds.size === 1 ? "Applicant" : "Applicants"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default BulkApprovalGrid;
