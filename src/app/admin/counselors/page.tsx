"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - COUNSELORS MANAGEMENT
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
import { useRouter, useSearchParams } from "next/navigation";
import { AddCounselorModal } from "@/components/admin/add-counselor-modal";
import { EditCounselorModal } from "@/components/admin/edit-counselor-modal";
import { InlineEditText } from "@/components/admin/inline-edit-text";
import { QuickActionMenu } from "@/components/admin/quick-action-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Users,
  Search,
  Plus,
  Sparkles,
  X,
  Check,
  Square,
  Trash2,
  Building2,
  UserCheck,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Eye,
  Edit,
  ShieldCheck,
  MailCheck,
  Loader2 as Spinner,
  GraduationCap,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  verifyCounselor,
  deleteCounselor,
} from "@/app/admin/counselors/actions";
import type { User } from "@/types";

interface CounselorAssignment {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
}

interface CounselorStats {
  assignedSchools: number;
  totalNotes: number;
  activePlans: number;
}

interface CounselorData extends User {
  schoolName: string | null;
  stats: CounselorStats;
  assignments: CounselorAssignment[];
}

interface UserStats {
  total: number;
  verified: number;
  pending: number;
  activePlans: number;
  totalNotes: number;
}

interface PaginatedResponse {
  data: CounselorData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Status badges
const statusBadges: Record<string, { label: string; color: string; icon: any }> = {
  active: {
    label: "Active",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: Clock,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
};

export default function AdminCounselorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data states
  const [counselors, setCounselors] = useState<CounselorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    verified: 0,
    pending: 0,
    activePlans: 0,
    totalNotes: 0,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [schoolFilter, setSchoolFilter] = useState(searchParams.get("school") || "all");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">(
    (searchParams.get("status") as "all" | "verified" | "pending") || "all"
  );

  // Selection states
  const [selectedCounselors, setSelectedCounselors] = useState<Set<string>>(new Set());
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [selectAllCount, setSelectAllCount] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState<CounselorData | null>(null);
  const [deletingCounselor, setDeletingCounselor] = useState<CounselorData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Fetch counselors
  const fetchCounselors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (schoolFilter !== "all") params.set("school", schoolFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/users?role=counselor&${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch counselors");

      const data: PaginatedResponse = await response.json();
      const counselorsData: CounselorData[] = data.data || [];

      // Enrich with mock stats
      const enriched = counselorsData.map((c: CounselorData) => ({
        ...c,
        stats: {
          assignedSchools: 0,
          totalNotes: 0,
          activePlans: 0,
        },
        assignments: [],
      }));

      setCounselors(enriched);
      setPagination((prev) => ({ ...prev, ...data.pagination }));

      // Calculate stats
      setStats({
        total: data.pagination.total,
        verified: enriched.filter((c) => c.emailVerified).length,
        pending: enriched.filter((c) => !c.emailVerified).length,
        activePlans: 0,
        totalNotes: 0,
      });
    } catch (err) {
      logger.error("Failed to fetch counselors:", err);
      setError("Failed to load counselors");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, searchQuery, schoolFilter, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchCounselors();
  }, [pagination.page]);

  // Handle search (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchCounselors();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, schoolFilter, statusFilter]);

  // Get filtered counselors
  const filteredCounselors = counselors.filter((counselor) => {
    const matchSearch = !searchQuery ||
      counselor.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      counselor.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSchool = schoolFilter === "all" || counselor.schoolId === schoolFilter;
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "verified" && counselor.emailVerified) ||
      (statusFilter === "pending" && !counselor.emailVerified);
    return matchSearch && matchSchool && matchStatus;
  });

  // Reset focus when filtered counselors change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredCounselors.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (filteredCounselors.length === 0) return;

      const focusedUserId = focusedIndex >= 0 && focusedIndex < filteredCounselors.length ? filteredCounselors[focusedIndex]?.id : null;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < filteredCounselors.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          if (focusedIndex >= 0 && focusedUserId) {
            setEditingCounselor(counselors.find((c) => c.id === focusedUserId) || null);
            setIsEditModalOpen(true);
          }
          break;
        case " ":
          if (focusedIndex >= 0 && focusedUserId) {
            e.preventDefault();
            toggle(focusedUserId);
          }
          break;
        case "Escape":
          setFocusedIndex(-1);
          if (selectedCounselors.size > 0) {
            setSelectedCounselors(new Set());
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredCounselors, focusedIndex, counselors, selectedCounselors.size]);

  // Toggle selection
  const toggle = (id: string) => {
    const newSelected = new Set(selectedCounselors);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCounselors(newSelected);
  };

  const toggleAll = () => {
    if (selectedCounselors.size === filteredCounselors.length) {
      setSelectedCounselors(new Set());
    } else {
      setSelectedCounselors(new Set(filteredCounselors.map((c) => c.id)));
    }
  };

  const allSelected = filteredCounselors.length > 0 && selectedCounselors.size === filteredCounselors.length;

  // Optimistic verification toggle
  const toggleVerification = async (counselorId: string) => {
    const counselor = counselors.find((c) => c.id === counselorId);
    if (!counselor) return;

    const newStatus = !counselor.emailVerified;
    // Optimistic update
    setCounselors((prev) => prev.map((c) => (c.id === counselorId ? { ...c, emailVerified: newStatus } : c)));

    try {
      await verifyCounselor(counselorId);
    } catch (err) {
      // Rollback
      setCounselors((prev) => prev.map((c) => (c.id === counselorId ? { ...c, emailVerified: !newStatus } : c)));
      logger.error(err, { action: "toggleVerification", counselorId });
      setError("Failed to update verification status");
    }
  };

  // Update inline field
  const updateCounselorEmail = async (counselorId: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/users/${counselorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Failed to update email");
      await fetchCounselors();
    } catch (err) {
      logger.error(err, { action: "updateCounselorEmail", counselorId });
      throw err;
    }
  };

  // Delete counselor
  const deleteCounselorAction = async (counselorId: string) => {
    try {
      await deleteCounselor(counselorId);
      await fetchCounselors();
    } catch (err) {
      logger.error(err, { action: "deleteCounselor", counselorId });
      throw err;
    }
  };

  // Bulk actions
  const bulkAction = async (action: string, value?: any) => {
    try {
      if (action === "delete") {
        if (!confirm(`Delete ${selectedCounselors.size} selected counselors? This cannot be undone.`)) return;
        await Promise.all(Array.from(selectedCounselors).map((id) => deleteCounselor(id)));
      } else if (action === "verify") {
        await Promise.all(Array.from(selectedCounselors).map((id) => verifyCounselor(id)));
      }
      setSelectedCounselors(new Set());
      await fetchCounselors();
    } catch (err) {
      logger.error(err, { event: "bulkAction", actionType: action });
      setError("Failed to complete bulk action");
    }
  };

  // Get initials
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  // Get counselor gradient (purple theme)
  const getCounselorGradient = () => "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)";

  // Get unique schools
  const uniqueSchools = Array.from(
    new Map(counselors.filter((c) => c.schoolName).map((c) => [c.schoolId as string, c])).values()
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Counselors</h1>
          <p className="text-xs text-gray-500">{pagination.total.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCounselors} disabled={isLoading} className="h-8 text-xs">
            {isLoading ? <Spinner className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 bg-pink-600 hover:bg-pink-700 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Counselor
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

      {/* Bulk Action Bar - Conditional */}
      {selectedCounselors.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg mb-3">
          <span className="text-sm font-medium text-pink-900">{selectedCounselors.size} selected</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-pink-700 hover:bg-pink-100" onClick={() => setSelectedCounselors(new Set())}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-pink-700 hover:bg-pink-100" onClick={() => bulkAction("verify")}>
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verify
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => bulkAction("delete")}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-8 h-9 text-sm border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="School" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {uniqueSchools.map((school) => (
              <SelectItem key={school.schoolId} value={school.schoolId}>
                {school.schoolName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "verified" | "pending")}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        {filteredCounselors.length > 0 && (
          <button onClick={toggleAll} className="ml-auto flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            {allSelected ? <Check className="w-4 h-4 text-pink-600" /> : <Square className="w-4 h-4 text-gray-400" />}
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        )}
        <span className="text-xs text-gray-400">{filteredCounselors.length} of {pagination.total}</span>
      </div>

      {/* Custom Grid Table */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={8} />
      ) : (
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-200 text-xs font-medium text-gray-500">
            <div className="col-span-1"></div>
            <div className="col-span-3">Counselor</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">School</div>
            <div className="col-span-1">Verified</div>
            <div className="col-span-1">Plans</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filteredCounselors.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                {searchQuery || schoolFilter !== "all" || statusFilter !== "all" ? "No results found" : "No counselors yet"}
              </div>
            ) : (
              filteredCounselors.map((counselor, idx) => {
                const selected = selectedCounselors.has(counselor.id);
                const isFocused = focusedIndex === idx;
                return (
                  <div
                    key={counselor.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm transition-colors cursor-pointer group",
                      selected ? "bg-pink-50" : "hover:bg-gray-50",
                      isFocused && "ring-2 ring-pink-400 ring-inset z-10"
                    )}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest("input")) {
                        toggle(counselor.id);
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
                        onClick={() => toggle(counselor.id)}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* Counselor - Avatar + Name */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ background: getCounselorGradient() }}
                      >
                        {getInitials(counselor.firstName, counselor.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {counselor.firstName} {counselor.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{counselor.clerkUserId?.slice(0, 8)}...</p>
                      </div>
                    </div>

                    {/* Email - Inline Editable */}
                    <div className="col-span-3">
                      <InlineEditText
                        value={counselor.email || ""}
                        onSave={(newValue) => updateCounselorEmail(counselor.id, newValue)}
                        className="text-gray-600 text-xs"
                      />
                    </div>

                    {/* School */}
                    <div className="col-span-2 text-xs text-gray-500 truncate">
                      {counselor.schoolName || "-"}
                    </div>

                    {/* Verified - Toggle */}
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleVerification(counselor.id)}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80",
                          counselor.emailVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                        )}
                      >
                        {counselor.emailVerified ? <Check className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {counselor.emailVerified ? "Yes" : "No"}
                      </button>
                    </div>

                    {/* Plans Count */}
                    <div className="col-span-1 text-xs text-gray-500 text-center">
                      {counselor.stats?.activePlans || 0}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <QuickActionMenu
                        user={counselor}
                        onView={() => { setEditingCounselor(counselor); setIsEditModalOpen(true); }}
                        onEdit={() => { setEditingCounselor(counselor); setIsEditModalOpen(true); }}
                        onDelete={() => { setDeletingCounselor(counselor); setIsDeleteDialogOpen(true); }}
                        onVerifyEmail={counselor.emailVerified ? undefined : () => toggleVerification(counselor.id)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1 || isLoading}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = pagination.page <= 3
                ? i + 1
                : pagination.page >= pagination.totalPages - 2
                ? pagination.totalPages - 4 + i
                : pagination.page - 2 + i;
              if (pageNum < 1 || pageNum > pagination.totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                  disabled={isLoading}
                  className={cn(
                    "h-8 text-xs min-w-[32px]",
                    pagination.page === pageNum ? "bg-pink-600 text-white border-pink-600" : ""
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages || isLoading}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Stats Overview - Compact Grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
          {[
            { label: "Total", value: stats.total, color: "text-purple-600", bg: "bg-purple-50", icon: Users },
            { label: "Verified", value: stats.verified, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
            { label: "Pending", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock },
            { label: "Active Plans", value: stats.activePlans, color: "text-blue-600", bg: "bg-blue-50", icon: GraduationCap },
            { label: "Total Notes", value: stats.totalNotes, color: "text-gray-600", bg: "bg-gray-50", icon: Edit },
          ].map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-pink-200 transition-colors">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className="w-4 h-4 text-gray-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={cn("text-sm font-semibold", stat.color)}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Counselor Modal */}
      <AddCounselorModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCounselors}
      />

      {/* Edit Counselor Modal */}
      <EditCounselorModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCounselor(null);
        }}
        onSuccess={fetchCounselors}
        counselor={editingCounselor}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Counselor?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCounselor?.firstName} {deletingCounselor?.lastName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingCounselor) {
                  await deleteCounselorAction(deletingCounselor.id);
                  setIsDeleteDialogOpen(false);
                  setDeletingCounselor(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
