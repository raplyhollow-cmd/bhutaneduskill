"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - USERS MANAGEMENT
 *
 * User management page for platform administrators.
 * View and manage all users across all schools.
 */


import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddUserModal } from "@/components/admin/add-user-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Key,
  Shield,
  GraduationCap,
  Briefcase,
  UserCircle,
  Mail,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

// User type icons and colors
const userTypeInfo = {
  student: { icon: GraduationCap, color: "text-orange-600", bgColor: "bg-orange-100" },
  teacher: { icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-100" },
  parent: { icon: UserCircle, color: "text-gray-600", bgColor: "bg-gray-100" },
  admin: { icon: Shield, color: "text-pink-600", bgColor: "bg-pink-100" },
  counselor: { icon: UserCheck, color: "text-purple-600", bgColor: "bg-purple-100" },
  school_admin: { icon: Shield, color: "text-violet-600", bgColor: "bg-violet-100" },
};

// Status badges
const statusBadges = {
  active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  inactive: { label: "Inactive", color: "bg-gray-50 text-gray-700 border-gray-200", icon: XCircle },
  pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
};

interface User {
  id: string;
  clerkUserId: string;
  type: string;
  role: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolId?: string | null;
  tenantId?: string | null;
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
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      logger.error("Failed to fetch users:", err);
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
      logger.error("Failed to toggle user status:", err);
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
        throw new Error("Failed to delete user");
      }

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      logger.error("Failed to delete user:", err);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">View and manage all users across the platform</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
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
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{isLoading ? "-" : stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">All user types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{isLoading ? "-" : stats.students}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? ((stats.students / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{isLoading ? "-" : stats.teachers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? ((stats.teachers / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Parents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{isLoading ? "-" : stats.parents}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? ((stats.parents / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">{isLoading ? "-" : stats.admins}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? ((stats.admins / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Counselors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{isLoading ? "-" : stats.counselors}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? ((stats.counselors / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="parent">Parents</option>
                <option value="admin">Admins</option>
                <option value="counselor">Counselors</option>
                <option value="school_admin">School Admins</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Apply Filters Button */}
            <Button
              onClick={applyFilters}
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display */}
      {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {roleFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
              onClick={() => setRoleFilter("all")}
            >
              Role: {roleFilter} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
              onClick={() => setStatusFilter("all")}
            >
              Status: {statusFilter} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {searchQuery && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
              onClick={() => setSearchQuery("")}
            >
              Search: "{searchQuery}" <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-2">
            Clear All
          </Button>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Showing {users.length} of {pagination.total} users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="ml-3 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School/Tenant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Joined</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">No users found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const typeInfo = userTypeInfo[user.type as keyof typeof userTypeInfo] || userTypeInfo.student;
                      const UserIcon = typeInfo.icon;
                      const userStatus = getUserStatus(user);
                      const statusBadge = statusBadges[userStatus as keyof typeof statusBadges] || statusBadges.pending;

                      return (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${typeInfo.bgColor}`}
                                style={{ color: typeInfo.color.replace("text-", "") }}
                              >
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{user.email || "No email"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={`${typeInfo.bgColor} ${typeInfo.color} border-0 text-xs`}
                            >
                              <UserIcon className="w-3 h-3 mr-1" />
                              {user.type}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {user.school?.name && (
                                <div className="flex items-center gap-1 text-sm text-gray-900">
                                  <Building2 className="w-3 h-3 text-gray-400" />
                                  {user.school.name}
                                </div>
                              )}
                              {user.tenant?.name && user.tenant.name !== user.school?.name && (
                                <p className="text-xs text-gray-500">{user.tenant.name}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {user.email && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {user.email}
                                </div>
                              )}
                              {user.phone && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {user.createdAt
                                  ? new Date(user.createdAt).toLocaleDateString()
                                  : "N/A"}
                              </div>
                              {user.lastLogin && (
                                <p className="text-xs text-gray-500">
                                  Last login: {new Date(user.lastLogin).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className={statusBadge.color + " text-xs"}>
                              {statusBadge.icon && <statusBadge.icon className="w-3 h-3 mr-1" />}
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
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
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="Edit user"
                                onClick={() => router.push(`/admin/users/${user.id}?action=edit`)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
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
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>Perform actions on multiple users at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Send Email to Selected
            </Button>
            <Button variant="outline">
              <UserCheck className="w-4 h-4 mr-2" />
              Activate Selected
            </Button>
            <Button variant="outline">
              <UserX className="w-4 h-4 mr-2" />
              Deactivate Selected
            </Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <AddUserModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
