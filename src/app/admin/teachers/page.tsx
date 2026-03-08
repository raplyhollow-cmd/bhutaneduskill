"use client";

/**
 * PLATFORM ADMIN - TEACHERS MANAGEMENT
 *
 * Using GoogleDataTable for consistent grid experience
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { GoogleDataTable, GoogleColumn, GoogleAction } from "@/components/admin/google-data-table";
import {
  Users,
  Plus,
  Search,
  Sparkles,
  X,
  Trash2,
  Briefcase,
  Loader2 as Spinner,
  AlertCircle,
  Eye,
  Edit,
  Mail,
  Shield,
  CheckCircle,
  Ban,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface Teacher {
  id: string;
  userId: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  schoolId: string | null;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
  school?: {
    id: string;
    name: string;
  } | null;
}

export default function AdminTeachersPage() {
  const router = useRouter();

  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Teacher | null>(null);

  // Fetch teachers
  const fetchTeachers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/teachers");
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }

      const data = await response.json();
      setTeachers(data.data?.teachers || []);
    } catch (err) {
      logger.error(err, { action: "fetchTeachers" });
      setError("Failed to load teachers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Filtered teachers
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && teacher.isActive) ||
      (statusFilter === "inactive" && !teacher.isActive);

    return matchesSearch && matchesStatus;
  });

  // Update field
  const handleUpdate = async (id: string, field: string, value: string): Promise<void> => {
    const teacher = teachers.find((t) => t.id === id);
    if (!teacher) return;

    const oldValue = teacher[field as keyof Teacher];

    // Optimistic update
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (err) {
      // Rollback
      setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: oldValue } : t)));
      logger.error(err, { action: "update", field, id });
      throw err;
    }
  };

  // Toggle status
  const toggleStatus = async (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    if (!teacher) return;

    const newStatus = !teacher.isActive;
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: newStatus } : t)));

    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !newStatus } : t)));
      logger.error(err, { action: "toggleStatus", id });
      setError("Failed to update status");
    }
  };

  // Delete teacher
  const deleteTeacher = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete teacher");
      }

      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      logger.error(err, { action: "deleteTeacher", id });
      setError("Failed to delete teacher. Please try again.");
    }
  };

  // Define columns
  const columns: GoogleColumn<Teacher>[] = [
    {
      id: "name",
      label: "Teacher",
      width: "200px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-gray-400">{row.employeeId || row.userId?.slice(0, 8) + "..."}</p>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      label: "Email",
      width: "200px",
      sortable: true,
      editable: true,
      render: (row) => (
        <div className="text-xs text-gray-600 flex items-center gap-1">
          <Mail className="w-3 h-3 text-gray-400" />
          <span className="truncate">{row.email}</span>
        </div>
      ),
    },
    {
      id: "phone",
      label: "Phone",
      width: "120px",
      sortable: false,
      editable: true,
    },
    {
      id: "subject",
      label: "Subject",
      width: "120px",
      sortable: true,
      filterable: true,
      editable: true,
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.subject || "Not Assigned"}
        </Badge>
      ),
    },
    {
      id: "school",
      label: "School",
      width: "150px",
      sortable: false,
      render: (row) => (
        <span className="text-xs text-gray-500">{row.school?.name || "-"}</span>
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
            row.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          )}
        >
          {row.isActive ? "Active" : "Inactive"}
        </button>
      ),
    },
  ];

  // Row actions
  const actions: GoogleAction<Teacher>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/teachers/${row.id}`),
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<Teacher>,
    {
      label: "Delete Teacher",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => {
        setDeleteConfirm(row);
      },
      variant: "danger",
    },
  ];

  // Bulk actions
  const bulkActionsBar = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-pink-700 hover:bg-pink-100"
        onClick={() => {
          filteredTeachers.forEach(async (teacher) => {
            if (!teacher.isActive) {
              await fetch(`/api/admin/teachers/${teacher.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: true }),
              });
            }
          });
          fetchTeachers();
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
          filteredTeachers.forEach(async (teacher) => {
            if (teacher.isActive) {
              await fetch(`/api/admin/teachers/${teacher.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: false }),
              });
            }
          });
          fetchTeachers();
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
          if (!confirm(`Delete ${filteredTeachers.length} selected teachers? This cannot be undone.`)) return;
          filteredTeachers.forEach(async (teacher) => {
            await fetch(`/api/admin/teachers/${teacher.id}`, { method: "DELETE" });
          });
          fetchTeachers();
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
          <h1 className="text-lg font-semibold text-gray-900">Teachers</h1>
          <p className="text-xs text-gray-500">{teachers.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTeachers} disabled={isLoading} className="h-8 text-xs">
            {isLoading ? <Spinner className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/teachers/new")}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-xs"
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
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Total Teachers</p>
            <p className="text-sm font-semibold text-blue-600">{teachers.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
          <GraduationCap className="w-4 h-4 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-sm font-semibold text-purple-600">{teachers.filter((t) => t.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* GoogleDataTable */}
      <div className="flex-1 min-h-0">
        <GoogleDataTable<Teacher>
          data={filteredTeachers}
          columns={columns}
          keyField="id"
          isLoading={isLoading}
          title="Teachers"
          subtitle={`${teachers.length} total teachers`}
          actions={actions}
          bulkActions={bulkActionsBar}
          onUpdate={handleUpdate}
          rowActions={true}
          toolbar={
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyState={
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== "all" ? "No teachers found" : "No teachers yet"}
              </p>
            </div>
          }
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will remove the teacher from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
              <p className="text-sm text-red-900">
                You are about to delete <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong>.
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTeacher(deleteConfirm.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Teacher
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}