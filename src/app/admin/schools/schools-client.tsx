"use client";

/**
 * PLATFORM ADMIN - SCHOOLS MANAGEMENT
 *
 * Ultra-luxury intelligent inline-editing grid design:
 * - Inline editable fields (click to edit, no panels)
 * - School type selector (inline change)
 * - Status toggle (click to toggle, no confirmation)
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/ui/skeleton/table-skeleton";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  X,
  Check,
  Square,
  Trash2,
  MoreHorizontal,
  Loader2 as Spinner,
  AlertCircle,
  ChevronDown,
  Eye,
  Edit,
  Upload,
  MapPin,
  CheckCircle,
  Ban,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { AddSchoolSlideIn } from "@/components/admin/add-school-slide-in";
import { BulkImportSchoolsModal } from "@/components/admin/bulk-import-schools-modal";

interface School {
  id: string;
  name: string;
  code: string;
  schoolType: string;
  level: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: Date | string;
  tenantId: string;
  tenantName: string;
  districtId: string;
  city: string;
  isActive?: boolean;
  stats: {
    students: number;
    teachers: number;
    counselors: number;
  };
}

interface SchoolsClientProps {
  schoolsWithStats: School[];
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCounselors: number;
  schoolTypes: Record<string, number>;
}

// School type options for dropdown
const schoolTypeOptions = [
  { value: "HSS", label: "Higher Secondary", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "MSS", label: "Middle Secondary", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "LSS", label: "Lower Secondary", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "Primary", label: "Primary", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "Private", label: "Private", color: "bg-pink-100 text-pink-700 border-pink-200" },
];

// Status filter chips
const statusChips = [
  { value: "all", label: "All Schools", icon: Building2 },
  { value: "active", label: "Active", icon: CheckCircle },
  { value: "inactive", label: "Inactive", icon: Ban },
  { value: "pending", label: "Pending", icon: Clock },
];

type FilterStatus = "all" | "active" | "pending" | "inactive";

export function SchoolsClient({
  schoolsWithStats,
  totalSchools,
  totalStudents,
  totalTeachers,
  totalCounselors,
  schoolTypes,
}: SchoolsClientProps) {
  const router = useRouter();

  // State
  const [schools, setSchools] = useState<School[]>(schoolsWithStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState("");

  // Modal state
  const [isSlideInOpen, setIsSlideInOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<School | null>(null);

  // Selection state
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Quick add modal
  const quickAdd = useExpressAdd();

  // Calculate filtered schools
  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !typeFilter || school.schoolType === typeFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && school.isActive !== false) ||
      (statusFilter === "inactive" && school.isActive === false) ||
      (statusFilter === "pending" && school.isActive === false);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Reset focus when filtered schools change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredSchools]);

  // Refresh data
  const refreshData = () => {
    router.refresh();
  };

  // Toggle school active status with optimistic update
  const toggleStatus = async (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    const newStatus = school.isActive === false ? true : false;

    // Optimistic update
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, isActive: newStatus } : s))
    );

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      // Rollback on error
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, isActive: !newStatus } : s))
      );
      logger.error(err, { action: "toggleStatus", schoolId });
      setError("Failed to update status. Please try again.");
    }
  };

  // Update school code with inline edit
  const updateSchoolCode = async (schoolId: string, newCode: string) => {
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    const oldCode = school.code;

    // Optimistic update
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, code: newCode } : s))
    );

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode }),
      });

      if (!response.ok) {
        throw new Error("Failed to update code");
      }
    } catch (err) {
      // Rollback
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, code: oldCode } : s))
      );
      logger.error(err, { action: "updateSchoolCode", schoolId });
      throw err;
    }
  };

  // Update school name with inline edit
  const updateSchoolName = async (schoolId: string, newName: string) => {
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    const oldName = school.name;

    // Optimistic update
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, name: newName } : s))
    );

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update name");
      }
    } catch (err) {
      // Rollback
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, name: oldName } : s))
      );
      logger.error(err, { action: "updateSchoolName", schoolId });
      throw err;
    }
  };

  // Update contact email with inline edit
  const updateContactEmail = async (schoolId: string, newEmail: string) => {
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    const oldEmail = school.contactEmail;

    // Optimistic update
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, contactEmail: newEmail } : s))
    );

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactEmail: newEmail }),
      });

      if (!response.ok) {
        throw new Error("Failed to update email");
      }
    } catch (err) {
      // Rollback
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, contactEmail: oldEmail } : s))
      );
      logger.error(err, { action: "updateContactEmail", schoolId });
      throw err;
    }
  };

  // Update school type with dropdown
  const updateSchoolType = async (schoolId: string, newType: string) => {
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return;

    const oldType = school.schoolType;

    // Optimistic update
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, schoolType: newType } : s))
    );

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolType: newType }),
      });

      if (!response.ok) {
        throw new Error("Failed to update type");
      }
    } catch (err) {
      // Rollback
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, schoolType: oldType } : s))
      );
      logger.error(err, { action: "updateSchoolType", schoolId });
      throw err;
    }
  };

  // Delete school
  const deleteSchool = async (schoolId: string) => {
    setIsDeleting(schoolId);
    setError(null);

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete school");
      }

      // Remove from local state
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
      setDeleteConfirm(null);
    } catch (err) {
      logger.error(err, { action: "deleteSchool", schoolId });
      setError("Failed to delete school. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle selection
  const toggle = useCallback((schoolId: string) => {
    setSelectedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(schoolId)) {
        next.delete(schoolId);
      } else {
        next.add(schoolId);
      }
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (selectedSchools.size === filteredSchools.length) {
      setSelectedSchools(new Set());
    } else {
      setSelectedSchools(new Set(filteredSchools.map((s) => s.id)));
    }
  };

  const allSelected = filteredSchools.length > 0 && selectedSchools.size === filteredSchools.length;

  // Bulk actions
  const bulkAction = async (action: string, value?: any) => {
    try {
      if (action === "delete") {
        if (!confirm(`Delete ${selectedSchools.size} selected schools? This cannot be undone.`)) return;
        await Promise.all(
          Array.from(selectedSchools).map((id) => fetch(`/api/schools/${id}`, { method: "DELETE" }))
        );
      } else if (action === "status") {
        await Promise.all(
          Array.from(selectedSchools).map((id) =>
            fetch(`/api/schools/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: value }),
            })
          )
        );
      }
      setSelectedSchools(new Set());
      refreshData();
    } catch (err) {
      logger.error(err, { event: "bulkAction", actionType: action });
      setError("Failed to complete bulk action");
    }
  };

  // Quick add school handler
  const handleQuickAddSchool = async (
    name: string
  ): Promise<{ success: true; data?: unknown } | { success: false; error: string }> => {
    try {
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-3),
          schoolType: "MSS",
          level: "Middle Secondary",
          contactEmail: "contact@school.edu.bt",
          contactPhone: "+975",
          address: "Bhutan",
          districtId: null,
        }),
      });

      if (response.ok) {
        refreshData();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to add school" };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Handle modal success
  const handleModalSuccess = () => {
    refreshData();
  };

  // Handle edit click
  const handleEditClick = (school: School) => {
    setEditingSchool(school);
    setIsSlideInOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (school: School) => {
    setDeleteConfirm(school);
  };

  // Get school type color
  const getSchoolTypeColor = (type: string) => {
    const option = schoolTypeOptions.find((opt) => opt.value === type);
    return option?.color || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Get school initials for avatar
  const getSchoolInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (filteredSchools.length === 0) return;

      const focusedSchoolId =
        focusedIndex >= 0 && focusedIndex < filteredSchools.length
          ? filteredSchools[focusedIndex]?.id
          : null;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < filteredSchools.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          if (focusedIndex >= 0 && focusedSchoolId) {
            const school = schools.find((s) => s.id === focusedSchoolId);
            if (school) {
              router.push(`/admin/schools/${focusedSchoolId}`);
            }
          }
          break;
        case " ":
          if (focusedIndex >= 0 && focusedSchoolId) {
            e.preventDefault();
            toggle(focusedSchoolId);
          }
          break;
        case "Escape":
          setFocusedIndex(-1);
          if (selectedSchools.size > 0) {
            setSelectedSchools(new Set());
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredSchools, focusedIndex, schools, selectedSchools.size, toggle, router]);

  // Calculate stats for status chips
  const activeSchools = schools.filter((s) => s.isActive !== false).length;
  const pendingSchools = schools.filter((s) => s.isActive === false).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Schools</h1>
          <p className="text-xs text-gray-500">{totalSchools} total</p>
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
          <Button variant="outline" size="sm" onClick={quickAdd.open} className="h-8 text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Quick Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkImportOpen(true)}
            className="h-8 text-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Bulk Import
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingSchool(null);
              setIsSlideInOpen(true);
            }}
            className="h-8 bg-pink-600 hover:bg-pink-700 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add School
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
      {selectedSchools.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg mb-3">
          <span className="text-sm font-medium text-pink-900">{selectedSchools.size} selected</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-pink-700 hover:bg-pink-100"
              onClick={() => setSelectedSchools(new Set())}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-pink-50">
            <Building2 className="w-4 h-4 text-pink-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Schools</p>
            <p className="text-sm font-semibold text-pink-600">{totalSchools}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-blue-50">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Students</p>
            <p className="text-sm font-semibold text-blue-600">{totalStudents.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-purple-50">
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Teachers</p>
            <p className="text-sm font-semibold text-purple-600">{totalTeachers.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
          <div className="p-2 rounded-lg bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-sm font-semibold text-green-600">{activeSchools}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search schools..."
            className="pl-8 h-9 text-sm border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="School Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {schoolTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as FilterStatus)}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusChips.map((chip) => {
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
        {filteredSchools.length > 0 && (
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
          {filteredSchools.length} of {totalSchools}
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
            <div className="col-span-3">School</div>
            <div className="col-span-2">Code</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1">Students</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filteredSchools.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                <Building2 className="w-8 h-8 mb-2 opacity-50" />
                {searchQuery || typeFilter || statusFilter !== "all"
                  ? "No schools found"
                  : "No schools yet"}
              </div>
            ) : (
              filteredSchools.map((school, idx) => {
                const selected = selectedSchools.has(school.id);
                const isFocused = focusedIndex === idx;
                return (
                  <div
                    key={school.id}
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
                        toggle(school.id);
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                          selected
                            ? "bg-pink-600 border-pink-600"
                            : "border-gray-300 group-hover:border-pink-400"
                        )}
                        onClick={() => toggle(school.id)}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* School - Logo/Initials + Name (inline editable) */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-medium flex-shrink-0 shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                        }}
                      >
                        {getSchoolInitials(school.name)}
                      </div>
                      <div className="min-w-0">
                        <InlineEditText
                          value={school.name}
                          onSave={(newValue) => updateSchoolName(school.id, newValue)}
                          className="font-medium text-gray-900 text-xs"
                        />
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{school.city || "-"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Code - Inline Editable */}
                    <div className="col-span-2">
                      <InlineEditText
                        value={school.code}
                        onSave={(newValue) => updateSchoolCode(school.id, newValue)}
                        className="text-gray-600 text-xs font-mono"
                      />
                    </div>

                    {/* Type - Dropdown Selector */}
                    <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={school.schoolType}
                        onValueChange={(newType) => updateSchoolType(school.id, newType)}
                      >
                        <SelectTrigger className="h-7 text-xs border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <Badge
                                variant="outline"
                                className={cn("text-xs mr-2", opt.color)}
                              >
                                {opt.value}
                              </Badge>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Contact Email - Inline Editable */}
                    <div className="col-span-2">
                      <InlineEditText
                        value={school.contactEmail || ""}
                        onSave={(newValue) => updateContactEmail(school.id, newValue)}
                        className="text-gray-600 text-xs"
                      />
                    </div>

                    {/* Students Count */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium">{school.stats.students}</span>
                      </div>
                    </div>

                    {/* Status - Clickable Badge */}
                    <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleStatus(school.id)}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80",
                          school.isActive !== false
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {school.isActive !== false ? "Active" : "Inactive"}
                      </button>
                    </div>

                    {/* Quick Actions Menu */}
                    <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 hover:bg-gray-100 rounded transition-opacity opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/admin/schools/${school.id}`)}>
                            <Eye className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm">View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(school)}>
                            <Edit className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm">Edit School</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(school)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span className="text-sm">Delete School</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* School Types Distribution - Compact */}
      {Object.keys(schoolTypes).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.entries(schoolTypes).map(([type, count]) => (
              <Badge
                key={type}
                variant="outline"
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-all hover:shadow-sm",
                  getSchoolTypeColor(type)
                )}
              >
                {type}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* School Slide-In Form (Add/Edit) */}
      <AddSchoolSlideIn
        isOpen={isSlideInOpen}
        onClose={() => {
          setIsSlideInOpen(false);
          setEditingSchool(null);
        }}
        onSuccess={handleModalSuccess}
        school={editingSchool}
      />

      {/* Bulk Import Schools Modal */}
      <BulkImportSchoolsModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Quick Add School Modal */}
      <ExpressAddModal
        isOpen={quickAdd.isOpen}
        onClose={quickAdd.close}
        onSubmit={handleQuickAddSchool}
        title="Quick Add School"
        description="Enter school name (basic info will be auto-generated)"
        placeholder="e.g., Thimphu Middle Secondary School"
        successMessage="School added successfully! You can edit details later."
        errorMessage="Failed to add school. Please try again."
        icon={Building2}
        minLength={3}
        submitLabel="Press Enter to add school"
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete School</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will also remove all associated data including
                students, teachers, and assessments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
              <p className="text-sm text-red-900">
                You are about to delete <strong>{deleteConfirm.name}</strong>.
              </p>
              <p className="text-sm text-red-700 mt-2">
                <strong>Students:</strong> {deleteConfirm.stats.students} •
                <strong> Teachers:</strong> {deleteConfirm.stats.teachers} •
                <strong> Counselors:</strong> {deleteConfirm.stats.counselors}
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSchool(deleteConfirm.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete School
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
