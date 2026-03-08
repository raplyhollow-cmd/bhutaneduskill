/**
 * SCHOOL ADMIN - CLASS STUDENTS ENROLLMENT PAGE
 *
 * Features:
 * - View class information (name, grade, section)
 * - Display list of currently enrolled students
 * - Add students modal with multi-select
 * - Remove students from class with confirmation
 * - Edit roll numbers inline
 * - Search/filter students
 * - Loading states and error handling
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Search,
  Edit,
  Save,
  X,
  Check,
  AlertCircle,
  Loader2,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================================
// TYPES
// ============================================================================

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  capacity: number;
  isActive: boolean;
}

interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  classGrade: number | null;
  section: string | null;
}

interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  academicYear: string;
  enrollmentDate: string;
  status: string;
  rollNumber: string | null;
  section: string | null;
  student?: Student;
  createdAt?: string;
  updatedAt?: string;
}

interface EnrollmentsResponse {
  success: boolean;
  enrollments?: Enrollment[];
  error?: string;
}

interface StudentsResponse {
  students?: Student[];
  error?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const schoolAdminGradient = "rgb(139 92 246)";
const schoolAdminGradientDark = "rgb(124 58 237)";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClassStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  // ========================================================================
  // STATE
  // ========================================================================

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "withdrawn">("all");
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentToRemove, setStudentToRemove] = useState<Enrollment | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Edit roll number state
  const [editingRollNumber, setEditingRollNumber] = useState<string | null>(null);
  const [rollNumberValue, setRollNumberValue] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  const fetchClassInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch class information");
      }
      const data = await response.json();
      setClassInfo(data.class || null);
    } catch (err) {
      console.error("Error fetching class info:", err);
      setError("Failed to load class information");
    }
  }, [classId]);

  const fetchEnrollments = useCallback(async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/enrollments`);
      if (!response.ok) {
        throw new Error("Failed to fetch enrollments");
      }
      const data: EnrollmentsResponse = await response.json();
      if (data.success && data.enrollments) {
        setEnrollments(data.enrollments);
      } else {
        setError(data.error || "Failed to load enrollments");
      }
    } catch (err) {
      console.error("Error fetching enrollments:", err);
      setError("Failed to load enrollments");
    }
  }, [classId]);

  const fetchAvailableStudents = useCallback(async (query: string = "") => {
    setLoadingStudents(true);
    try {
      // Get enrolled student IDs to filter them out
      const enrolledIds = enrollments.map((e) => e.studentId);

      const response = await fetch(
        `/api/students/search?q=${encodeURIComponent(query)}&limit=50`
      );
      if (!response.ok) {
        throw new Error("Failed to search students");
      }
      const data: StudentsResponse = await response.json();

      if (data.students) {
        // Filter out already enrolled students
        const available = data.students.filter(
          (s) => !enrolledIds.includes(s.id)
        );
        setAvailableStudents(available);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoadingStudents(false);
    }
  }, [enrollments]);

  useEffect(() => {
    if (!classId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchClassInfo(), fetchEnrollments()]);
      setLoading(false);
    };

    loadData();
  }, [classId, fetchClassInfo, fetchEnrollments]);

  useEffect(() => {
    if (isAddModalOpen) {
      fetchAvailableStudents();
    }
  }, [isAddModalOpen, fetchAvailableStudents]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleAddStudents = async () => {
    if (selectedStudentIds.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;

      const response = await fetch(`/api/classes/${classId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          academicYear,
          section: classInfo?.section || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add students");
      }

      // Refresh enrollments
      await fetchEnrollments();

      // Close modal and reset
      setIsAddModalOpen(false);
      setSelectedStudentIds([]);
      setAvailableStudents([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add students");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/classes/${classId}/enrollments/${studentToRemove.studentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove student");
      }

      // Remove from local state
      setEnrollments((prev) =>
        prev.filter((e) => e.id !== studentToRemove.id)
      );

      // Close dialog
      setIsRemoveDialogOpen(false);
      setStudentToRemove(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove student");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRollNumber = async (enrollment: Enrollment) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/classes/${classId}/enrollments/${enrollment.studentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rollNumber: rollNumberValue || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update roll number");
      }

      // Update local state
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollment.id
            ? { ...e, rollNumber: rollNumberValue || null }
            : e
        )
      );
      setEditingRollNumber(null);
      setRollNumberValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update roll number");
    } finally {
      setSaving(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const startEditingRollNumber = (enrollment: Enrollment) => {
    setEditingRollNumber(enrollment.id);
    setRollNumberValue(enrollment.rollNumber || "");
  };

  const cancelEditingRollNumber = () => {
    setEditingRollNumber(null);
    setRollNumberValue("");
  };

  // ========================================================================
  // FILTERED DATA
  // ========================================================================

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      searchQuery === "" ||
      enrollment.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.student?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || enrollment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEnrollments.length / studentsPerPage);
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-600" />
          <p className="text-gray-600">Loading class students...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error && !classInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.back()}
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/school-admin/classes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {classInfo ? `Grade ${classInfo.grade} - ${classInfo.section}` : "Class Students"}
            </h1>
            <p className="text-gray-500">
              {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} enrolled
              {classInfo && ` • Capacity: ${classInfo.capacity}`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: `linear-gradient(135deg, ${schoolAdminGradient} 0%, ${schoolAdminGradientDark} 100%)`,
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Students
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${schoolAdminGradient}20` }}
            >
              <Users className="w-6 h-6" style={{ color: schoolAdminGradient }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments.filter((e) => e.status === "active").length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {enrollments.filter((e) => e.status === "withdrawn").length}
              </p>
              <p className="text-sm text-gray-500">Withdrawn</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {classInfo?.academicYear || "N/A"}
              </p>
              <p className="text-sm text-gray-500">Academic Year</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "active" | "withdrawn") => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Roll No.</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollment Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEnrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No students found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Add students to this class to get started"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4"
                      style={{
                        background: `linear-gradient(135deg, ${schoolAdminGradient} 0%, ${schoolAdminGradientDark} 100%)`,
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Students
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedEnrollments.map((enrollment) => {
                const student = enrollment.student;
                const isEditing = editingRollNumber === enrollment.id;

                return (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={rollNumberValue}
                          onChange={(e) => setRollNumberValue(e.target.value)}
                          className="h-8 w-20"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">
                          {enrollment.rollNumber || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                          style={{ backgroundColor: schoolAdminGradient }}
                        >
                          {student?.firstName?.[0]}
                          {student?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student?.name || `${student?.firstName || ""} ${student?.lastName || ""}`.trim()}
                          </p>
                          <p className="text-sm text-gray-500">{student?.email || "No email"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {student?.phone && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            {student.phone}
                          </div>
                        )}
                        {student?.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          enrollment.status === "active"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }
                      >
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {enrollment.enrollmentDate
                          ? new Date(enrollment.enrollmentDate).toLocaleDateString()
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveRollNumber(enrollment)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditingRollNumber}
                              disabled={saving}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingRollNumber(enrollment)}
                              title="Edit roll number"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStudentToRemove(enrollment);
                                setIsRemoveDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Remove student"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {filteredEnrollments.length > studentsPerPage && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * studentsPerPage + 1} to{" "}
                      {Math.min(currentPage * studentsPerPage, filteredEnrollments.length)} of{" "}
                      {filteredEnrollments.length} students
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
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
                            style={
                              currentPage === pageNum
                                ? {
                                    background: `linear-gradient(135deg, ${schoolAdminGradient} 0%, ${schoolAdminGradientDark} 100%)`,
                                  }
                                : {}
                            }
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
                        Next
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Add Students Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Students to Class</DialogTitle>
            <DialogDescription>
              Select students to enroll in{" "}
              {classInfo ? `Grade ${classInfo.grade} - ${classInfo.section}` : "this class"}.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search students by name or email..."
              onChange={(e) => fetchAvailableStudents(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] border rounded-lg">
            {loadingStudents ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No students available to add</p>
              </div>
            ) : (
              <div className="divide-y">
                {availableStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                          style={{ backgroundColor: schoolAdminGradient }}
                        >
                          {student.firstName?.[0]}
                          {student.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim()}
                          </p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      {student.classGrade && (
                        <Badge variant="outline">Class {student.classGrade}</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-gray-500">
                {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudents}
                  disabled={selectedStudentIds.length === 0 || saving}
                  style={{
                    background: `linear-gradient(135deg, ${schoolAdminGradient} 0%, ${schoolAdminGradientDark} 100%)`,
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add {selectedStudentIds.length} Student{selectedStudentIds.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Student Confirmation Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Student from Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {studentToRemove?.student?.name || "this student"}
              </span>{" "}
              from this class? This action can be undone by re-enrolling the student.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveStudent}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
