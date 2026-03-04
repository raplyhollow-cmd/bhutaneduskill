"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENTS CLIENT COMPONENT
 *
 * Modern UX with:
 * - ModernDataGrid for desktop with inline editing
 * - SlideOverPanel for detailed student view
 * - Mobile-responsive card grid
 * - Enhanced search and filters
 * - Bulk import functionality
 * - Quick add student with ExpressAddModal
 */

import { useState, useEffect, useTransition } from "react";
import { BulkImportModal } from "@/components/school-admin/bulk-import-modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton/table-skeleton";
import { CardGridSkeleton } from "@/components/ui/skeleton/card-skeleton";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import { GoogleDataTable, GoogleColumn, GoogleAction } from "@/components/admin/google-data-table";
import { SlideOverPanel, SlideOverSection, SlideOverField } from "@/components/admin/slide-over-panel";
import { InPlaceText } from "@/components/ui/in-place-editor";
import {
  Users,
  Plus,
  Search,
  Upload,
  Download,
  Eye,
  UserCheck,
  GraduationCap,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Sparkles,
  ShieldCheck,
  BookOpen,
  CreditCard,
  TrendingUp,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchStudents } from "../_actions";
import type { StudentData } from "@/lib/api/school-admin";
import { cn } from "@/lib/utils";

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

  // Slide-over panel state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<"overview" | "academics" | "fees" | "attendance">("overview");

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

  // Inline edit handlers for student fields
  const handleUpdateField = async (studentId: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${field}`);
      }

      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s))
      );

      // Update selected student if viewing in slide-over
      if (selectedStudent?.id === studentId) {
        setSelectedStudent((prev) => prev ? { ...prev, [field]: value } : null);
      }
    } catch (error) {
      logger.error(`Failed to update ${field}:`, error);
      throw error;
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

  const getAttendanceBadge = (attendance: string) => {
    const pct = parseInt(attendance) || 0;
    if (pct >= 90) return "bg-green-100 text-green-700 border-green-200";
    if (pct >= 75) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const totalPages = Math.ceil(total / 10);

  // Open slide-over panel for student details
  const openStudentDetails = (student: StudentData) => {
    setSelectedStudent(student);
    setSlideOverOpen(true);
    setSlideOverTab("overview");
  };

  // Action handlers for individual student
  const handleViewStudent = (student: StudentData) => {
    router.push(`/school-admin/students/${student.id}`);
  };

  const handleEditStudent = (student: StudentData) => {
    openStudentDetails(student);
  };

  const handleDeleteStudent = async (student: StudentData) => {
    if (!confirm(`Delete ${student.name}? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/users/${student.id}`, { method: "DELETE" });
      if (response.ok) {
        await loadStudents();
      } else {
        alert("Failed to delete student");
      }
    } catch {
      alert("Failed to delete student");
    }
  };

  const handleViewFees = (student: StudentData) => {
    setSelectedStudent(student);
    setSlideOverTab("fees");
    setSlideOverOpen(true);
  };

  const handleViewAttendance = (student: StudentData) => {
    setSelectedStudent(student);
    setSlideOverTab("attendance");
    setSlideOverOpen(true);
  };

  // Calculate stats from real data
  const totalActive = students.filter((s) => s.status === "active").length;
  const totalFeePending = students.filter((s) => s.feeStatus === "pending").length;
  const totalClasses = new Set(students.map((s) => s.class)).size;

  // Avatar component with initials
  const StudentAvatar = ({ name, className }: { name: string; className?: string }) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold text-sm", className)}>
        {initials}
      </div>
    );
  };

  // Define columns for GoogleDataTable
  const columns: GoogleColumn<StudentData>[] = [
    {
      id: "name",
      label: "Student",
      width: "220px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <StudentAvatar name={row.name} />
          <div className="min-w-0">
            <InPlaceText
              value={row.name}
              onSave={async (newName) => {
                const result = await saveStudentName(row.id, newName);
                if (!result.success) throw new Error(result.error);
                return { success: true };
              }}
              placeholder="Student name"
              minLength={2}
              maxLength={100}
              required={true}
              displayClassName="font-medium text-gray-900 truncate block"
              showIcon={false}
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="truncate max-w-[120px]">{row.id}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "class",
      label: "Class",
      width: "150px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.class || "Not assigned"}</p>
          {row.grade && <p className="text-xs text-gray-500">Grade {row.grade}</p>}
        </div>
      ),
    },
    {
      id: "section",
      label: "Section",
      width: "100px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.section || "—"}
        </Badge>
      ),
    },
    {
      id: "parentName",
      label: "Parent",
      width: "180px",
      filterable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-gray-900">{row.parentName || "Not specified"}</p>
          {row.parentPhone && <p className="text-xs text-gray-500">{row.parentPhone}</p>}
        </div>
      ),
    },
    {
      id: "attendance",
      label: "Attendance",
      width: "100px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <Badge variant="outline" className={cn(getAttendanceBadge(row.attendance))}>
          {row.attendance}
        </Badge>
      ),
    },
    {
      id: "feeStatus",
      label: "Fee Status",
      width: "110px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <Badge variant="outline" className={cn(getFeeStatusBadge(row.feeStatus))}>
          {row.feeStatus}
        </Badge>
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "100px",
      sortable: true,
      filterable: true,
      render: (row) => (
        <Badge variant="outline" className={cn(getStatusBadge(row.status))}>
          {row.status}
        </Badge>
      ),
    },
  ];

  // Define actions for GoogleDataTable
  const actions: GoogleAction<StudentData>[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4 mr-2" />,
      onClick: handleViewStudent,
    },
    {
      label: "Edit Profile",
      icon: <span className="w-4 h-4 mr-2">✏️</span>,
      onClick: handleEditStudent,
    },
    {
      label: "View Fees",
      icon: <span className="w-4 h-4 mr-2">💰</span>,
      onClick: handleViewFees,
    },
    {
      label: "View Attendance",
      icon: <span className="w-4 h-4 mr-2">📊</span>,
      onClick: handleViewAttendance,
    },
    {
      label: "",
      icon: null,
      onClick: () => {},
      separator: true,
    } as GoogleAction<StudentData>,
    {
      label: "Delete Student",
      icon: <span className="w-4 h-4 mr-2">🗑️</span>,
      onClick: handleDeleteStudent,
      variant: "danger",
    },
  ];

  // Slide-over tabs
  const slideOverTabs = [
    { id: "overview", label: "Overview", icon: <Users className="w-4 h-4" /> },
    { id: "academics", label: "Academics", icon: <BookOpen className="w-4 h-4" /> },
    { id: "fees", label: "Fees", icon: <CreditCard className="w-4 h-4" /> },
    { id: "attendance", label: "Attendance", icon: <Activity className="w-4 h-4" /> },
  ];

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
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Cards - Modern Design with Gradients */}
      {loading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-600">Total Students</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalActive}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalFeePending}</p>
                <p className="text-xs text-gray-600">Fee Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalClasses}</p>
                <p className="text-xs text-gray-600">Classes</p>
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
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Filter Dropdowns */}
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

            {/* Note: Bulk actions are shown in the grid header when items are selected */}
          </div>
        </CardContent>
      </Card>

      {/* Students List - ModernDataGrid */}
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
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-violet-600" />
            </div>
            <p className="font-medium text-gray-900">No students found</p>
            <p className="text-sm mt-1">Add your first student to get started</p>
            <Button
              className="mt-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop View - GoogleDataTable */}
          <div className="hidden lg:block">
            <GoogleDataTable
              data={students}
              columns={columns}
              keyField="id"
              isLoading={loading}
              title={undefined}
              actions={actions}
              onRowClick={(row) => openStudentDetails(row)}
              onUpdate={handleUpdateField}
              bulkActions={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              }
            />
          </div>

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
                  <StudentAvatar name={student.name} />
                  <div className="flex-1 min-w-0">
                    <InPlaceText
                      value={student.name}
                      onSave={async (newName) => saveStudentName(student.id, newName)}
                      placeholder="Student name"
                      minLength={2}
                      maxLength={100}
                      required={true}
                      displayClassName="font-semibold text-gray-900 truncate"
                      showIcon={false}
                    />
                    <p className="text-sm text-gray-500 truncate">{student.id}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {student.class || "No class"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(getFeeStatusBadge(student.feeStatus))}
                      >
                        {student.feeStatus}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(getStatusBadge(student.status))}
                      >
                        {student.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <UserCheck className="w-4 h-4" />
                    <span>{student.attendance}</span>
                  </div>
                  <button
                    onClick={() => openStudentDetails(student)}
                    className="flex items-center justify-center gap-1 text-violet-600 hover:text-violet-700 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
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
                <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
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

      {/* Slide-Over Panel for Student Details */}
      {selectedStudent && (
        <SlideOverPanel
          isOpen={slideOverOpen}
          onClose={() => setSlideOverOpen(false)}
          title={selectedStudent.name}
          subtitle={`ID: ${selectedStudent.id}`}
          tabs={slideOverTabs}
          activeTab={slideOverTab}
          onTabChange={(tab) => setSlideOverTab(tab as typeof slideOverTab)}
          width="xl"
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/school-admin/students/${selectedStudent.id}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Full Profile
            </Button>
          }
        >
          {slideOverTab === "overview" && (
            <div className="p-6 space-y-6">
              {/* Student Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-gray-500">{selectedStudent.email || "No email"}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={cn(getStatusBadge(selectedStudent.status))} variant="outline">
                      {selectedStudent.status}
                    </Badge>
                    <Badge className={cn(getFeeStatusBadge(selectedStudent.feeStatus))} variant="outline">
                      {selectedStudent.feeStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <SlideOverSection title="Personal Information">
                <SlideOverField label="Student ID" value={selectedStudent.id} />
                <SlideOverField label="Email" value={selectedStudent.email || "Not provided"} />
                <SlideOverField label="Phone" value={selectedStudent.phone || "Not provided"} />
                <SlideOverField
                  label="Admission Date"
                  value={selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString() : "Not set"}
                />
              </SlideOverSection>

              {/* Academic Information */}
              <SlideOverSection title="Academic Information">
                <SlideOverField label="Class" value={selectedStudent.class || "Not assigned"} />
                <SlideOverField label="Grade" value={selectedStudent.grade ? `Grade ${selectedStudent.grade}` : "Not set"} />
                <SlideOverField label="Section" value={selectedStudent.section || "Not assigned"} />
              </SlideOverSection>

              {/* Parent/Guardian Information */}
              <SlideOverSection title="Parent/Guardian Information">
                <SlideOverField label="Parent Name" value={selectedStudent.parentName || "Not specified"} />
                <SlideOverField label="Parent Phone" value={selectedStudent.parentPhone || "Not provided"} />
              </SlideOverSection>

              {/* Approval Information */}
              {selectedStudent.approverName && (
                <SlideOverSection title="Approval Information">
                  <div className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approved by {selectedStudent.approverName}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {selectedStudent.approverType === "teacher" && "Teacher"}
                        {selectedStudent.approverType === "school-admin" && "School Admin"}
                        {selectedStudent.approverType === "admin" && "Platform Admin"}
                      </p>
                    </div>
                  </div>
                </SlideOverSection>
              )}
            </div>
          )}

          {slideOverTab === "academics" && (
            <div className="p-6 space-y-6">
              <SlideOverSection title="Academic Performance" description="Track grades and exam results">
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Academic data will be available here</p>
                </div>
              </SlideOverSection>
            </div>
          )}

          {slideOverTab === "fees" && (
            <div className="p-6 space-y-6">
              <SlideOverSection title="Fee Information" description="Payment history and pending fees">
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Fee Status</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{selectedStudent.feeStatus}</p>
                    </div>
                    <Badge className={cn(getFeeStatusBadge(selectedStudent.feeStatus))} variant="outline">
                      {selectedStudent.feeStatus}
                    </Badge>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Detailed fee history coming soon</p>
                </div>
              </SlideOverSection>
            </div>
          )}

          {slideOverTab === "attendance" && (
            <div className="p-6 space-y-6">
              <SlideOverSection title="Attendance Record" description="Daily attendance and trends">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Overall Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedStudent.attendance}</p>
                    </div>
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", parseInt(selectedStudent.attendance) >= 75 ? "bg-green-100" : "bg-red-100")}>
                      <TrendingUp className={cn("w-6 h-6", parseInt(selectedStudent.attendance) >= 75 ? "text-green-600" : "text-red-600")} />
                    </div>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Detailed attendance calendar coming soon</p>
                </div>
              </SlideOverSection>
            </div>
          )}
        </SlideOverPanel>
      )}
    </div>
  );
}
