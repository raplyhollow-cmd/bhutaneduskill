/**
 * PLATFORM ADMIN - USERS MANAGEMENT
 *
 * User management page for platform administrators.
 * View and manage all users across all schools.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  X,
  XCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { db } from "@/lib/db";
import { users, schools, tenants } from "@/lib/db/schema";
import { desc, eq, sql, like, or, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// User type icons and colors
const userTypeInfo = {
  student: { icon: GraduationCap, color: "text-orange-600", bgColor: "bg-orange-100" },
  teacher: { icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-100" },
  parent: { icon: UserCircle, color: "text-gray-600", bgColor: "bg-gray-100" },
  admin: { icon: Shield, color: "text-pink-600", bgColor: "bg-pink-100" },
  counselor: { icon: UserCheck, color: "text-purple-600", bgColor: "bg-purple-100" },
};

// Status badges
const statusBadges = {
  active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  inactive: { label: "Inactive", color: "bg-gray-50 text-gray-700 border-gray-200", icon: XCircle },
  pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
};

async function getUserStats() {
  const [studentCount, teacherCount, parentCount, adminCount, counselorCount] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.type, "student")),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.type, "teacher")),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.type, "parent")),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.type, "admin")),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.type, "counselor")),
    ]);

  return {
    students: Number(studentCount[0]?.count) || 0,
    teachers: Number(teacherCount[0]?.count) || 0,
    parents: Number(parentCount[0]?.count) || 0,
    admins: Number(adminCount[0]?.count) || 0,
    counselors: Number(counselorCount[0]?.count) || 0,
    total:
      (Number(studentCount[0]?.count) || 0) +
      (Number(teacherCount[0]?.count) || 0) +
      (Number(parentCount[0]?.count) || 0) +
      (Number(adminCount[0]?.count) || 0) +
      (Number(counselorCount[0]?.count) || 0),
  };
}

async function getAllUsers(limit = 50, offset = 0) {
  return await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      type: users.type,
      schoolId: users.schoolId,
      tenantId: users.tenantId,
      clerkUserId: users.clerkUserId,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      schoolName: schools.name,
      schoolCode: schools.code,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; school?: string; status?: string; search?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get filter values
  const roleFilter = searchParams.role || "all";
  const statusFilter = searchParams.status || "all";
  const searchQuery = searchParams.search || "";

  // Get user stats
  const stats = await getUserStats();

  // Get users with potential filters
  let allUsers = await getAllUsers(100);

  // Apply client-side filtering for search (in production, this would be server-side)
  if (searchQuery) {
    allUsers = allUsers.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (roleFilter !== "all") {
    allUsers = allUsers.filter((user) => user.type === roleFilter);
  }

  // Status filtering based on emailVerified and lastLogin
  if (statusFilter === "active") {
    allUsers = allUsers.filter((user) => user.emailVerified);
  } else if (statusFilter === "pending") {
    allUsers = allUsers.filter((user) => !user.emailVerified);
  } else if (statusFilter === "inactive") {
    allUsers = allUsers.filter((user) => !user.lastLoginAt && user.emailVerified);
  }

  // Get unique schools for filter dropdown
  const uniqueSchools = Array.from(
    new Map(allUsers.filter((u) => u.schoolName).map((u) => [u.schoolId, u])).values()
  );

  // Get unique tenants for filter dropdown
  const uniqueTenants = Array.from(
    new Map(allUsers.filter((u) => u.tenantName).map((u) => [u.tenantId, u])).values()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">View and manage all users across the platform</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <Shield className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

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
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
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
            <div className="text-3xl font-bold text-orange-600">{stats.students}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.students / stats.total) * 100).toFixed(1)}% of total
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
            <div className="text-3xl font-bold text-blue-600">{stats.teachers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.teachers / stats.total) * 100).toFixed(1)}% of total
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
            <div className="text-3xl font-bold text-gray-600">{stats.parents}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.parents / stats.total) * 100).toFixed(1)}% of total
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
            <div className="text-3xl font-bold text-pink-600">{stats.admins}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.admins / stats.total) * 100).toFixed(1)}% of total
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
            <div className="text-3xl font-bold text-purple-600">{stats.counselors}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.counselors / stats.total) * 100).toFixed(1)}% of total
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
                name="search"
                placeholder="Search by name, email..."
                defaultValue={searchQuery}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                name="role"
                defaultValue={roleFilter}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="parent">Parents</option>
                <option value="admin">Admins</option>
                <option value="counselor">Counselors</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                name="status"
                defaultValue={statusFilter}
                className="appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Apply Filter Button */}
            <Button
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
              className="px-3 py-1"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Role: {roleFilter}
              <button className="ml-2 hover:text-pink-800">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Status: {statusFilter}
              <button className="ml-2 hover:text-pink-800">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {searchQuery && (
            <Badge
              variant="outline"
              className="px-3 py-1"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Search: "{searchQuery}"
              <button className="ml-2 hover:text-pink-800">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="text-gray-500">
            Clear all filters
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
                Showing {allUsers.length} of {stats.total} users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Sort
              </Button>
              <Button variant="outline" size="sm">
                Download CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                {allUsers.length === 0 ? (
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
                  allUsers.map((user) => {
                    const typeInfo = userTypeInfo[user.type as keyof typeof userTypeInfo];
                    const UserIcon = typeInfo?.icon || UserCircle;
                    const isVerified = user.emailVerified;
                    const hasLoggedIn = user.lastLoginAt;

                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${typeInfo?.bgColor}`}
                              style={{ color: typeInfo?.color.replace("text-", "") }}
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
                            className={`${typeInfo?.bgColor} ${typeInfo?.color} border-0 text-xs`}
                          >
                            <UserIcon className="w-3 h-3 mr-1" />
                            {user.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            {user.schoolName && (
                              <div className="flex items-center gap-1 text-sm text-gray-900">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                {user.schoolName}
                              </div>
                            )}
                            {user.tenantName && user.tenantName !== user.schoolName && (
                              <p className="text-xs text-gray-500">{user.tenantName}</p>
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
                            {hasLoggedIn && (
                              <p className="text-xs text-gray-500">
                                Last login: {new Date(user.lastLoginAt!).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {!isVerified ? (
                            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          ) : hasLoggedIn ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              title="Reset password"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600"
                              title={isVerified ? "Deactivate" : "Activate"}
                            >
                              {isVerified ? (
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
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Pagination */}
          {allUsers.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing 1-{allUsers.length} of {stats.total} users
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                    color: "white",
                    border: "none",
                  }}
                >
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
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
    </div>
  );
}
