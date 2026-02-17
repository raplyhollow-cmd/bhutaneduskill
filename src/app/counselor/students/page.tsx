"use client";

import { logger } from "@/lib/logger";
/**
 * COUNSELOR - STUDENTS MANAGEMENT
 *
 * Features:
 * - View all assigned students with filters
 * - Search by name, email, or school
 * - Filter by grade, assessment status, needs attention
 * - Quick access to student profiles
 * - Track career planning progress
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  AlertCircle,
  Eye,
  GraduationCap,
  Target,
  Calendar,
  CheckCircle,
  MapPin,
  Mail,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface CounselorStudentData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  grade: number | null;
  section: string | null;
  school: string | null;
  counselorId: string;
  assessmentStatus: "completed" | "in_progress" | "pending";
  assessmentsTaken: number;
  topCareer: string | null;
  careerMatch: number | null;
  planStatus: "completed" | "in_progress" | "not_started";
  lastSession: string;
  needsAttention: boolean;
  gpa: number | null;
  attendanceRate: number;
}

interface CounselorStats {
  totalStudents: number;
  studentsCompletedAssessments: number;
  studentsWithCareerPlans: number;
  studentsNeedingAttention: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const gradeOptions = ["All", "9", "10", "11", "12"];
const assessmentStatusOptions = ["All", "Completed", "In Progress", "Pending"];
const planStatusOptions = ["All", "Not Started", "In Progress", "Completed"];

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function CounselorStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedAssessmentStatus, setSelectedAssessmentStatus] = useState("All");
  const [selectedPlanStatus, setSelectedPlanStatus] = useState("All");
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Data states
  const [students, setStudents] = useState<CounselorStudentData[]>([]);
  const [stats, setStats] = useState<CounselorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchStudentsData();
  }, []);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/counselor/students");
      if (!response.ok) {
        throw new Error("Failed to fetch students data");
      }

      const data = await response.json();
      setStudents(data.students || []);
      setStats(data.stats || null);
    } catch (err) {
      logger.error("Error fetching students:", err);
      setError("Failed to load students. Please try again.");
      setStudents([]);
      setStats({
        totalStudents: 0,
        studentsCompletedAssessments: 0,
        studentsWithCareerPlans: 0,
        studentsNeedingAttention: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = selectedGrade === "All" || student.grade?.toString() === selectedGrade;
    const matchesAssessmentStatus = selectedAssessmentStatus === "All" ||
      student.assessmentStatus.toLowerCase().replace(" ", "_") === selectedAssessmentStatus.toLowerCase().replace(" ", "_");
    const matchesPlanStatus = selectedPlanStatus === "All" ||
      student.planStatus.toLowerCase().replace(" ", "_") === selectedPlanStatus.toLowerCase().replace(" ", "_");
    const matchesAttention = !showNeedsAttention || student.needsAttention;

    return matchesSearch && matchesGrade && matchesAssessmentStatus && matchesPlanStatus && matchesAttention;
  });

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getAssessmentStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-700 border-green-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      pending: "bg-gray-100 text-gray-700 border-gray-200",
    };
    const labels = {
      completed: "Completed",
      in_progress: "In Progress",
      pending: "Pending",
    };
    return { className: styles[status as keyof typeof styles] || styles.pending, label: labels[status as keyof typeof labels] || status };
  };

  const getPlanStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-700 border-green-200",
      in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
      not_started: "bg-gray-100 text-gray-600 border-gray-200",
    };
    const labels = {
      completed: "Completed",
      in_progress: "In Progress",
      not_started: "Not Started",
    };
    return { className: styles[status as keyof typeof styles] || styles.not_started, label: labels[status as keyof typeof labels] || status };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "rgb(147 51 234)" }} />
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchStudentsData} style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export List
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                  <Users className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-500">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.studentsCompletedAssessments}</p>
                  <p className="text-sm text-gray-500">Assessments Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.studentsWithCareerPlans}</p>
                  <p className="text-sm text-gray-500">Career Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.studentsNeedingAttention}</p>
                  <p className="text-sm text-gray-500">Need Attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade === "All" ? "All Grades" : `Grade ${grade}`}
                </option>
              ))}
            </select>

            {/* Assessment Status Filter */}
            <select
              value={selectedAssessmentStatus}
              onChange={(e) => setSelectedAssessmentStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {assessmentStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Assessment Status" : status}
                </option>
              ))}
            </select>

            {/* Plan Status Filter */}
            <select
              value={selectedPlanStatus}
              onChange={(e) => setSelectedPlanStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {planStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Plan Status" : status}
                </option>
              ))}
            </select>

            {/* Needs Attention Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showNeedsAttention}
                onChange={(e) => setShowNeedsAttention(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm">Needs Attention Only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedStudents.map((student) => {
          const assessmentBadge = getAssessmentStatusBadge(student.assessmentStatus);
          const planBadge = getPlanStatusBadge(student.planStatus);

          return (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <p className="text-xs text-gray-500">{student.id}</p>
                    </div>
                  </div>
                  {student.needsAttention && (
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* School & Grade */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>Grade {student.grade} - Section {student.section || "N/A"}</span>
                </div>

                {/* School */}
                {student.school && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{student.school}</span>
                  </div>
                )}

                {/* Contact */}
                {student.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={assessmentBadge.className} variant="outline">
                    {assessmentBadge.label} Assessment
                  </Badge>
                  <Badge className={planBadge.className} variant="outline">
                    {planBadge.label} Plan
                  </Badge>
                </div>

                {/* Career Match or Progress */}
                {student.topCareer ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Top Career:</span>
                    <span className="font-medium" style={{ color: 'rgb(147 51 234)' }}>{student.topCareer}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Assessments:</span>
                    <span className="font-medium">{student.assessmentsTaken} taken</span>
                  </div>
                )}

                {/* Last Session */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                  <span>Last session:</span>
                  <span>{student.lastSession}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/counselor/students/${student.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/counselor/schedule?student=${student.id}`}>
                      <Calendar className="w-4 h-4 mr-1" />
                      Schedule
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {paginatedStudents.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedGrade("All");
              setSelectedAssessmentStatus("All");
              setSelectedPlanStatus("All");
              setShowNeedsAttention(false);
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}{" "}
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
                  className={currentPage === pageNum ? "" : ""}
                  style={currentPage === pageNum ? { background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' } : {}}
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
    </div>
  );
}
