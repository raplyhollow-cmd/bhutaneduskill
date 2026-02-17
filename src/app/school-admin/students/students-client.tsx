"use client";

/**
 * STUDENTS CLIENT COMPONENT
 *
 * Client-side component for students management with server actions.
 */


import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchStudents } from "../_actions";
import type { StudentData } from "@/lib/api/school-admin";

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
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600 mt-1">
            {total} student{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/school-admin/students/templates">
              <Download className="w-4 h-4 mr-2" />
              CSV Template
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
                <p className="text-sm text-gray-500">Active Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalFeePending}</p>
                <p className="text-sm text-gray-500">Fee Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
                <p className="text-sm text-gray-500">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                updateFilters({ grade: e.target.value });
                loadStudents();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                updateFilters({ section: e.target.value });
                loadStudents();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                updateFilters({ status: e.target.value });
                loadStudents();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>

            {/* Fee Status Filter */}
            <select
              value={selectedFeeStatus}
              onChange={(e) => {
                setSelectedFeeStatus(e.target.value);
                updateFilters({ feeStatus: e.target.value });
                loadStudents();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {feeStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Fee Status" : status}
                </option>
              ))}
            </select>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">{selectedStudents.length} selected</span>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>Manage all students enrolled in your school</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students found. Add your first student to get started.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === students.length && students.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Parent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Attendance</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Fee Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {student.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{student.id}</span>
                                {student.email && <span>•</span>}
                                {student.email && <span>{student.email}</span>}
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
                          <p className="text-xs text-gray-500">{student.parentPhone || ""}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
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
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
                          className={currentPage === pageNum ? "bg-primary-600 hover:bg-primary-700" : ""}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal - Placeholder for form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Student</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center py-8">
                Student creation form will be implemented with API integration.
              </p>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal - Placeholder */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Bulk Upload Students</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowBulkUploadModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center py-8">
                Bulk upload will be implemented with API integration.
              </p>
            </div>
            <div className="border-t px-6 py-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowBulkUploadModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
