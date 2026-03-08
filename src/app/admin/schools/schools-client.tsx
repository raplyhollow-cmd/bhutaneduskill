"use client";

/**
 * PLATFORM ADMIN - SCHOOLS MANAGEMENT
 *
 * Using GoogleDataTable for consistent grid experience:
 * - Inline editable fields (click to edit, no panels)
 * - School type selector (inline change)
 * - Status toggle (click to toggle, no confirmation)
 * - Quick action menu (three-dot with all actions)
 * - Optimistic UI (instant feedback, sync in background)
 * - Bulk actions with conditional bar
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Button } from "@/components/ui/button";
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
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import { GoogleDataTable, GoogleColumn, GoogleAction } from "@/components/admin/google-data-table";
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  X,
  Check,
  Trash2,
  Loader2 as Spinner,
  AlertCircle,
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

  // Update field with inline edit - unified handler
  const handleUpdate = async (id: string, field: string, value: string): Promise<void> => {
    const school = schools.find((s) => s.id === id);
    if (!school) return;

    const oldValue = school[field as keyof School];

    // Optimistic update
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );

    try {
      const response = await fetch(`/api/schools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (err) {
      // Rollback
      setSchools((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: oldValue } : s))
      );
      logger.error(err, { action: "update", field, id });
      throw err;
    }
  };

  // Delete school
  const deleteSchool = async (schoolId: string) => {
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

  // Calculate stats for status chips
  const activeSchools = schools.filter((s) => s.isActive !== false).length;

  // Define columns for GoogleDataTable
  const columns: GoogleColumn<School>[] = [
    {
      id: "name",
      label: "School",
      width: "240px",
      sortable: true,
      filterable: true,
      editable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-medium flex-shrink-0 shadow-sm"
            style={{
              background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
            }}
          >
            {getSchoolInitials(row.name)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-xs truncate">{row.name}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{row.city || "-"}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "code",
      label: "Code",
      width: "100px",
      sortable: true,
      filterable: true,
      editable: true,
    },
    {
      id: "schoolType",
      label: "Type",
      width: "140px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <Badge
          variant="outline"
          className={cn("text-xs", getSchoolTypeColor(row.schoolType))}
        >
          {row.schoolType}
        </Badge>
      ),
    },
    {
      id: "contactEmail",
      label: "Contact",
      width: "200px",
      sortable: false,
      editable: true,
    },
    {
      id: "stats.students",
      label: "Students",
      width: "80px",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-xs font-medium">{row.stats.students}</span>
        </div>
      ),
    },
    {
      id: "isActive",
      label: "Status",
      width: "80px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(row.id);
          }}
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80",
            row.isActive !== false
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {row.isActive !== false ? "Active" : "Inactive"}
        </button>
      ),
    },
  ];

  // Row actions
  const actions: GoogleAction<School>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/schools/${row.id}`),
    },
    {
      label: "Edit School",
      icon: <Edit className="w-4 h-4" />,
      onClick: (row) => handleEditClick(row),
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<School>,
    {
      label: "Delete School",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => handleDeleteClick(row),
      variant: "danger",
    },
  ];

  // Bulk actions bar
  const bulkActionsBar = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-pink-700 hover:bg-pink-100"
        onClick={() => {
          // Handle bulk enable
          filteredSchools.forEach(async (school) => {
            if (!school.isActive) {
              await fetch(`/api/schools/${school.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: true }),
              });
            }
          });
          refreshData();
        }}
      >
        <CheckCircle className="w-3.5 h-3.5 mr-1" />
        Enable
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-pink-700 hover:bg-pink-100"
        onClick={() => {
          // Handle bulk disable
          filteredSchools.forEach(async (school) => {
            if (school.isActive !== false) {
              await fetch(`/api/schools/${school.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: false }),
              });
            }
          });
          refreshData();
        }}
      >
        <Ban className="w-3.5 h-3.5 mr-1" />
        Disable
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-red-600 hover:bg-red-50"
        onClick={() => {
          // Handle bulk delete
          if (!confirm(`Delete ${filteredSchools.length} selected schools? This cannot be undone.`)) return;
          filteredSchools.forEach(async (school) => {
            await fetch(`/api/schools/${school.id}`, { method: "DELETE" });
          });
          refreshData();
        }}
      >
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        Delete
      </Button>
    </div>
  );

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

      {/* GoogleDataTable */}
      <div className="flex-1 min-h-0">
        <GoogleDataTable<School>
          data={filteredSchools}
          columns={columns}
          keyField="id"
          isLoading={isLoading}
          title="Schools"
          subtitle={`${totalSchools} total schools`}
          actions={actions}
          bulkActions={bulkActionsBar}
          onUpdate={handleUpdate}
          rowActions={true}
          toolbar={
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="School Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
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
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusChips.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <SelectItem key={chip.value} value={chip.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-3 h-3" />
                          {chip.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          }
          emptyState={
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {searchQuery || typeFilter || statusFilter !== "all"
                  ? "No schools found"
                  : "No schools yet"}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingSchool(null);
                  setIsSlideInOpen(true);
                }}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First School
              </Button>
            </div>
          }
        />
      </div>

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