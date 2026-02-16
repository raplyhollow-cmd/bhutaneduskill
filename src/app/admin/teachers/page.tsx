/**
 * PLATFORM ADMIN - TEACHERS MANAGEMENT
 *
 * Multi-tenant teacher management page for platform administrators.
 * View, verify, and manage all teachers across all schools.
 */

"use client";

import { useEffect, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  Building2,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  Mail,
  Phone,
  IdCard,
  Calendar,
} from "lucide-react";
import { AddUserModal } from "@/components/admin/add-user-modal";

// Helper function to parse subjects field (stored as JSON string in DB)
function parseSubjects(subjects: string | null | undefined): string[] {
  if (!subjects) return [];
  try {
    return typeof subjects === "string" ? JSON.parse(subjects) : subjects;
  } catch {
    return [];
  }
}

export default function AdminTeachersPage() {
  const searchParams = useSearchParams();

  // State for data
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states - initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [schoolFilter, setSchoolFilter] = useState(searchParams.get("school") || "all");
  const [subjectFilter, setSubjectFilter] = useState(searchParams.get("subject") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  // Fetch teachers from API
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users?role=teacher&limit=100");
      if (!response.ok) throw new Error("Failed to fetch teachers");

      const data = await response.json();
      const teachersData = data.data || [];

      // Transform data to match expected format
      const transformedData = teachersData.map((teacher: any) => ({
        ...teacher,
        schoolName: teacher.school?.name || null,
        schoolCode: teacher.school?.code || null,
        schoolType: teacher.school?.type || null,
        stats: {
          classes: 0,
          students: 0,
        },
      }));

      setTeachers(transformedData);
      setFilteredTeachers(transformedData);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setTeachers([]);
      setFilteredTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Handle view teacher
  const handleViewTeacher = (teacher: any) => {
    setViewingTeacher(teacher);
    setIsViewDialogOpen(true);
  };

  // Handle verify teacher
  const handleVerifyTeacher = async (teacher: any) => {
    setIsVerifying(teacher.id);
    try {
      const response = await fetch(`/api/admin/users/${teacher.id}/verify`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh teachers list
        await fetchTeachers();
      } else {
        const error = await response.json();
        console.error('Failed to verify teacher:', error.error);
        alert(error.error || 'Failed to verify teacher');
      }
    } catch (error) {
      console.error('Error verifying teacher:', error);
      alert('Failed to verify teacher');
    } finally {
      setIsVerifying(null);
    }
  };

  // Handle delete teacher
  const handleDeleteTeacher = (teacher: any) => {
    setDeletingTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete teacher
  const confirmDeleteTeacher = async () => {
    if (!deletingTeacher) return;

    try {
      const response = await fetch(`/api/admin/users/${deletingTeacher.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setDeletingTeacher(null);
        // Refresh teachers list
        await fetchTeachers();
      } else {
        const error = await response.json();
        console.error('Failed to delete teacher:', error.error);
        alert(error.error || 'Failed to delete teacher');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Failed to delete teacher');
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...teachers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (teacher) =>
          teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          teacher.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // School filter
    if (schoolFilter !== "all") {
      filtered = filtered.filter((teacher) => teacher.schoolId === schoolFilter);
    }

    // Subject filter
    if (subjectFilter !== "all" && subjectFilter) {
      filtered = filtered.filter((teacher) =>
        parseSubjects(teacher.subjects).includes(subjectFilter)
      );
    }

    // Status filter
    if (statusFilter === "verified") {
      filtered = filtered.filter((teacher) => teacher.emailVerified);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((teacher) => !teacher.emailVerified);
    }

    setFilteredTeachers(filtered);
  }, [teachers, searchQuery, schoolFilter, subjectFilter, statusFilter]);

  // Calculate stats
  const totalTeachers = filteredTeachers.length;
  const verifiedTeachers = filteredTeachers.filter((t) => t.emailVerified).length;
  const pendingTeachers = filteredTeachers.filter((t) => !t.emailVerified).length;
  const totalClasses = filteredTeachers.reduce((sum, t) => sum + (t.stats?.classes || 0), 0);
  const totalStudents = filteredTeachers.reduce((sum, t) => sum + (t.stats?.students || 0), 0);

  // Subject distribution
  const subjectCounts = filteredTeachers.reduce((acc: Record<string, number>, teacher) => {
    const subjectsArray = parseSubjects(teacher.subjects);
    subjectsArray.forEach((subject: string) => {
      acc[subject] = (acc[subject] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Get unique schools for filter
  const uniqueSchools = Array.from(
    new Map(
      filteredTeachers
        .filter((t: any) => t.schoolName)
        .map((t: any) => [t.schoolId, t])
    ).values()
  );

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
            onClick={() => setIsAddModalOpen(true)}
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
              {totalTeachers > 0 ? ((verifiedTeachers / totalTeachers) * 100).toFixed(1) : 0}% verified
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teachers by name, email, or employee ID..."
                className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
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
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
            >
              <option value="all">All Subjects</option>
              {Object.keys(subjectCounts).map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => setSchoolFilter("all")}
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              School: {(uniqueSchools as any[]).find((s: any) => s.schoolId === schoolFilter)?.schoolName} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {subjectFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => setSubjectFilter("all")}
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Subject: {subjectFilter} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => setStatusFilter("all")}
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Status: {statusFilter} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {searchQuery && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => setSearchQuery("")}
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Search: "{searchQuery}" <XCircle className="w-3 h-3 ml-1" />
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
                {filteredTeachers.length} teachers across {uniqueSchools.length} schools
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
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600 mx-auto" />
              <p className="text-gray-500 mt-4">Loading teachers...</p>
            </div>
          ) : (
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
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">No teachers found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or add a new teacher</p>
                          </div>
                          <Button
                            onClick={() => setIsAddModalOpen(true)}
                            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                            className="text-white"
                          >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Add First Teacher
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                            >
                              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
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
                            {(() => {
                              const subjectsList = parseSubjects(teacher.subjects);
                              return subjectsList.length > 0 ? (
                                <>
                                  {subjectsList.slice(0, 2).map((subject: string) => (
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
                                  ))}
                                  {subjectsList.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{subjectsList.length - 2}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-gray-400">No subjects</span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                            {teacher.stats?.classes || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                            <Users className="w-4 h-4 text-gray-400" />
                            {teacher.stats?.students || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {!teacher.emailVerified ? (
                            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          ) : teacher.lastLogin ? (
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
                              onClick={() => handleViewTeacher(teacher)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {/* Edit button - TODO: Implement edit modal */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                              title="Edit teacher"
                              onClick={() => console.log('Edit teacher', teacher)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!teacher.emailVerified && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                title="Verify teacher"
                                onClick={() => handleVerifyTeacher(teacher)}
                                disabled={isVerifying === teacher.id}
                              >
                                <ShieldCheck className={`w-4 h-4 ${isVerifying === teacher.id ? 'animate-spin' : ''}`} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              title="Delete teacher"
                              onClick={() => handleDeleteTeacher(teacher)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      )))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredTeachers.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing 1-{filteredTeachers.length} of {totalTeachers} teachers
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
              {filteredTeachers
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[36px]"
                        onClick={() => handleViewTeacher(teacher)}
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        className="min-h-[36px]"
                        style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                        onClick={() => handleVerifyTeacher(teacher)}
                        disabled={isVerifying === teacher.id}
                      >
                        <ShieldCheck className={`w-4 h-4 mr-2 ${isVerifying === teacher.id ? 'animate-spin' : ''}`} />
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
              {filteredTeachers
                .sort((a, b) => (b.stats?.classes || 0) - (a.stats?.classes || 0))
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
                        <span className="text-sm text-gray-500">{teacher.stats?.classes || 0} classes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${((teacher.stats?.classes || 0) / (Math.max(...filteredTeachers.map(t => t.stats?.classes || 0)) || 1)) * 100}%`,
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
              {filteredTeachers
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
                        {teacher.schoolName} • {parseSubjects(teacher.subjects).join(", ") || "No subjects"}
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

      {/* Add User Modal */}
      <AddUserModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTeachers}
      />

      {/* View Teacher Dialog */}
      {isViewDialogOpen && viewingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Teacher Details</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                >
                  {viewingTeacher.firstName?.[0]}
                  {viewingTeacher.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {viewingTeacher.firstName} {viewingTeacher.lastName}
                  </h3>
                  <p className="text-gray-500">{viewingTeacher.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {!viewingTeacher.emailVerified ? (
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Verification
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <IdCard className="w-4 h-4" />
                    Employee ID
                  </div>
                  <p className="font-medium">{viewingTeacher.employeeId || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-4 h-4" />
                    School
                  </div>
                  <p className="font-medium">{viewingTeacher.schoolName || "Unassigned"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <p className="font-medium">{viewingTeacher.phone || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Joined
                  </div>
                  <p className="font-medium">
                    {viewingTeacher.createdAt
                      ? new Date(viewingTeacher.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {parseSubjects(viewingTeacher.subjects).length > 0 ? (
                    parseSubjects(viewingTeacher.subjects).map((subject: string) => (
                      <Badge
                        key={subject}
                        variant="outline"
                        style={{
                          borderColor: "rgb(59 130 246)",
                          color: "rgb(37 99 235)",
                        }}
                      >
                        {subject}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No subjects assigned</span>
                  )}
                </div>
              </div>

              {/* Department */}
              {viewingTeacher.department && (
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900">Department</h4>
                  <p className="text-gray-700">{viewingTeacher.department}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              {!viewingTeacher.emailVerified && (
                <Button
                  style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                  className="text-white"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleVerifyTeacher(viewingTeacher);
                  }}
                  disabled={isVerifying === viewingTeacher.id}
                >
                  <ShieldCheck className={`w-4 h-4 mr-2 ${isVerifying === viewingTeacher.id ? 'animate-spin' : ''}`} />
                  Verify Teacher
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && deletingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Teacher?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{deletingTeacher.firstName} {deletingTeacher.lastName}</strong>?
                This will remove the teacher from the system and all associated data.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingTeacher(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDeleteTeacher}
                >
                  Delete Teacher
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
