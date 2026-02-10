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

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Filter,
  AlertCircle,
  Eye,
  GraduationCap,
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";

// Mock student data for counselors
const mockStudents = [
  {
    id: "STU001",
    name: "Tashi Dorji",
    email: "tashi.dorji@school.edu.bt",
    phone: "+975 17 12 34 56",
    grade: 12,
    section: "A",
    school: "Thimphu Higher Secondary School",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "completed",
    assessmentsTaken: 4,
    topCareer: "Software Engineer",
    careerMatch: 92,
    planStatus: "in_progress",
    lastSession: "2 days ago",
    needsAttention: false,
    gpa: 3.8,
    attendanceRate: 94,
  },
  {
    id: "STU002",
    name: "Karma Wangmo",
    email: "karma.wangmo@school.edu.bt",
    phone: "+975 17 23 45 78",
    grade: 10,
    section: "B",
    school: "Yangchenphug Higher Secondary School",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "in_progress",
    assessmentsTaken: 2,
    topCareer: null,
    careerMatch: null,
    planStatus: "not_started",
    lastSession: "1 week ago",
    needsAttention: true,
    gpa: 3.2,
    attendanceRate: 88,
  },
  {
    id: "STU003",
    name: "Pema Lhamo",
    email: "pema.lhamo@school.edu.bt",
    phone: "+975 17 34 56 89",
    grade: 11,
    section: "A",
    school: "Moiyul Goenpa HSS",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "pending",
    assessmentsTaken: 0,
    topCareer: null,
    careerMatch: null,
    planStatus: "not_started",
    lastSession: "Never",
    needsAttention: true,
    gpa: 2.9,
    attendanceRate: 76,
  },
  {
    id: "STU004",
    name: "Dorji Wangchuk",
    email: "dorji.wangchuk@school.edu.bt",
    phone: "+975 17 45 67 90",
    grade: 12,
    section: "A",
    school: "Pelkhil HSS",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "completed",
    assessmentsTaken: 5,
    topCareer: "Civil Engineer",
    careerMatch: 88,
    planStatus: "completed",
    lastSession: "3 days ago",
    needsAttention: false,
    gpa: 3.5,
    attendanceRate: 91,
  },
  {
    id: "STU005",
    name: "Sonam Yangdon",
    email: "sonam.yangdon@school.edu.bt",
    phone: "+975 17 56 78 01",
    grade: 10,
    section: "A",
    school: "Rigsum HSS",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "completed",
    assessmentsTaken: 3,
    topCareer: "Nurse",
    careerMatch: 85,
    planStatus: "in_progress",
    lastSession: "5 days ago",
    needsAttention: false,
    gpa: 3.6,
    attendanceRate: 96,
  },
  {
    id: "STU006",
    name: "Karma Tshering",
    email: "karma.tshering@school.edu.bt",
    phone: "+975 17 67 89 12",
    grade: 11,
    section: "B",
    school: "Thimphu HSS",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "in_progress",
    assessmentsTaken: 1,
    topCareer: null,
    careerMatch: null,
    planStatus: "not_started",
    lastSession: "2 weeks ago",
    needsAttention: true,
    gpa: 3.0,
    attendanceRate: 82,
  },
  {
    id: "STU007",
    name: "Tshering Yangdon",
    email: "tshering.yangdon@school.edu.bt",
    phone: "+975 17 78 91 23",
    grade: 12,
    section: "B",
    school: "Yangchenphug HSS",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "completed",
    assessmentsTaken: 4,
    topCareer: "Data Scientist",
    careerMatch: 90,
    planStatus: "completed",
    lastSession: "1 week ago",
    needsAttention: false,
    gpa: 3.9,
    attendanceRate: 97,
  },
  {
    id: "STU008",
    name: "Dorji Tshering",
    email: "dorji.tshering@school.edu.bt",
    phone: "+975 17 89 12 34",
    grade: 9,
    section: "A",
    school: "Moiyul Goenpa HSS",
    counselor: "Dr. Karma Wangchuk",
    assessmentStatus: "pending",
    assessmentsTaken: 0,
    topCareer: null,
    careerMatch: null,
    planStatus: "not_started",
    lastSession: "Never",
    needsAttention: true,
    gpa: null,
    attendanceRate: 85,
  },
];

const gradeOptions = ["All", "9", "10", "11", "12"];
const assessmentStatusOptions = ["All", "Completed", "In Progress", "Pending"];
const planStatusOptions = ["All", "Not Started", "In Progress", "Completed"];
const schoolOptions = ["All", "Thimphu HSS", "Yangchenphug HSS", "Moiyul Goenpa HSS", "Pelkhil HSS", "Rigsum HSS"];

export default function CounselorStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedAssessmentStatus, setSelectedAssessmentStatus] = useState("All");
  const [selectedPlanStatus, setSelectedPlanStatus] = useState("All");
  const [selectedSchool, setSelectedSchool] = useState("All");
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter students
  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = selectedGrade === "All" || student.grade.toString() === selectedGrade;
    const matchesAssessmentStatus = selectedAssessmentStatus === "All" ||
      student.assessmentStatus.toLowerCase().replace(" ", "_") === selectedAssessmentStatus.toLowerCase().replace(" ", "_");
    const matchesPlanStatus = selectedPlanStatus === "All" ||
      student.planStatus.toLowerCase().replace(" ", "_") === selectedPlanStatus.toLowerCase().replace(" ", "_");
    const matchesSchool = selectedSchool === "All" || student.school === selectedSchool;
    const matchesAttention = !showNeedsAttention || student.needsAttention;

    return matchesSearch && matchesGrade && matchesAssessmentStatus && matchesPlanStatus && matchesSchool && matchesAttention;
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

  // Stats calculations
  const totalStudents = mockStudents.length;
  const studentsCompletedAssessments = mockStudents.filter((s) => s.assessmentStatus === "completed").length;
  const studentsWithCareerPlans = mockStudents.filter((s) => s.planStatus === "completed").length;
  const studentsNeedingAttention = mockStudents.filter((s) => s.needsAttention).length;

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
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <Users className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
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
                <p className="text-2xl font-bold text-gray-900">{studentsCompletedAssessments}</p>
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
                <p className="text-2xl font-bold text-gray-900">{studentsWithCareerPlans}</p>
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
                <p className="text-2xl font-bold text-gray-900">{studentsNeedingAttention}</p>
                <p className="text-sm text-gray-500">Need Attention</p>
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

            {/* School Filter */}
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {schoolOptions.map((school) => (
                <option key={school} value={school}>
                  {school === "All" ? "All Schools" : school}
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
                  <span>Grade {student.grade} - Section {student.section}</span>
                </div>

                {/* School */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{student.school}</span>
                </div>

                {/* Contact */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{student.email}</span>
                </div>

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
      {paginatedStudents.length === 0 && (
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
              setSelectedSchool("All");
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
