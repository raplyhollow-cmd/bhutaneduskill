/**
 * PLATFORM ADMIN - TEACHERS MANAGEMENT
 *
 * Multi-tenant teacher management page for platform administrators.
 * View, verify, and manage all teachers across all schools.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
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
  MapPin,
  GraduationCap,
  Award,
  Building2,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, schools, tenants, subjects, classes } from "@/lib/db/schema";
import { desc, eq, sql, and, count, like, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// Helper function to get teacher stats
async function getTeacherStats(teacherId: string) {
  const [classCount, studentCount] = await Promise.all([
    db.select({ count: count() }).from(classes).where(eq(classes.teacherId, teacherId)),
    db
      .select({ count: count() })
      .from(classes)
      .where(eq(classes.teacherId, teacherId))
      .then((results) => {
        // Each class has a students array with student IDs
        const totalStudents = results.reduce((sum, r) => {
          // The students field is a JSON array in the classes table
          const studentCount = (r as any).students?.length || 0;
          return sum + studentCount;
        }, 0);
        return [{ count: totalStudents }];
      }),
  ]);

  return {
    classes: classCount[0]?.count || 0,
    students: studentCount[0]?.count || 0,
  };
}

async function getAllTeachers(limit = 100) {
  return await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      employeeId: users.employeeId,
      subjects: users.subjects,
      schoolId: users.schoolId,
      tenantId: users.tenantId,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      schoolName: schools.name,
      schoolCode: schools.code,
      schoolType: schools.schoolType,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.type, "teacher"))
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

// Get all subjects for filtering
async function getAllSubjects() {
  const allSubjects = await db.selectDistinct({
    name: subjects.name,
  }).from(subjects).limit(50);
  return allSubjects.map(s => s.name);
}

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: { school?: string; subject?: string; status?: string; search?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get filter values
  const schoolFilter = searchParams.school || "all";
  const subjectFilter = searchParams.subject || "all";
  const statusFilter = searchParams.status || "all";
  const searchQuery = searchParams.search || "";

  // Get all teachers
  let allTeachers = await getAllTeachers(200);

  // Apply filters
  if (searchQuery) {
    allTeachers = allTeachers.filter(
      (teacher) =>
        teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (schoolFilter !== "all") {
    allTeachers = allTeachers.filter((teacher) => teacher.schoolId === schoolFilter);
  }

  if (subjectFilter !== "all" && subjectFilter) {
    allTeachers = allTeachers.filter((teacher) =>
      teacher.subjects?.includes(subjectFilter)
    );
  }

  if (statusFilter === "verified") {
    allTeachers = allTeachers.filter((teacher) => teacher.emailVerified);
  } else if (statusFilter === "pending") {
    allTeachers = allTeachers.filter((teacher) => !teacher.emailVerified);
  }

  // Get stats for each teacher
  const teachersWithStats = await Promise.all(
    allTeachers.map(async (teacher) => ({
      ...teacher,
      stats: await getTeacherStats(teacher.id),
    }))
  );

  // Get unique schools for filter
  const uniqueSchools = Array.from(
    new Map(allTeachers.filter((t: any) => t.schoolName).map((t: any) => [t.schoolId, t])).values()
  );

  // Get all subjects
  const allSubjects = await getAllSubjects();

  // Calculate platform-wide stats
  const totalTeachers = teachersWithStats.length;
  const verifiedTeachers = teachersWithStats.filter((t) => t.emailVerified).length;
  const pendingTeachers = teachersWithStats.filter((t) => !t.emailVerified).length;
  const totalStudents = teachersWithStats.reduce((sum, t) => sum + t.stats.students, 0);
  const totalClasses = teachersWithStats.reduce((sum, t) => sum + t.stats.classes, 0);

  // Subject distribution
  const subjectCounts = teachersWithStats.reduce((acc: Record<string, number>, teacher) => {
    teacher.subjects?.forEach((subject: string) => {
      acc[subject] = (acc[subject] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teachers Management</h1>
          <p className="text-gray-600">
            View and manage all teachers across all schools
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
            <Briefcase className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalTeachers}</div>
            <p className="text-xs text-gray-500 mt-1">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{verifiedTeachers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((verifiedTeachers / totalTeachers) * 100).toFixed(1)}% verified
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
            <div className="text-3xl font-bold text-yellow-600">{pendingTeachers}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students Taught
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Total enrollment</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Expertise Distribution</CardTitle>
          <CardDescription>Teachers by subject specialization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(subjectCounts)
              .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
              .slice(0, 10)
              .map(([subject, count]: [string, number]) => (
                <Badge
                  key={subject}
                  variant="outline"
                  className="px-4 py-2 text-sm min-h-[44px] flex items-center"
                  style={{
                    borderColor: "rgb(236 72 153)",
                    color: "rgb(219 39 119)",
                  }}
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  {subject}: {count}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search teachers by name, email, or employee ID..."
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
              name="subject"
              defaultValue={subjectFilter}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
            >
              <option value="all">All Subjects</option>
              {allSubjects.map((subject: string) => (
                <option key={subject} value={subject}>
                  {subject}
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
      {(schoolFilter !== "all" || subjectFilter !== "all" || statusFilter !== "all" || searchQuery) && (
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
          {subjectFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1"
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Subject: {subjectFilter}
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

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Teachers</CardTitle>
              <CardDescription>
                {teachersWithStats.length} teachers across {uniqueSchools.length} schools
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="min-h-[36px]">
                <TrendingUp className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" className="min-h-[36px]">
                Bulk Verify
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Teacher</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">School</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Subjects</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Classes</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Students</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachersWithStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Briefcase className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">No teachers found</p>
                          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teachersWithStats.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                          >
                            {teacher.firstName?.[0]}
                            {teacher.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{teacher.email || "No email"}</p>
                            {teacher.employeeId && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                ID: {teacher.employeeId}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {teacher.schoolName || "Unassigned"}
                        </div>
                        {teacher.schoolType && (
                          <p className="text-xs text-gray-500">{teacher.schoolType}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects && teacher.subjects.length > 0 ? (
                            teacher.subjects.slice(0, 2).map((subject: string) => (
                              <Badge
                                key={subject}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: "rgb(59 130 246)",
                                  color: "rgb(37 99 235)",
                                }}
                              >
                                {subject}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">No subjects</span>
                          )}
                          {teacher.subjects && teacher.subjects.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{teacher.subjects.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          {teacher.stats.classes}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          {teacher.stats.students}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {!teacher.emailVerified ? (
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : teacher.lastLoginAt ? (
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
                            title="Edit teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!teacher.emailVerified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              title="Verify teacher"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            title="Delete teacher"
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
          {teachersWithStats.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing 1-{teachersWithStats.length} of {totalTeachers} teachers
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
      {pendingTeachers > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pending Verifications
            </CardTitle>
            <CardDescription>
              {pendingTeachers} teacher(s) awaiting verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teachersWithStats
                .filter((t) => !t.emailVerified)
                .slice(0, 5)
                .map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                      >
                        {teacher.firstName?.[0]}
                        {teacher.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
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

      {/* Performance Metrics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Teachers by Class Count</CardTitle>
            <CardDescription>Teachers managing the most classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teachersWithStats
                .sort((a, b) => b.stats.classes - a.stats.classes)
                .slice(0, 5)
                .map((teacher, index) => (
                  <div key={teacher.id} className="flex items-center gap-4">
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
                          {teacher.firstName} {teacher.lastName}
                        </span>
                        <span className="text-sm text-gray-500">{teacher.stats.classes} classes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(teacher.stats.classes / (teachersWithStats[0]?.stats.classes || 1)) * 100}%`,
                            background: "linear-gradient(90deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
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
            <CardTitle>Recently Added Teachers</CardTitle>
            <CardDescription>Latest teachers to join the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teachersWithStats
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                    >
                      {teacher.firstName?.[0]}
                      {teacher.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {teacher.schoolName} • {teacher.subjects?.join(", ") || "No subjects"}
                      </p>
                    </div>
                    {!teacher.emailVerified ? (
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
    </div>
  );
}
