"use client";

/**
 * PLATFORM ADMIN - USERS MANAGEMENT
 *
 * Using GoogleDataTable for consistent grid experience:
 * - Inline editable fields
 * - Role selector dropdown
 * - Status toggle
 * - Quick action menu
 * - Bulk actions
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddUserModal } from "@/components/admin/add-user-modal";
import { EditUserModal } from "@/components/admin/edit-user-modal";
import { RoleSelector } from "@/components/admin/role-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleDataTable, GoogleColumn, GoogleAction } from "@/components/admin/google-data-table";
import {
  Users,
  Search,
  Plus,
  Sparkles,
  X,
  Trash2,
  Building2,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Key,
  GraduationCap,
  Briefcase,
  UserCircle,
  Shield,
  CheckCircle,
  Ban,
  Clock,
  Loader2 as Spinner,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// User type icons and colors (modern palette)
const userTypeInfo: Record<string, { icon: any; color: string; bgColor: string; gradient: string }> = {
  student: {
    icon: GraduationCap,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
  },
  teacher: {
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
  },
  parent: {
    icon: UserCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    gradient: "linear-gradient(135deg, #6b7280, #4b5563)",
  },
  admin: {
    icon: Shield,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    gradient: "linear-gradient(135deg, #ec4899, #db2777)",
  },
  counselor: {
    icon: UserCheck,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    gradient: "linear-gradient(135deg, #a855f7, #9333ea)",
  },
  "school-admin": {
    icon: Shield,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  },
};

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

  // Update field with inline edit
  const handleUpdate = async (id: string, field: string, value: string): Promise<void> => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    const oldValue = user[field as keyof User];

    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (err) {
      // Rollback
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: oldValue } : u)));
      logger.error(err, { action: "update", field, id });
      throw err;
    }
  };

  // Update user role
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

  // Toggle user status
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
      setError("Failed to update status. Please try again.");
    }
  };

  // Delete user
  const deleteUser = async (user: User) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await fetchUsers();
    } catch (err) {
      logger.error(err, { action: "deleteUser", user });
      setError("Failed to delete user. Please try again.");
    }
  };

  // Get avatar initials
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

  // Define columns for GoogleDataTable
  const columns: GoogleColumn<User>[] = [
    {
      id: "name",
      label: "User",
      width: "200px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
            style={{ background: userTypeInfo[row.type]?.gradient || "#6b7280" }}
          >
            {getInitials(row.firstName, row.lastName)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm">{row.name}</p>
            <p className="text-xs text-gray-400 truncate">{row.clerkUserId?.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      label: "Email",
      width: "200px",
      sortable: true,
      filterable: true,
      editable: true,
    },
    {
      id: "type",
      label: "Role",
      width: "140px",
      sortable: true,
      filterable: true,
      render: (row) => {
        const Icon = userTypeInfo[row.type]?.icon || UserCircle;
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{row.type}</span>
          </div>
        );
      },
    },
    {
      id: "school",
      label: "School",
      width: "150px",
      sortable: false,
      render: (row) => (
        <span className="text-xs text-gray-500 truncate">
          {row.school?.name || row.tenant?.name || "-"}
        </span>
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
  const actions: GoogleAction<User>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => setEditingUser(row),
    },
    {
      label: "Edit User",
      icon: <Edit className="w-4 h-4" />,
      onClick: (row) => {
        setEditingUser(row);
        setIsEditModalOpen(true);
      },
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<User>,
    {
      label: "Delete User",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => deleteUser(row),
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
          filteredUsers.forEach(async (user) => {
            if (!user.isActive) {
              await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: true }),
              });
            }
          });
          fetchUsers();
        }}
      >
        <UserCheck className="w-3.5 h-3.5 mr-1" />
        Enable
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-pink-700 hover:bg-pink-100"
        onClick={() => {
          filteredUsers.forEach(async (user) => {
            if (user.isActive) {
              await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: false }),
              });
            }
          });
          fetchUsers();
        }}
      >
        <UserX className="w-3.5 h-3.5 mr-1" />
        Disable
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-red-600 hover:bg-red-50"
        onClick={() => {
          if (!confirm(`Delete ${filteredUsers.length} selected users? This cannot be undone.`)) return;
          filteredUsers.forEach(async (user) => {
            await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
          });
          fetchUsers();
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
            <Plus className="w-3.5 h-3.5 mr-1" /> Add User
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

      {/* Stats Overview - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
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

      {/* GoogleDataTable */}
      <div className="flex-1 min-h-0">
        <GoogleDataTable<User>
          data={filteredUsers}
          columns={columns}
          keyField="id"
          isLoading={isLoading}
          title="Users"
          subtitle={`${pagination.total.toLocaleString()} total users`}
          actions={actions}
          bulkActions={bulkActionsBar}
          onUpdate={handleUpdate}
          rowActions={true}
          toolbar={
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
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
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive" | "pending")}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          emptyState={
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all" ? "No results found" : "No users yet"}
              </p>
            </div>
          }
        />
      </div>

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
            <span className="text-sm px-2">Page {pagination.page} of {pagination.totalPages}</span>
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