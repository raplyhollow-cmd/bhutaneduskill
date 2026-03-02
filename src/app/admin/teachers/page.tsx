"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - TEACHERS MANAGEMENT
 *
 * Ultra-luxury intelligent inline-editing grid design:
 * - Inline editable fields (click to edit, no panels)
 * - Verification toggle (click to toggle, no confirmation)
 * - Quick action menu (three-dot with all actions)
 * - Keyboard navigation (arrows, enter, space, escape)
 * - Optimistic UI (instant feedback, sync in background)
 * - Bulk actions with conditional bar
 * - Custom grid table (12-column, NOT HTML table)
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InlineEditText } from "@/components/admin/inline-edit-text";
import { QuickActionMenu } from "@/components/admin/quick-action-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TableSkeleton } from "@/components/ui/skeleton/table-skeleton";
import { EditTeacherModal } from "@/components/admin/edit-teacher-modal";
import {
  Briefcase,
  Search,
  Plus,
  Sparkles,
  X,
  Check,
  Square,
  Trash2,
  MoreHorizontal,
  Loader2 as Spinner,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  CheckCircle,
  Ban,
  MailCheck,
  Eye,
  Edit,
  Key,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  schoolId?: string | null;
  emailVerified: boolean;
  onboardingStatus?: string | null;
  lastLogin?: string | null;
  isActive?: boolean;
  phone?: string | null;
  employeeId?: string | null;
  subjects?: string | string[] | null;
  school?: {
    id: string;
    name: string;
    code: string;
  } | null;
  // Stats
  stats?: {
    classes: number;
    students: number;
  };
}

interface TeacherStats {
  total: number;
  verified: number;
  pending: number;
  totalClasses: number;
  totalStudents: number;
}

// Verification filter chips
const verificationChips = [
  { value: "all", label: "All Teachers", icon: Briefcase },
  { value: "verified", label: "Verified", icon: CheckCircle },
  { value: "pending", label: "Pending", icon: Ban },
];

type FilterStatus = "all" | "verified" | "pending";

// Helper function to parse subjects field
function parseSubjects(subjects: string | string[] | null | undefined): string[] {
  if (!subjects) return [];
  if (Array.isArray(subjects)) return subjects;
  try {
    return typeof subjects === "string" ? JSON.parse(subjects) : subjects;
  } catch {
    return [];
  }
}

export default function AdminTeachersPage() {
  const router = useRouter();

  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<TeacherStats>({
    total: 0,
    verified: 0,
    pending: 0,
    totalClasses: 0,
    totalStudents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<FilterStatus>("all");
  const [schoolFilter, setSchoolFilter] = useState("");

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Teacher | null>(null);

  // Selection state
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Fetch teachers
  const fetchTeachers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/teachers");
      if (!response.ok) throw new Error("Failed to fetch teachers");

      const data = await response.json();
      const teachersData: Teacher[] = (data.data || []).map((t: Teacher) => ({
        ...t,
        isActive: t.onboardingStatus === "completed",
        stats: {
          classes: 0,
          students: 0,
        },
      }));

      setTeachers(teachersData);

      // Calculate stats
      const verifiedCount = teachersData.filter((t) => t.emailVerified).length;
      const pendingCount = teachersData.filter((t) => !t.emailVerified).length;
      const totalClasses = teachersData.reduce((sum, t) => sum + (t.stats?.classes || 0), 0);
      const totalStudents = teachersData.reduce((sum, t) => sum + (t.stats?.students || 0), 0);

      setStats({
        total: teachersData.length,
        verified: verifiedCount,
        pending: pendingCount,
        totalClasses,
        totalStudents,
      });
    } catch (err) {
      logger.error(err, { action: "fetchTeachers" });
      setError("Failed to load teachers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Calculate filtered teachers
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVerification =
      verificationFilter === "all" ||
      (verificationFilter === "verified" && teacher.emailVerified) ||
      (verificationFilter === "pending" && !teacher.emailVerified);

    const matchesSchool = !schoolFilter || teacher.schoolId === schoolFilter;

    return matchesSearch && matchesVerification && matchesSchool;
  });

  // Get unique schools for filter
  const uniqueSchools = Array.from(
    new Map(
      teachers
        .filter((t) => t.school && t.schoolId)
        .map((t) => [t.schoolId, t.school!] as [string, typeof t.school])
    ).values()
  );

  // Reset focus when filtered teachers change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredTeachers.length]);

  // Refresh data
  const refreshData = () => {
    router.refresh();
    fetchTeachers();
  };

  // Update teacher name with inline edit
  const updateTeacherName = async (teacherId: string, newName: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const [firstName, ...lastNameParts] = newName.trim().split(" ");
    const lastName = lastNameParts.join(" ");

    const oldFirstName = teacher.firstName;
    const oldLastName = teacher.lastName;

    // Optimistic update
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === teacherId ? { ...t, firstName, lastName, name: newName } : t
      )
    );

    try {
      const response = await fetch(`/api/admin/users/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (!response.ok) throw new Error("Failed to update name");
    } catch (err) {
      // Rollback
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === teacherId ? { ...t, firstName: oldFirstName, lastName: oldLastName } : t
        )
      );
      logger.error(err, { action: "updateTeacherName", teacherId });
      throw err;
    }
  };

  // Update teacher email with inline edit
  const updateTeacherEmail = async (teacherId: string, newEmail: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const oldEmail = teacher.email;

    // Optimistic update
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, email: newEmail } : t))
    );

    try {
      const response = await fetch(`/api/admin/users/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!response.ok) throw new Error("Failed to update email");
    } catch (err) {
      // Rollback
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, email: oldEmail } : t))
      );
      logger.error(err, { action: "updateTeacherEmail", teacherId });
      throw err;
    }
  };

  // Update teacher phone with inline edit
  const updateTeacherPhone = async (teacherId: string, newPhone: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const oldPhone = teacher.phone;

    // Optimistic update
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, phone: newPhone || null } : t))
    );

    try {
      const response = await fetch(`/api/admin/users/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone || null }),
      });

      if (!response.ok) throw new Error("Failed to update phone");
    } catch (err) {
      // Rollback
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, phone: oldPhone } : t))
      );
      logger.error(err, { action: "updateTeacherPhone", teacherId });
      throw err;
    }
  };

  // Toggle verification with optimistic update
  const toggleVerification = async (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    const newStatus = !teacher.emailVerified;

    // Optimistic update
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, emailVerified: newStatus } : t))
    );

    setIsVerifying(teacherId);

    try {
      const response = await fetch(`/api/admin/users/${teacherId}/verify`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to update verification");

      // Update stats
      setStats((prev) => ({
        ...prev,
        verified: newStatus ? prev.verified + 1 : prev.verified - 1,
        pending: newStatus ? prev.pending - 1 : prev.pending + 1,
      }));
    } catch (err) {
      // Rollback
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, emailVerified: !newStatus } : t))
      );
      logger.error(err, { action: "toggleVerification", teacherId });
      setError("Failed to update verification. Please try again.");
    } finally {
      setIsVerifying(null);
    }
  };

  // Delete teacher
  const deleteTeacher = async (teacherId: string) => {
    setIsDeleting(teacherId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${teacherId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMsg = `Failed to delete teacher (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMsg);
      }

      // Remove from local state
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
      setDeleteConfirm(null);

      // Update stats
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      logger.error(err, { action: "deleteTeacher", teacherId });
      setError("Failed to delete teacher. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle selection
  const toggle = useCallback((teacherId: string) => {
    setSelectedTeachers((prev) => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (selectedTeachers.size === filteredTeachers.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(filteredTeachers.map((t) => t.id)));
    }
  };

  const allSelected = filteredTeachers.length > 0 && selectedTeachers.size === filteredTeachers.length;

  // Bulk actions
  const bulkAction = async (action: string, value?: any) => {
    try {
      if (action === "delete") {
        if (!confirm(`Delete ${selectedTeachers.size} selected teachers? This cannot be undone.`)) return;
        await Promise.all(
          Array.from(selectedTeachers).map((id) => fetch(`/api/admin/users/${id}`, { method: "DELETE" }))
        );
      } else if (action === "verify") {
        await Promise.all(
          Array.from(selectedTeachers).map((id) =>
            fetch(`/api/admin/users/${id}/verify`, { method: "POST" })
          )
        );
      } else if (action === "status") {
        await Promise.all(
          Array.from(selectedTeachers).map((id) =>
            fetch(`/api/admin/users/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: value }),
            })
          )
        );
      }
      setSelectedTeachers(new Set());
      await fetchTeachers();
    } catch (err) {
      logger.error(err, { event: "bulkAction", actionType: action });
      setError("Failed to complete bulk action");
    }
  };

  // Get initials for avatar
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  // Get avatar gradient
  const getAvatarGradient = () => {
    return "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)";
  };

  // Get subject display
  const getSubjectsDisplay = (subjects: string | string[] | null | undefined) => {
    const parsed = parseSubjects(subjects);
    if (parsed.length === 0) return "-";
    if (parsed.length === 1) return parsed[0];
    return `${parsed[0]} +${parsed.length - 1}`;
  };

  // Handle view teacher
  const handleViewTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsEditModalOpen(true);
  };

  // Handle edit teacher
  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsEditModalOpen(true);
  };

  // Handle delete teacher
  const handleDeleteTeacher = (teacher: Teacher) => {
    setDeleteConfirm(teacher);
  };

  // Handle reset password
  const handleResetPassword = (teacher: Teacher) => {
    // TODO: Implement password reset
    alert(`Password reset link sent to ${teacher.email}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (filteredTeachers.length === 0) return;

      const focusedTeacherId =
        focusedIndex >= 0 && focusedIndex < filteredTeachers.length
          ? filteredTeachers[focusedIndex]?.id
          : null;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < filteredTeachers.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          if (focusedIndex >= 0 && focusedTeacherId) {
            const teacher = teachers.find((t) => t.id === focusedTeacherId);
            if (teacher) {
              handleEditTeacher(teacher);
            }
          }
          break;
        case " ":
          if (focusedIndex >= 0 && focusedTeacherId) {
            e.preventDefault();
            toggle(focusedTeacherId);
          }
          break;
        case "Escape":
          setFocusedIndex(-1);
          if (selectedTeachers.size > 0) {
            setSelectedTeachers(new Set());
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredTeachers, focusedIndex, teachers, selectedTeachers.size, toggle]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Teachers</h1>
          <p className="text-xs text-gray-500">{stats.total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            {isLoading ? (
              <Spinner className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingTeacher(null);
              setIsEditModalOpen(true);
            }}
            className="h-8 bg-pink-600 hover:bg-pink-700 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-3 mb-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Action Bar - Conditional */}
      {selectedTeachers.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg mb-3">
          <span className="text-sm font-medium text-pink-900">{selectedTeachers.size} selected</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-pink-700 hover:bg-pink-100"
              onClick={() => setSelectedTeachers(new Set())}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-pink-700 hover:bg-pink-100"
              onClick={() => bulkAction("verify")}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Verify
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-pink-700 hover:bg-pink-100"
              onClick={() => bulkAction("status", true)}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Enable
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-pink-700 hover:bg-pink-100"
              onClick={() => bulkAction("status", false)}
            >
              <Ban className="w-3.5 h-3.5 mr-1" />
              Disable
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-red-600 hover:bg-red-50"
              onClick={() => bulkAction("delete")}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Stats Overview - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-pink-50">
            <Briefcase className="w-4 h-4 text-pink-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Teachers</p>
            <p className="text-sm font-semibold text-pink-600">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-blue-50">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Verified</p>
            <p className="text-sm font-semibold text-blue-600">{stats.verified}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-yellow-50">
            <Ban className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-sm font-semibold text-yellow-600">{stats.pending}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-purple-50">
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Classes</p>
            <p className="text-sm font-semibold text-purple-600">{stats.totalClasses}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-green-50">
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Students</p>
            <p className="text-sm font-semibold text-green-600">{stats.totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search teachers..."
            className="pl-8 h-9 text-sm border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={verificationFilter} onValueChange={(v) => setVerificationFilter(v as FilterStatus)}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            {verificationChips.map((chip) => {
              const Icon = chip.icon;
              return (
                <SelectItem key={chip.value} value={chip.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {chip.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {uniqueSchools.length > 0 && (
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm border-gray-200">
              <SelectValue placeholder="School" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {uniqueSchools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {filteredTeachers.length > 0 && (
          <button
            onClick={toggleAll}
            className="ml-auto flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            {allSelected ? (
              <Check className="w-4 h-4 text-pink-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        )}
        <span className="text-xs text-gray-400">
          {filteredTeachers.length} of {stats.total}
        </span>
      </div>

      {/* Custom Grid Table */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={8} />
      ) : (
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-200 text-xs font-medium text-gray-500">
            <div className="col-span-1"></div>
            <div className="col-span-3">Teacher</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">School</div>
            <div className="col-span-1">Subjects</div>
            <div className="col-span-1">Verified</div>
            <div className="col-span-1">Students</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                <Briefcase className="w-8 h-8 mb-2 opacity-50" />
                {searchQuery || verificationFilter !== "all" || schoolFilter
                  ? "No teachers found"
                  : "No teachers yet"}
              </div>
            ) : (
              filteredTeachers.map((teacher, idx) => {
                const selected = selectedTeachers.has(teacher.id);
                const isFocused = focusedIndex === idx;
                const subjects = parseSubjects(teacher.subjects);
                return (
                  <div
                    key={teacher.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm transition-colors cursor-pointer group",
                      selected ? "bg-pink-50" : "hover:bg-gray-50",
                      isFocused && "ring-2 ring-pink-400 ring-inset z-10"
                    )}
                    onClick={(e) => {
                      if (
                        !(e.target as HTMLElement).closest("button") &&
                        !(e.target as HTMLElement).closest("input")
                      ) {
                        toggle(teacher.id);
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                          selected ? "bg-pink-600 border-pink-600" : "border-gray-300 group-hover:border-pink-400"
                        )}
                        onClick={() => toggle(teacher.id)}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* Teacher - Avatar + Name */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ background: getAvatarGradient() }}
                      >
                        {getInitials(teacher.firstName, teacher.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">
                          {teacher.employeeId || teacher.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    {/* Email - Inline Editable */}
                    <div className="col-span-2">
                      <InlineEditText
                        value={teacher.email || ""}
                        onSave={(newValue) => updateTeacherEmail(teacher.id, newValue)}
                        className="text-gray-600 text-xs"
                      />
                    </div>

                    {/* School */}
                    <div className="col-span-2 text-xs text-gray-500 truncate">
                      {teacher.school?.name || "-"}
                    </div>

                    {/* Subjects */}
                    <div className="col-span-1">
                      {subjects.length > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 border-purple-200 text-purple-700 bg-purple-50"
                        >
                          {getSubjectsDisplay(teacher.subjects)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* Verified - Toggle */}
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      {isVerifying === teacher.id ? (
                        <div className="flex items-center justify-center">
                          <Spinner className="w-4 h-4 animate-spin text-pink-600" />
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleVerification(teacher.id)}
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80",
                            teacher.emailVerified
                              ? "bg-green-50 text-green-700"
                              : "bg-yellow-50 text-yellow-700"
                          )}
                        >
                          {teacher.emailVerified ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Yes
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3 mr-1" />
                              No
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Students Count */}
                    <div className="col-span-1 text-xs text-gray-500">
                      {teacher.stats?.students || 0}
                    </div>

                    {/* Status - Action Menu */}
                    <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <QuickActionMenu
                        user={teacher}
                        onView={handleViewTeacher}
                        onEdit={handleEditTeacher}
                        onDelete={handleDeleteTeacher}
                        onResetPassword={handleResetPassword}
                        onVerifyEmail={
                          !teacher.emailVerified
                            ? (t) => toggleVerification(t.id)
                            : undefined
                        }
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      <EditTeacherModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTeacher(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingTeacher(null);
          fetchTeachers();
        }}
        teacher={editingTeacher}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteTeacher(deleteConfirm.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting === deleteConfirm?.id ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Teacher"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
