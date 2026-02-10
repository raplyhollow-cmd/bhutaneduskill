/**
 * TEACHERS CLIENT COMPONENT
 *
 * Client-side component for teachers management with server actions.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { fetchTeachers } from "../_actions";
import type { TeacherData } from "@/lib/api/school-admin";

interface TeachersClientProps {
  initialSearch: string;
  initialSubject: string;
  initialStatus: string;
  subjectOptions: string[];
  statusOptions: string[];
}

export function TeachersClient({
  initialSearch,
  initialSubject,
  initialStatus,
  subjectOptions,
  statusOptions,
}: TeachersClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const result = await fetchTeachers({
        search: searchQuery,
        subject: selectedSubject,
        status: selectedStatus,
        limit: 10,
        offset: (currentPage - 1) * 10,
      });
      setTeachers(result.teachers);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadTeachers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSubject, selectedStatus]);

  const handleSelectAll = () => {
    if (selectedTeachers.length === teachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(teachers.map((t) => t.id));
    }
  };

  const handleSelectTeacher = (id: string) => {
    if (selectedTeachers.includes(id)) {
      setSelectedTeachers(selectedTeachers.filter((t) => t !== id));
    } else {
      setSelectedTeachers([...selectedTeachers, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      "on-leave": "bg-yellow-100 text-yellow-700 border-yellow-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      Mathematics: "bg-blue-100 text-blue-700",
      Physics: "bg-purple-100 text-purple-700",
      Chemistry: "bg-green-100 text-green-700",
      Biology: "bg-lime-100 text-lime-700",
      English: "bg-orange-100 text-orange-700",
      Dzongkha: "bg-red-100 text-red-700",
      History: "bg-yellow-100 text-yellow-700",
      Geography: "bg-teal-100 text-teal-700",
      Economics: "bg-indigo-100 text-indigo-700",
      "Computer Science": "bg-pink-100 text-pink-700",
    };
    return colors[subject] || "bg-gray-100 text-gray-700";
  };

  const totalPages = Math.ceil(total / 10);

  // Calculate stats
  const totalActive = teachers.filter((t) => t.status === "active").length;
  const totalOnLeave = teachers.filter((t) => t.status === "on-leave").length;
  const totalStudentsTaught = teachers.reduce((sum, t) => sum + t.totalStudents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-1">
            {total} teacher{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/school-admin/teachers/templates">
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
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-sm text-gray-500">Total Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
                <p className="text-sm text-gray-500">Active Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalOnLeave}</p>
                <p className="text-sm text-gray-500">On Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStudentsTaught.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Students Taught</p>
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
                  placeholder="Search by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject === "All" ? "All Subjects" : subject}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : status}
                </option>
              ))}
            </select>

            {/* Bulk Actions */}
            {selectedTeachers.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">{selectedTeachers.length} selected</span>
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

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
          <CardDescription>Manage all teachers in your school</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No teachers found. Add your first teacher to get started.
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
                          checked={selectedTeachers.length === teachers.length && teachers.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Teacher</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Employee ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Subjects</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Classes</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Students</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedTeachers.includes(teacher.id)}
                            onChange={() => handleSelectTeacher(teacher.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                              <span className="text-secondary-600 font-medium text-sm">
                                {teacher.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{teacher.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="w-3 h-3" />
                                <span>{teacher.email || "No email"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-sm text-gray-900">{teacher.employeeId || "N/A"}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.length > 0 ? teacher.subjects.map((subject) => (
                              <Badge key={subject} className={getSubjectColor(subject)} variant="outline">
                                {subject}
                              </Badge>
                            )) : <span className="text-sm text-gray-400">None assigned</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">
                            {teacher.assignedClasses.length > 0 ? teacher.assignedClasses.join(", ") : "None assigned"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{teacher.totalStudents}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadge(teacher.status)} variant="outline">
                            {teacher.status === "on-leave" ? "On Leave" : teacher.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/school-admin/teachers/${teacher.id}`}>
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
                    teachers
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
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
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

      {/* Add Teacher Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Teacher</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center py-8">
                Teacher creation form will be implemented with API integration.
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
              <h2 className="text-xl font-bold">Bulk Upload Teachers</h2>
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
