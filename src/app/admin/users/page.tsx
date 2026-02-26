"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - USERS MANAGEMENT
 *
 * Modern user management page with:
 * - Premium stat cards with hover effects
 * - Filter chips for quick filtering
 * - User type distribution with progress bars
 * - Enhanced table with avatar initials
 * - Bulk action buttons with icons
 * - Improved search functionality
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from "@/components/admin/premium-card";
import { AddUserModal } from "@/components/admin/add-user-modal";
import { EditUserModal } from "@/components/admin/edit-user-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton/table-skeleton";
import { StatCardSkeleton } from "@/components/ui/skeleton/card-skeleton";
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  Briefcase,
  UserCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sparkles,
  Ban,
} from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">(searchParams.get("status") as any || "all");

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [selectAllCount, setSelectAllCount] = useState(0);

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

      const data: PaginatedResponse = await response.json();
      setUsers(data.data || []);
      setPagination(data.pagination);

      // Calculate stats from the data
      const statsData: UserStats = {
        total: data.pagination.total,
        students: data.data.filter((u) => u.type === "student").length,
        teachers: data.data.filter((u) => u.type === "teacher").length,
        parents: data.data.filter((u) => u.type === "parent").length,
        admins: data.data.filter((u) => u.type === "admin").length,
        counselors: data.data.filter((u) => u.type === "counselor").length,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-500 mt-1">View and manage all users across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Shield className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Stats Overview - Premium Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <PremiumCard className="p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">All user types</p>
              </div>
              <div className="p-3 rounded-lg bg-pink-50 group-hover:bg-pink-100 transition-colors">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Students</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.students.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.total > 0 ? `${((stats.students / stats.total) * 100).toFixed(1)}%` : "0%"} of total
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                <GraduationCap className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Teachers</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.teachers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.total > 0 ? `${((stats.teachers / stats.total) * 100).toFixed(1)}%` : "0%"} of total
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Parents</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{stats.parents.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.total > 0 ? `${((stats.parents / stats.total) * 100).toFixed(1)}%` : "0%"} of total
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <UserCircle className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-3xl font-bold text-pink-600 mt-1">{stats.admins.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.total > 0 ? `${((stats.admins / stats.total) * 100).toFixed(1)}%` : "0%"} of total
                </p>
              </div>
              <div className="p-3 rounded-lg bg-pink-50 group-hover:bg-pink-100 transition-colors">
                <Shield className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Counselors</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.counselors.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.total > 0 ? `${((stats.counselors / stats.total) * 100).toFixed(1)}%` : "0%"} of total
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </PremiumCard>
        </div>
      )}

      {/* User Type Distribution with Progress Bars */}
      <PremiumCard>
        <PremiumCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <PremiumCardTitle>User Type Distribution</PremiumCardTitle>
              <p className="text-sm text-gray-500 mt-1">Breakdown of users by role across the platform</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>{stats.total} total users</span>
            </div>
          </div>
        </PremiumCardHeader>
        <PremiumCardContent className="space-y-4">
          {[
            { type: "student", label: "Students", count: stats.students, color: "from-orange-500 to-orange-600", bg: "bg-orange-500" },
            { type: "teacher", label: "Teachers", count: stats.teachers, color: "from-blue-500 to-blue-600", bg: "bg-blue-500" },
            { type: "parent", label: "Parents", count: stats.parents, color: "from-gray-500 to-gray-600", bg: "bg-gray-500" },
            { type: "counselor", label: "Counselors", count: stats.counselors, color: "from-purple-500 to-purple-600", bg: "bg-purple-500" },
            { type: "admin", label: "Platform Admins", count: stats.admins, color: "from-pink-500 to-pink-600", bg: "bg-pink-500" },
          ].map((item) => (
            <div key={item.type} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.bg}`} />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">{item.count.toLocaleString()}</span>
                  <span className="text-gray-500 w-12 text-right">
                    {stats.total > 0 ? `${((item.count / stats.total) * 100).toFixed(1)}%` : "0%"}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </PremiumCardContent>
      </PremiumCard>

      {/* Filters Section - Modern Design */}
      <PremiumCard noPadding>
        <div className="p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
            />
          </div>

          {/* Role Filter Chips */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Filter by Role</p>
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip) => {
                const Icon = chip.icon;
                const isActive = roleFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    onClick={() => setRoleFilter(chip.value)}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-pink-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {chip.label}
                    {isActive && <XCircle className="w-3 h-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              {statusChips.map((chip) => {
                const Icon = chip.icon;
                const isActive = statusFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    onClick={() => setStatusFilter(chip.value as any)}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-pink-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                      }
                    `}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {chip.label}
                    {isActive && <XCircle className="w-3 h-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {roleFilter !== "all" && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 cursor-pointer hover:bg-pink-50 border-pink-300 text-pink-700"
                    onClick={() => setRoleFilter("all")}
                  >
                    Role: {roleFilter} <XCircle className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 cursor-pointer hover:bg-pink-50 border-pink-300 text-pink-700"
                    onClick={() => setStatusFilter("all")}
                  >
                    Status: {statusFilter} <XCircle className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 cursor-pointer hover:bg-pink-50 border-pink-300 text-pink-700"
                    onClick={() => setSearchQuery("")}
                  >
                    Search: "{searchQuery}" <XCircle className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-pink-600 hover:text-pink-700">
                Clear All
              </Button>
            </div>
          )}
        </div>
      </PremiumCard>

      {/* Users Table - Modern Design */}
      <PremiumCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
            <p className="text-sm text-gray-500">
              Showing {users.length} of {pagination.total} users
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={10} columns={9} />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm w-10">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(new Set(users.map((u) => u.id)));
                        } else {
                          setSelectedUsers(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">User</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">Role</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">School/Tenant</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">Contact</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">Joined</th>
                  <th className="text-center py-3 px-6 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-6 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">No users found</p>
                          <p className="text-gray-500 text-sm">Try adjusting your filters or add new users</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                          className="text-white"
                        >
                          Add First User
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const typeInfo = userTypeInfo[user.type] || userTypeInfo.student;
                    const UserIcon = typeInfo.icon;
                    const userStatus = getUserStatus(user);
                    const statusBadge = statusBadges[userStatus] || statusBadges.pending;
                    const initials = getAvatarInitials(user.firstName, user.lastName);

                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers);
                              if (e.target.checked) {
                                newSelected.add(user.id);
                              } else {
                                newSelected.delete(user.id);
                              }
                              setSelectedUsers(newSelected);
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  user.type === 'student' ? 'rgb(249 115 22), rgb(194 65 12)' :
                                  user.type === 'teacher' ? 'rgb(59 130 246), rgb(37 99 235)' :
                                  user.type === 'parent' ? 'rgb(107 114 128), rgb(75 85 99)' :
                                  user.type === 'admin' ? 'rgb(236 72 153), rgb(219 39 119)' :
                                  user.type === 'counselor' ? 'rgb(168 85 247), rgb(147 51 234)' :
                                  'rgb(139 92 246), rgb(124 58 237)'
                                } 0%, ${
                                  user.type === 'student' ? 'rgb(194 65 12)' :
                                  user.type === 'teacher' ? 'rgb(37 99 235)' :
                                  user.type === 'parent' ? 'rgb(75 85 99)' :
                                  user.type === 'admin' ? 'rgb(219 39 119)' :
                                  user.type === 'counselor' ? 'rgb(147 51 234)' :
                                  'rgb(124 58 237)'
                                } 100%)`
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500 truncate max-w-[200px]">{user.email || "No email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            variant="outline"
                            className={`${typeInfo.bgColor} ${typeInfo.color} border-0 text-xs font-medium`}
                          >
                            <UserIcon className="w-3 h-3 mr-1" />
                            {user.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {user.school?.name && (
                              <div className="flex items-center gap-1 text-sm text-gray-900">
                                <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{user.school.name}</span>
                              </div>
                            )}
                            {user.tenant?.name && user.tenant.name !== user.school?.name && (
                              <p className="text-xs text-gray-500 truncate">{user.tenant.name}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {user.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[180px]">{user.email}</span>
                              </div>
                            )}
                            {user.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "N/A"}
                            </div>
                            {user.lastLogin && (
                              <p className="text-xs text-gray-500">
                                Last: {new Date(user.lastLogin).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge className={`${statusBadge.color} text-xs font-medium border`}>
                            {statusBadge.icon && <statusBadge.icon className="w-3 h-3 mr-1" />}
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                              title="View details"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit user"
                              onClick={() => {
                                setEditingUser(user);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${user.isActive ? 'hover:bg-yellow-50 hover:text-yellow-600' : 'hover:bg-green-50 hover:text-green-600'}`}
                              title={user.isActive ? "Deactivate" : "Activate"}
                              onClick={() => toggleUserStatus(user.id, user.isActive)}
                              disabled={isToggling === user.id}
                            >
                              {isToggling === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              title="Delete user"
                              onClick={() => deleteUser(user.id)}
                              disabled={isDeleting === user.id}
                            >
                              {isDeleting === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {users.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1 || isLoading}
              >
                Previous
              </Button>
              <div className="flex items-center">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                      disabled={isLoading}
                      className={pagination.page === pageNum ? "" : ""}
                      style={
                        pagination.page === pageNum
                          ? { background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)", color: "white", border: "none" }
                          : {}
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </PremiumCard>

      {/* Bulk Actions - Modern Design */}
      <PremiumCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bulk Actions</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedUsers.size > 0
                ? `${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''} selected`
                : 'Select users to perform bulk actions'}
            </p>
          </div>
          {selectedUsers.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
            >
              Clear Selection
            </Button>
          )}
        </div>
        {selectedUsers.size > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm(`Activate ${selectedUsers.size} selected users?`)) return;
                setBulkLoading("bulk");
                try {
                  await Promise.all(
                    Array.from(selectedUsers).map((id) =>
                      fetch(`/api/admin/users/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isActive: true }),
                      })
                    )
                  );
                  setSelectedUsers(new Set());
                  fetchUsers();
                } catch (error) {
                  alert('Failed to activate users');
                } finally {
                  setBulkLoading(null);
                }
              }}
              disabled={!!bulkLoading}
              className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Activate {selectedUsers.size > 0 && `(${selectedUsers.size})`}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm(`Deactivate ${selectedUsers.size} selected users?`)) return;
                setBulkLoading("bulk");
                try {
                  await Promise.all(
                    Array.from(selectedUsers).map((id) =>
                      fetch(`/api/admin/users/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isActive: false }),
                      })
                    )
                  );
                  setSelectedUsers(new Set());
                  fetchUsers();
                } catch (error) {
                  alert('Failed to deactivate users');
                } finally {
                  setBulkLoading(null);
                }
              }}
              disabled={!!bulkLoading}
              className="hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300"
            >
              <UserX className="w-4 h-4 mr-2" />
              Deactivate {selectedUsers.size > 0 && `(${selectedUsers.size})`}
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:border-red-300"
              onClick={async () => {
                if (!confirm(`Permanently delete ${selectedUsers.size} selected users? This action CANNOT be undone.`)) return;
                setBulkLoading("bulk");
                try {
                  await Promise.all(
                    Array.from(selectedUsers).map((id) =>
                      fetch(`/api/admin/users/${id}?hard=true`, {
                        method: 'DELETE',
                      })
                    )
                  );
                  setSelectedUsers(new Set());
                  fetchUsers();
                } catch (error) {
                  alert('Failed to delete users');
                } finally {
                  setBulkLoading(null);
                }
              }}
              disabled={!!bulkLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedUsers.size > 0 && `(${selectedUsers.size})`}
            </Button>
          </div>
        )}
      </PremiumCard>

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
