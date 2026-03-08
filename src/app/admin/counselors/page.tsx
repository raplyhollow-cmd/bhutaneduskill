"use client";

/**
 * PLATFORM ADMIN - COUNSELORS MANAGEMENT
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
  Shield,
  Loader2 as Spinner,
  AlertCircle,
  Eye,
  Edit,
  Mail,
  Phone,
  CheckCircle,
  Ban,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface Counselor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  schoolId: string | null;
  specialization: string | null;
  licenseNumber: string | null;
  yearsOfExperience: number | null;
  isActive: boolean;
  assignedStudents: number;
  createdAt: string;
  school?: {
    id: string;
    name: string;
  } | null;
}

export default function AdminCounselorsPage() {
  const router = useRouter();

  // State
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Counselor | null>(null);

  // Fetch counselors
  const fetchCounselors = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/counselors");
      if (!response.ok) {
        throw new Error("Failed to fetch counselors");
      }

      const data = await response.json();
      setCounselors(data.data?.counselors || []);
    } catch (err) {
      logger.error(err, { action: "fetchCounselors" });
      setError("Failed to load counselors. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  // Filtered counselors
  const filteredCounselors = counselors.filter((counselor) => {
    const matchesSearch =
      counselor.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && counselor.isActive) ||
      (statusFilter === "inactive" && !counselor.isActive);

    return matchesSearch && matchesStatus;
  });

  // Update field
  const handleUpdate = async (id: string, field: string, value: string): Promise<void> => {
    const counselor = counselors.find((c) => c.id === id);
    if (!counselor) return;

    const oldValue = counselor[field as keyof Counselor];

    // Optimistic update
    setCounselors((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

    try {
      const response = await fetch(`/api/admin/counselors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (err) {
      // Rollback
      setCounselors((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: oldValue } : c)));
      logger.error(err, { action: "update", field, id });
      throw err;
    }
  };

  // Toggle status
  const toggleStatus = async (id: string) => {
    const counselor = counselors.find((c) => c.id === id);
    if (!counselor) return;

    const newStatus = !counselor.isActive;
    setCounselors((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: newStatus } : c)));

    try {
      const response = await fetch(`/api/admin/counselors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      setCounselors((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !newStatus } : c)));
      logger.error(err, { action: "toggleStatus", id });
      setError("Failed to update status");
    }
  };

  // Delete counselor
  const deleteCounselor = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/counselors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete counselor");
      }

      setCounselors((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      logger.error(err, { action: "deleteCounselor", id });
      setError("Failed to delete counselor. Please try again.");
    }
  };

  // Define columns
  const columns: GoogleColumn<Counselor>[] = [
    {
      id: "name",
      label: "Counselor",
      width: "200px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-medium">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      label: "Contact",
      width: "150px",
      sortable: false,
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-1 mb-0.5">
            <Mail className="w-3 h-3 text-gray-400" />
            <span className="truncate">{row.email}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "specialization",
      label: "Specialization",
      width: "150px",
      sortable: true,
      filterable: true,
      editable: true,
      render: (row) => (
        <span className="text-xs text-gray-600">{row.specialization || "-"}</span>
      ),
    },
    {
      id: "assignedStudents",
      label: "Students",
      width: "80px",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-xs font-medium">{row.assignedStudents || 0}</span>
        </div>
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
  const actions: GoogleAction<Counselor>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => router.push(`/admin/counselors/${row.id}`),
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<Counselor>,
    {
      label: "Delete Counselor",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => {
        setDeleteConfirm(row);
      },
      variant: "danger",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Counselors</h1>
          <p className="text-xs text-gray-500">{counselors.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCounselors} disabled={isLoading} className="h-8 text-xs">
            {isLoading ? <Spinner className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/admin/counselors/new")}
            className="h-8 bg-purple-600 hover:bg-purple-700 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Counselor
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
          <Shield className="w-4 h-4 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Total Counselors</p>
            <p className="text-sm font-semibold text-purple-600">{counselors.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-sm font-semibold text-blue-600">{counselors.filter((c) => c.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* GoogleDataTable */}
      <div className="flex-1 min-h-0">
        <GoogleDataTable<Counselor>
          data={filteredCounselors}
          columns={columns}
          keyField="id"
          isLoading={isLoading}
          title="Counselors"
          subtitle={`${counselors.length} total counselors`}
          actions={actions}
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
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== "all" ? "No counselors found" : "No counselors yet"}
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
              <AlertDialogTitle>Delete Counselor</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will remove the counselor from the system.
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
                onClick={() => deleteCounselor(deleteConfirm.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Counselor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}