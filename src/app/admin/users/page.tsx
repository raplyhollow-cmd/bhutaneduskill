"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - USERS MANAGEMENT
 *
 * Ultra-luxury intelligent inline-editing grid design:
 * - Inline editable fields (click to edit, no panels)
 * - Role selector dropdown (inline change)
 * - Status toggle (click to toggle, no confirmation)
 * - Quick action menu (three-dot with all actions)
 * - Keyboard navigation (arrows, enter, space, escape)
 * - Optimistic UI (instant feedback, sync in background)
 * - Bulk actions with conditional bar
 * - Custom grid table (12-column, NOT HTML table)
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddUserModal } from "@/components/admin/add-user-modal";
import { EditUserModal } from "@/components/admin/edit-user-modal";
import { InlineEditText } from "@/components/admin/inline-edit-text";
import { RoleSelector } from "@/components/admin/role-selector";
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
  UserX,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  ChevronDown,
  Eye,
  Edit,
  Key,
  MailCheck,
  Loader2 as Spinner,
  GraduationCap,
  Briefcase,
  UserCircle,
  Shield,
  CheckCircle,
  Ban,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";

// User type icons and colors (modern palette)
const userTypeInfo: Record<string, { icon: LucideIcon; color: string; bgColor: string; gradient: string }> = {
  student: {
    icon: GraduationCap,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    gradient: "from-orange-500 to-orange-600",
  },
  teacher: {
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    gradient: "from-blue-500 to-blue-600",
  },
  parent: {
    icon: UserCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    gradient: "from-gray-500 to-gray-600",
  },
  admin: {
    icon: Shield,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    gradient: "from-pink-500 to-pink-600",
  },
  counselor: {
    icon: UserCheck,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    gradient: "from-purple-500 to-purple-600",
  },
  "school-admin": {
    icon: Shield,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    gradient: "from-violet-500 to-violet-600",
  },
};

// Status badges (modern design)
const statusBadges: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  active: {
    label: "Active",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: Ban,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
};

// Filter chip options
const filterChips = [
  { value: "all", label: "All Roles", icon: Users },
  { value: "student", label: "Students", icon: GraduationCap },
  { value: "teacher", label: "Teachers", icon: Briefcase },
  { value: "parent", label: "Parents", icon: UserCircle },
  { value: "counselor", label: "Counselors", icon: UserCheck },
  { value: "school-admin", label: "School Admins", icon: Shield },
  { value: "admin", label: "Platform Admins", icon: Shield },
];

const statusChips = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active", icon: CheckCircle },
  { value: "inactive", label: "Inactive", icon: Ban },
  { value: "pending", label: "Pending", icon: Clock },
];

interface User {
  id: string;
  clerkUserId: string;
  type: string;
  role: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  schoolId: string | null;
  tenantId: string | null;
  isActive: boolean;
  emailVerified: boolean;
  onboardingComplete: boolean;
  lastLogin?: string | null;
  createdAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  school?: {
    id: string;
    name: string;
    code: string;
  } | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
  } | null;
}

interface UserStats {
  total: number;
  students: number;
  teachers: number;
  parents: number;
  admins: number;
  counselors: number;
}

interface PaginatedResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    students: 0,
    teachers: 0,
    parents: 0,
    admins: 0,
    counselors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">(
    (searchParams.get("status") as "all" | "active" | "inactive" | "pending") || "all"
  );

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [selectAllCount, setSelectAllCount] = useState(0);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json() as { success: boolean; data?: { data?: User[]; pagination?: { page: number; limit: number; total: number; totalPages: number } } };
      const usersData = data.data?.data || [];
      const paginationData = data.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

      setUsers(usersData);
      setPagination(paginationData);

      // Calculate stats from the data
      const statsData: UserStats = {
        total: paginationData.total,
        students: usersData.filter((u) => u.type === "student").length,
        teachers: usersData.filter((u) => u.type === "teacher").length,
        parents: usersData.filter((u) => u.type === "parent").length,
        admins: usersData.filter((u) => u.type === "admin").length,
        counselors: usersData.filter((u) => u.type === "counselor").length,
      };
      setStats(statsData);
    } catch (err) {
      logger.error(err, { action: "fetchUsers" });
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and when filters/pagination change
  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  // Handle search (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter]);

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setIsToggling(userId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      logger.error(err, { action: "toggleUserStatus", userId });
      setError("Failed to update user status. Please try again.");
    } finally {
      setIsToggling(null);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(userId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMsg = `Failed to delete user (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMsg = errorData.error;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMsg);
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      // Log with explicit context
      const context = { action: "deleteUser", userId };
      console.log("[deleteUser] Error context:", context);
      logger.error(err, context);
      setError("Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Get user status
  const getUserStatus = (user: User) => {
    if (!user.emailVerified) return "pending";
    if (user.isActive && user.lastLogin) return "active";
    if (user.isActive && !user.lastLogin) return "pending";
    return "inactive";
  };

  // Select all users across all pages
  const selectAllUsers = async () => {
    try {
      // Fetch all user IDs (not paginated)
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      // Set a very high limit to get all users
      params.set("limit", "10000");

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data: PaginatedResponse = await response.json();
      const allUserIds = new Set(data.data.map((u) => u.id));

      setSelectedUsers(allUserIds);
      setIsSelectAllMode(true);
      setSelectAllCount(data.pagination.total);
    } catch (err) {
      logger.error(err, { action: "selectAllUsers" });
      setError("Failed to select all users.");
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUsers(new Set());
    setIsSelectAllMode(false);
    setSelectAllCount(0);
  };

  // Get avatar initials
  const getAvatarInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  // Get avatar gradient based on user type
  const getAvatarGradient = (type: string) => {
    const info = userTypeInfo[type] || userTypeInfo.student;
    return `linear-gradient(135deg, rgb(var(--${info.gradient}-from)) 0%, rgb(var(--${info.gradient}-to)) 100%)`;
  };

  // Helper functions for inline editing
  const updateUserName = async (userId: string, firstName: string, lastName: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      if (!response.ok) throw new Error("Failed to update name");
      await fetchUsers();
    } catch (err) {
      logger.error(err, { action: "updateUserName", userId });
      throw err;
    }
  };

  const updateUserEmail = async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Failed to update email");
      await fetchUsers();
    } catch (err) {
      logger.error(err, { action: "updateUserEmail", userId });
      throw err;
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const oldRole = user.type;

    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, type: role } : u)));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Failed to update role");
    } catch (err) {
      // Rollback
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, type: oldRole } : u)));
      logger.error(err, { action: "updateUserRole", userId });
      throw err;
    }
  };

  // Get avatar gradient based on user type
  const getRoleGradient = (type: string) => {
    const gradients = {
      student: "linear-gradient(135deg, #f97316, #ea580c)",
      teacher: "linear-gradient(135deg, #3b82f6, #2563eb)",
      parent: "linear-gradient(135deg, #6b7280, #4b5563)",
      counselor: "linear-gradient(135deg, #a855f7, #9333ea)",
      admin: "linear-gradient(135deg, #ec4899, #db2777)",
      "school-admin": "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      ministry: "linear-gradient(135deg, #14b8a6, #0d9488)",
    };
    return gradients[type] || gradients.parent;
  };

  // Toggle functions
  const toggle = useCallback((userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const allSelected = users.length > 0 && selectedUsers.size === users.length;

  // Optimistic status toggle
  const toggleStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newStatus = !user.isActive;
    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u)));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      // Rollback
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !newStatus } : u)));
      logger.error(err, { action: "toggleStatus", userId });
    }
  };

  // Bulk actions
  const bulkAction = async (action: string, value?: any) => {
    try {
      if (action === "delete") {
        if (!confirm(`Delete ${selectedUsers.size} selected users? This cannot be undone.`)) return;
        await Promise.all(Array.from(selectedUsers).map((id) => fetch(`/api/admin/users/${id}`, { method: "DELETE" })));
      } else if (action === "status") {
        await Promise.all(Array.from(selectedUsers).map((id) =>
          fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: value }),
          })
        ));
      }
      setSelectedUsers(new Set());
      await fetchUsers();
    } catch (err) {
      logger.error(err, { event: "bulkAction", actionType: action });
      setError("Failed to complete bulk action");
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  // Get filtered users
  const filteredUsers = users.filter((user) => {
    const matchSearch = !searchQuery ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "all" || user.type === roleFilter;
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive) ||
      (statusFilter === "pending" && !user.emailVerified);
    return matchSearch && matchRole && matchStatus;
  });

  // Reset focus when filtered users change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredUsers.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (filteredUsers.length === 0) return;

      const focusedUserId = focusedIndex >= 0 && focusedIndex < filteredUsers.length ? filteredUsers[focusedIndex]?.id : null;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          if (focusedIndex >= 0 && focusedUserId) {
            setEditingUser(users.find((u) => u.id === focusedUserId) || null);
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
          if (selectedUsers.size > 0) {
            setSelectedUsers(new Set());
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredUsers, focusedIndex, users, selectedUsers.size]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="text-xs text-gray-500">{pagination.total.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading} className="h-8 text-xs">
            {isLoading ? <Spinner className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 bg-pink-600 hover:bg-pink-700 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add User
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
      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg mb-3">
          <span className="text-sm font-medium text-pink-900">{selectedUsers.size} selected</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-pink-700 hover:bg-pink-100" onClick={() => setSelectedUsers(new Set())}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-pink-700 hover:bg-pink-100" onClick={() => bulkAction("status", true)}>
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Enable
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-pink-700 hover:bg-pink-100" onClick={() => bulkAction("status", false)}>
              <UserX className="w-3.5 h-3.5 mr-1" /> Disable
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
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="parent">Parents</SelectItem>
            <SelectItem value="counselor">Counselors</SelectItem>
            <SelectItem value="school-admin">School Admins</SelectItem>
            <SelectItem value="admin">Platform Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive" | "pending")}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        {filteredUsers.length > 0 && (
          <button onClick={toggleAll} className="ml-auto flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            {allSelected ? <Check className="w-4 h-4 text-pink-600" /> : <Square className="w-4 h-4 text-gray-400" />}
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        )}
        <span className="text-xs text-gray-400">{filteredUsers.length} of {pagination.total}</span>
      </div>

      {/* Custom Grid Table */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={7} />
      ) : (
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-200 text-xs font-medium text-gray-500">
            <div className="col-span-1"></div>
            <div className="col-span-2">User</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">School</div>
            <div className="col-span-1">Reviewed By</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all" ? "No results found" : "No users yet"}
              </div>
            ) : (
              filteredUsers.map((user, idx) => {
                const selected = selectedUsers.has(user.id);
                const isFocused = focusedIndex === idx;
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm transition-colors cursor-pointer group",
                      selected ? "bg-pink-50" : "hover:bg-gray-50",
                      isFocused && "ring-2 ring-pink-400 ring-inset z-10"
                    )}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest("input")) {
                        toggle(user.id);
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
                        onClick={() => toggle(user.id)}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* User - Avatar + Name */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ background: getRoleGradient(user.type) }}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[100px]">{user.clerkUserId?.slice(0, 6)}...</p>
                      </div>
                    </div>

                    {/* Email - Inline Editable */}
                    <div className="col-span-2">
                      <InlineEditText
                        value={user.email || ""}
                        onSave={(newValue) => updateUserEmail(user.id, newValue)}
                        className="text-gray-600 text-xs"
                      />
                    </div>

                    {/* Role - Dropdown Selector */}
                    <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                      <RoleSelector
                        value={user.type}
                        onChange={(newRole) => updateUserRole(user.id, newRole)}
                        size="sm"
                      />
                    </div>

                    {/* School */}
                    <div className="col-span-2 text-xs text-gray-500 truncate">
                      {user.school?.name || user.tenant?.name || "-"}
                    </div>

                    {/* Reviewed By */}
                    <div className="col-span-1 text-xs text-gray-500 truncate" title={user.approvedByUser ? `${user.approvedByUser.firstName} ${user.approvedByUser.lastName} (${user.approvedByUser.type})` : undefined}>
                      {user.approvedByUser ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="truncate max-w-[60px]">
                            {user.approvedByUser.firstName} {user.approvedByUser.lastName?.[0]}.
                          </span>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            user.approvedByUser.type === "teacher" ? "bg-blue-500" :
                            user.approvedByUser.type === "school-admin" ? "bg-violet-500" :
                            user.approvedByUser.type === "admin" ? "bg-pink-500" :
                            "bg-gray-400"
                          )} />
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </div>

                    {/* Status - Clickable Badge */}
                    <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80",
                          user.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>

                    {/* Quick Actions Menu */}
                    <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <QuickActionMenu
                        user={user}
                        onView={() => setEditingUser(user)}
                        onEdit={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                        onDelete={() => deleteUser(user.id)}
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

      {/* Stats Overview - Compact 2x3 Grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-pink-600", bg: "bg-pink-50", icon: Users },
            { label: "Students", value: stats.students, color: "text-orange-600", bg: "bg-orange-50", icon: GraduationCap },
            { label: "Teachers", value: stats.teachers, color: "text-blue-600", bg: "bg-blue-50", icon: Briefcase },
            { label: "Parents", value: stats.parents, color: "text-gray-600", bg: "bg-gray-50", icon: UserCircle },
            { label: "Counselors", value: stats.counselors, color: "text-purple-600", bg: "bg-purple-50", icon: UserCheck },
            { label: "Admins", value: stats.admins, color: "text-violet-600", bg: "bg-violet-50", icon: Shield },
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

      {/* Add User Modal */}
      <AddUserModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchUsers();
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
          fetchUsers();
        }}
      />
    </div>
  );
}
