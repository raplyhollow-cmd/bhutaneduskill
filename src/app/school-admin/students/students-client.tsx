"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENTS CLIENT COMPONENT
 *
 * Modern responsive design with:
 * - MobileCardGrid for mobile (2 columns)
 * - Premium table for desktop
 * - Enhanced search and filters
 * - Better UX and accessibility
 * - Bulk import functionality with seat capacity checking
 * - In-place editing for quick name updates
 * - Quick add student with ExpressAddModal
 */

import { useState, useEffect, useTransition } from "react";
import { BulkImportModal } from "@/components/school-admin/bulk-import-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MobileCard, MobileCardGrid } from "@/components/ui/mobile-card";
import { TableSkeleton } from "@/components/ui/skeleton/table-skeleton";
import { CardGridSkeleton, StatCardSkeleton } from "@/components/ui/skeleton/card-skeleton";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import {
  Users,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  GraduationCap,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchStudents } from "../_actions";
import type { StudentData } from "@/lib/api/school-admin";
import { InPlaceText } from "@/components/ui/in-place-editor";

interface StudentsClientProps {
  initialSearch: string;
  initialGrade: string;
  initialSection: string;
  initialStatus: string;
  initialFeeStatus: string;
  gradeOptions: string[];
  sectionOptions: string[];
  statusOptions: string[];
  feeStatusOptions: string[];
}

export function StudentsClient({
  initialSearch,
  initialGrade,
  initialSection,
  initialStatus,
  initialFeeStatus,
  gradeOptions,
  sectionOptions,
  statusOptions,
  feeStatusOptions,
}: StudentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedFeeStatus, setSelectedFeeStatus] = useState(initialFeeStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // ExpressAddModal hook for quick student add
  const quickAdd = useExpressAdd();

  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch students data
  const loadStudents = async () => {
    setLoading(true);
    try {
      const result = await fetchStudents({
        search: searchQuery,
        grade: selectedGrade,
        section: selectedSection,
        status: selectedStatus,
        feeStatus: selectedFeeStatus,
        limit: 10,
        offset: (currentPage - 1) * 10,
      });
      setStudents(result.students);
      setTotal(result.total);
    } catch (error) {
      logger.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  };

  // Quick add student handler - creates student with minimal info
  const handleQuickAddStudent = async (name: string): Promise<{ success: true; data?: unknown } | { success: false; error: string }> => {
    try {
      const [firstName, ...lastNameParts] = name.trim().split(" ");
      const lastName = lastNameParts.join(" ") || "";

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `user_${Date.now()}`,
          firstName,
          lastName: lastName || "Student",
          type: "student",
          email: `${firstName.toLowerCase()}.student@school.edu.bt`,
          status: "active",
        }),
      });

      if (response.ok) {
        await loadStudents();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to add student" };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  useEffect(() => {
    loadStudents();
  }, [currentPage]);

  // Update URL when filters change
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "All") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadStudents();
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        updateFilters({ search: searchQuery });
        loadStudents();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSelectStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((s) => s !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  // Save student name via API (for InPlaceEditor)
  const saveStudentName = async (studentId: string, newName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update student name");
      }

      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, name: newName } : s))
      );

      return { success: true };
    } catch (error) {
      logger.error("Failed to update student name:", error);
      return { success: false, error: "Failed to update name" };
    }
  };

  const getFeeStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-green-100 text-green-700 border-green-200",
      partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
      pending: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const totalPages = Math.ceil(total / 10);

  // Calculate stats from real data
  const totalActive = students.filter((s) => s.status === "active").length;
  const totalFeePending = students.filter((s) => s.feeStatus === "pending").length;
  const totalClasses = new Set(students.map((s) => s.class)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600 mt-1">
            {total} student{total !== 1 ? "s" : ""} enrolled
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/school-admin/students/templates">
              <Download className="w-4 h-4 mr-2" />
              Template
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <Button variant="outline" size="sm" onClick={quickAdd.open}>
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Cards - Premium Design */}
      {loading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500">Total Students</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalActive}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalFeePending}</p>
                <p className="text-xs text-gray-500">Fee Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalClasses}</p>
                <p className="text-xs text-gray-500">Classes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Enhanced */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  updateFilters({ grade: e.target.value });
                  loadStudents();
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade === "All" ? "All Grades" : `Grade ${grade}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  updateFilters({ section: e.target.value });
                  loadStudents();
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section === "All" ? "All Sections" : `Section ${section}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  updateFilters({ status: e.target.value });
                  loadStudents();
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Status" : status}
                  </option>
                ))}
              </select>

              <select
                value={selectedFeeStatus}
                onChange={(e) => {
                  setSelectedFeeStatus(e.target.value);
                  updateFilters({ feeStatus: e.target.value });
                  loadStudents();
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                {feeStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Fee Status" : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg">
                <span className="text-sm text-gray-700">{selectedStudents.length} selected</span>
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students List - Responsive: MobileCardGrid on mobile, Table on desktop */}
      {loading ? (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>Loading students...</CardDescription>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={10} columns={8} />
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-gray-900">No students found</p>
            <p className="text-sm mt-1">Add your first student to get started</p>
            <Button
              className="mt-4 bg-violet-600 hover:bg-violet-700"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View - Card Grid */}
          <div className="lg:hidden space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-violet-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectStudent(student.id);
                    }}
                    className="w-4 h-4 mt-1 rounded border-gray-300"
                  />
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-700 font-semibold">
                      {student.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <InPlaceText
                      value={student.name}
                      onSave={async (newName) => saveStudentName(student.id, newName)}
                      placeholder="Student name"
                      minLength={2}
                      maxLength={100}
                      required={true}
                      displayClassName="font-semibold text-gray-900 truncate"
                      showIcon={true}
                    />
                    <p className="text-sm text-gray-500 truncate">{student.id}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {student.class || "No class"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getFeeStatusBadge(student.feeStatus)}
                      >
                        {student.feeStatus}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getStatusBadge(student.status)}
                      >
                        {student.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <UserCheck className="w-4 h-4" />
                      <span>{student.attendance}</span>
                    </div>
                    <Link
                      href={`/school-admin/students/${student.id}`}
                      className="flex items-center justify-center gap-1 text-violet-600 hover:text-violet-700 font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Premium Table */}
          <Card className="hidden lg:block border-gray-200">
            <CardHeader>
              <CardTitle>Student List</CardTitle>
              <CardDescription>Manage all students enrolled in your school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === students.length && students.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Parent</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Approved By</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Attendance</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Fee Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <span className="text-violet-700 font-medium text-sm">
                                {student.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div>
                              <InPlaceText
                                value={student.name}
                                onSave={async (newName) => saveStudentName(student.id, newName)}
                                placeholder="Student name"
                                minLength={2}
                                maxLength={100}
                                required={true}
                                displayClassName="font-medium text-gray-900"
                                showIcon={true}
                              />
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{student.id}</span>
                                {student.email && <span>•</span>}
                                {student.email && <span className="truncate max-w-[150px]">{student.email}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{student.class || "Not assigned"}</p>
                          {student.grade && <p className="text-sm text-gray-500">Grade {student.grade}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">{student.parentName || "Not specified"}</p>
                          {student.parentPhone && <p className="text-xs text-gray-500">{student.parentPhone}</p>}
                        </td>
                        <td className="py-3 px-4">
                          {student.approverName ? (
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                              <div>
                                <p className="text-sm text-gray-900">{student.approverName}</p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {student.approverType === "teacher" && "Teacher"}
                                  {student.approverType === "school-admin" && "School Admin"}
                                  {student.approverType === "admin" && "Platform Admin"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${
                              parseInt(student.attendance) >= 90
                                ? "bg-green-100 text-green-700"
                                : parseInt(student.attendance) >= 75
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {student.attendance}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getFeeStatusBadge(student.feeStatus)} variant="outline">
                            {student.feeStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadge(student.status)} variant="outline">
                            {student.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/school-admin/students/${student.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * 10 + 1} to{" "}
                    {Math.min(currentPage * 10, total)} of {total}{" "}
                    students
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? "bg-violet-600 hover:bg-violet-700" : ""}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Student Modal - Modern Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the student details below</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Registration Form</h3>
                <p className="text-gray-600 text-sm">
                  The complete student creation form will be available with full API integration.
                </p>
                <div className="mt-6 p-4 bg-violet-50 rounded-lg text-sm text-violet-800">
                  <p className="font-medium mb-2">Features coming soon:</p>
                  <ul className="text-left space-y-1 text-violet-700">
                    <li>• Personal information fields</li>
                    <li>• Parent/guardian details</li>
                    <li>• Class and section assignment</li>
                    <li>• Automatic ID generation</li>
                    <li>• Photo upload support</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-700" disabled>
                Create Student
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal - Using BulkImportModal Component */}
      <BulkImportModal
        open={showBulkUploadModal}
        onClose={() => {
          setShowBulkUploadModal(false);
          loadStudents(); // Refresh after import
        }}
      />

      {/* Quick Add Student Modal */}
      <ExpressAddModal
        isOpen={quickAdd.isOpen}
        onClose={quickAdd.close}
        onSubmit={handleQuickAddStudent}
        title="Quick Add Student"
        description="Enter student name (basic info will be auto-generated)"
        placeholder="e.g., Tashi Dorji"
        successMessage="Student added successfully! You can edit details later."
        errorMessage="Failed to add student. Please try again."
        icon={Users}
        minLength={2}
        submitLabel="Press Enter to add student"
      />
    </div>
  );
}
