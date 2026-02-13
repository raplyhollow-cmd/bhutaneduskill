/**
 * PLATFORM ADMIN - COUNSELORS MANAGEMENT
 *
 * Multi-tenant counselor management page for platform administrators.
 * View, verify, and manage all counselors across all schools.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  FileText,
  MessageSquare,
  Award,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, schools, tenants, counselorAssignments, counselorNotes, careerPlans } from "@/lib/db/schema";
import { desc, eq, sql, and, count, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// Helper function to get counselor stats
async function getCounselorStats(counselorId: string) {
  const [assignedSchools, totalNotes] = await Promise.all([
    db
      .select({ count: count() })
      .from(counselorAssignments)
      .where(eq(counselorAssignments.counselorId, counselorId)),
    db.select({ count: count() }).from(counselorNotes).where(eq(counselorNotes.counselorId, counselorId)),
    // TODO: activePlans query needs careerPlans.counselorId field which doesn't exist
    // db.select({ count: count() }).from(careerPlans).where(and(eq(careerPlans.counselorId, counselorId), eq(careerPlans.status, "active"))),
  ]);

  return {
    assignedSchools: assignedSchools[0]?.count || 0,
    totalNotes: totalNotes[0]?.count || 0,
    activePlans: 0, // TODO: fix when careerPlans schema is updated
  };
}

async function getAllCounselors(limit = 100) {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      schoolId: users.schoolId,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin,
      schoolName: schools.name,
      schoolCode: schools.code,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .leftJoin(tenants, eq(users.schoolId, tenants.id)) // Using schoolId to join tenants
    .where(eq(users.type, "counselor"))
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

async function getCounselorSchoolAssignments(counselorId: string) {
  const assignments = await db
    .select({
      schoolId: counselorAssignments.schoolId,
      academicYear: counselorAssignments.academicYear,
      schoolName: schools.name,
      schoolCode: schools.code,
    })
    .from(counselorAssignments)
    .leftJoin(schools, eq(counselorAssignments.schoolId, schools.id))
    .where(eq(counselorAssignments.counselorId, counselorId));

  return assignments;
}

export default async function AdminCounselorsPage({
  searchParams,
}: {
  searchParams: { school?: string; status?: string; search?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get filter values
  const schoolFilter = searchParams.school || "all";
  const statusFilter = searchParams.status || "all";
  const searchQuery = searchParams.search || "";

  // Get all counselors
  let allCounselors = await getAllCounselors(200);

  // Apply filters
  if (searchQuery) {
    allCounselors = allCounselors.filter(
      (counselor) =>
        counselor.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        counselor.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        counselor.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (schoolFilter !== "all") {
    allCounselors = allCounselors.filter((counselor) => counselor.schoolId === schoolFilter);
  }

  if (statusFilter === "verified") {
    allCounselors = allCounselors.filter((counselor) => counselor.emailVerified);
  } else if (statusFilter === "pending") {
    allCounselors = allCounselors.filter((counselor) => !counselor.emailVerified);
  }

  // Get stats and assignments for each counselor
  const counselorsWithData = await Promise.all(
    allCounselors.map(async (counselor) => ({
      ...counselor,
      stats: await getCounselorStats(counselor.id),
      assignments: await getCounselorSchoolAssignments(counselor.id),
    }))
  );

  // Get unique schools for filter
  const uniqueSchools = Array.from(
    new Map(allCounselors.filter((c: any) => c.schoolName).map((c: any) => [c.schoolId, c])).values()
  );

  // Calculate platform-wide stats
  const totalCounselors = counselorsWithData.length;
  const verifiedCounselors = counselorsWithData.filter((c) => c.emailVerified).length;
  const pendingCounselors = counselorsWithData.filter((c) => !c.emailVerified).length;
  const totalActivePlans = counselorsWithData.reduce((sum, c) => sum + c.stats.activePlans, 0);
  const totalNotes = counselorsWithData.reduce((sum, c) => sum + c.stats.totalNotes, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Counselors Management</h1>
          <p className="text-gray-600">
            View and manage all counselors across the platform
          </p>
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
            <UserCheck className="w-4 h-4 mr-2" />
            Add Counselor
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Total Counselors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalCounselors}</div>
            <p className="text-xs text-gray-500 mt-1">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{verifiedCounselors}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((verifiedCounselors / totalCounselors) * 100).toFixed(1)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCounselors}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalActivePlans}</div>
            <p className="text-xs text-gray-500 mt-1">Career plans active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Total Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalNotes}</div>
            <p className="text-xs text-gray-500 mt-1">Counselor notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search counselors by name or email..."
                defaultValue={searchQuery}
                className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select
              name="school"
              defaultValue={schoolFilter}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
            >
              <option value="all">All Schools</option>
              {uniqueSchools.map((school: any) => (
                <option key={school.schoolId} value={school.schoolId}>
                  {school.schoolName}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Verification</option>
            </select>
            <Button
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white min-h-[44px]"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display */}
      {(schoolFilter !== "all" || statusFilter !== "all" || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {schoolFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              School: {(uniqueSchools as any[]).find((s: any) => s.schoolId === schoolFilter)?.schoolName}
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Status: {statusFilter}
            </Badge>
          )}
          {searchQuery && (
            <Badge
              variant="outline"
              className="px-3 py-1"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Search: "{searchQuery}"
            </Badge>
          )}
        </div>
      )}

      {/* Counselors Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Counselors</CardTitle>
              <CardDescription>
                {counselorsWithData.length} counselors across {uniqueSchools.length} schools
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="min-h-[36px]">
                <TrendingUp className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" className="min-h-[36px]">
                Bulk Assign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Counselor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School Assignments</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Active Plans</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Total Notes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Last Login</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {counselorsWithData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCheck className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">No counselors found</p>
                          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  counselorsWithData.map((counselor) => (
                    <tr key={counselor.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
                          >
                            {counselor.firstName?.[0]}
                            {counselor.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {counselor.firstName} {counselor.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{counselor.email || "No email"}</p>
                            {counselor.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Phone className="w-3 h-3" />
                                {counselor.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          {counselor.assignments.length > 0 ? (
                            counselor.assignments.map((assignment) => (
                              <div key={assignment.schoolId} className="flex items-center gap-2">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700">{assignment.schoolName}</span>
                                {assignment.isPrimary && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">No assignments</span>
                          )}
                          {counselor.stats.assignedSchools > counselor.assignments.length && (
                            <p className="text-xs text-gray-500">
                              +{counselor.stats.assignedSchools - counselor.assignments.length} more
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <FileText className="w-4 h-4 text-purple-400" />
                          {counselor.stats.activePlans}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          {counselor.stats.totalNotes}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {counselor.lastLoginAt ? (
                          <div className="text-sm text-gray-600">
                            {new Date(counselor.lastLoginAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {!counselor.emailVerified ? (
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : counselor.lastLoginAt ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
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
                            title="Edit counselor"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                            title="Manage assignments"
                          >
                            <Building2 className="w-4 h-4" />
                          </Button>
                          {!counselor.emailVerified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              title="Verify counselor"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            title="Delete counselor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {counselorsWithData.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing 1-{counselorsWithData.length} of {totalCounselors} counselors
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled className="min-h-[36px]">
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[36px]"
                  style={{
                    background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                    color: "white",
                    border: "none",
                  }}
                >
                  1
                </Button>
                <Button variant="outline" size="sm" className="min-h-[36px]">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Verifications */}
      {pendingCounselors > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pending Verifications
            </CardTitle>
            <CardDescription>
              {pendingCounselors} counselor(s) awaiting verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {counselorsWithData
                .filter((c) => !c.emailVerified)
                .slice(0, 5)
                .map((counselor) => (
                  <div
                    key={counselor.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
                      >
                        {counselor.firstName?.[0]}
                        {counselor.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {counselor.firstName} {counselor.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{counselor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="min-h-[36px]">
                        Review
                      </Button>
                      <Button
                        size="sm"
                        className="min-h-[36px]"
                        style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Assignments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            School Assignments Overview
          </CardTitle>
          <CardDescription>Counselor distribution across schools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueSchools.slice(0, 6).map((school: any) => {
              const schoolCounselors = counselorsWithData.filter((c) =>
                c.assignments.some((a) => a.schoolId === school.schoolId)
              );
              return (
                <div key={school.schoolId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{school.schoolName}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: "rgb(236 72 153)",
                        color: "rgb(219 39 119)",
                      }}
                    >
                      {schoolCounselors.length} counselor(s)
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {schoolCounselors.map((counselor) => (
                      <Badge key={counselor.id} variant="outline" className="text-xs bg-purple-50">
                        {counselor.firstName} {counselor.lastName?.[0]}.
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Counselors by Active Plans</CardTitle>
            <CardDescription>Counselors managing the most career plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {counselorsWithData
                .sort((a, b) => b.stats.activePlans - a.stats.activePlans)
                .filter((c) => c.stats.activePlans > 0)
                .slice(0, 5)
                .map((counselor, index) => (
                  <div key={counselor.id} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {counselor.firstName} {counselor.lastName}
                        </span>
                        <span className="text-sm text-gray-500">{counselor.stats.activePlans} plans</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(counselor.stats.activePlans / (counselorsWithData[0]?.stats.activePlans || 1)) * 100}%`,
                            background: "linear-gradient(90deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Added Counselors</CardTitle>
            <CardDescription>Latest counselors to join the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {counselorsWithData
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((counselor) => (
                  <div key={counselor.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)" }}
                    >
                      {counselor.firstName?.[0]}
                      {counselor.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {counselor.firstName} {counselor.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {counselor.schoolName} • {counselor.stats.assignedSchools} school(s)
                      </p>
                    </div>
                    {!counselor.emailVerified ? (
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>Perform actions on multiple counselors at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="min-h-[44px]">
              <Mail className="w-4 h-4 mr-2" />
              Send Email to Selected
            </Button>
            <Button variant="outline" className="min-h-[44px]">
              <Building2 className="w-4 h-4 mr-2" />
              Assign to Schools
            </Button>
            <Button variant="outline" className="min-h-[44px]">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verify Selected
            </Button>
            <Button variant="outline" className="min-h-[44px] text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Selected
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
