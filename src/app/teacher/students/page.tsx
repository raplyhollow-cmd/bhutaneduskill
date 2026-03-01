"use client";

import { logger } from "@/lib/logger";
/**
 * TEACHER STUDENTS PAGE
 * View all students across teacher's classes with filters
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  GraduationCap,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Eye,
  Filter,
  Download,
  Loader2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePicture?: string;
  classGrade: number;
  section: string;
  className: string;
  classId: string;
  rollNumber?: string;
  attendanceSummary: {
    present: number;
    absent: number;
    percentage: number | null;
    totalRecorded: number;
  };
  homeworkSummary: {
    submitted: number;
    graded: number;
    pending: number;
    total: number;
  };
  enrolledAt?: string;
  parentGuardianName?: string | null;
  parentGuardianPhone?: string | null;
  parentGuardianEmail?: string | null;
}

interface StudentWithAttention extends Student {
  needsAttention?: boolean;
  attendanceRate: number;
  homeworkCompletion: number;
}

interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  subject?: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<StudentWithAttention[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithAttention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "class" | "attendance">("name");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithAttention | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch teacher's classes and students
        const response = await fetch("/api/teacher/students");
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        const data = result.data || {}; // Access nested data from successResponse

        // Process API data to match our interface
        const apiClasses: ClassData[] = (data.studentsByClass || []).map((cls: {
          classId: string;
          className: string;
          grade: number;
          section: string;
        }) => ({
          id: cls.classId,
          name: cls.className,
          grade: cls.grade,
          section: cls.section,
          subject: undefined,
        }));

        const apiStudents: StudentWithAttention[] = (data.students || []).map((s: Student) => {
          // Calculate needsAttention based on attendance and homework
          const attendanceRate = s.attendanceSummary?.percentage ?? 100;
          const homeworkCompletion = s.homeworkSummary?.total > 0
            ? Math.round((s.homeworkSummary.graded / s.homeworkSummary.total) * 100)
            : 100;

          return {
            ...s,
            attendanceRate,
            homeworkCompletion,
            needsAttention: (attendanceRate < 80) || (homeworkCompletion < 70),
          };
        });

        setClasses(apiClasses.length > 0 ? apiClasses : []);
        setStudents(apiStudents);
        setFilteredStudents(apiStudents);
      } catch (err) {
        logger.error("Error fetching student data:", err);
        setError(err instanceof Error ? err.message : "Failed to load students");
        // Set empty arrays on error
        setClasses([]);
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter students
  useEffect(() => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.rollNumber?.includes(query)
      );
    }

    // Class filter
    if (selectedClass !== "all") {
      filtered = filtered.filter((s) => s.classId === selectedClass);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy === "class") {
        if (a.classGrade !== b.classGrade) return a.classGrade - b.classGrade;
        return a.section.localeCompare(b.section);
      } else if (sortBy === "attendance") {
        return (a.attendanceRate || 0) - (b.attendanceRate || 0);
      }
      return 0;
    });

    setFilteredStudents(filtered);
  }, [students, searchQuery, selectedClass, sortBy]);

  // Export to CSV
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const headers = ["Name", "Email", "Class", "Roll Number", "Attendance %", "Homework %", "Guardian Name", "Guardian Phone", "Guardian Email"];
      const rows = filteredStudents.map((s) => [
        `${s.firstName} ${s.lastName}`,
        s.email || "",
        s.className,
        s.rollNumber || "",
        String(s.attendanceRate || 0),
        String(s.homeworkCompletion || 0),
        s.parentGuardianName || "",
        s.parentGuardianPhone || "",
        s.parentGuardianEmail || "",
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } catch (err) {
      logger.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Stats
  const totalStudents = students.length;
  const needsAttentionCount = students.filter((s) => s.needsAttention).length;
  const avgAttendance = students.length
    ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / students.length)
    : 0;

  const subjects = Array.from(new Set(classes.map((c) => c.subject).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">View and manage students across your classes</p>
        </div>
        <Button
          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
          onClick={handleExport}
          disabled={isExporting || filteredStudents.length === 0}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export List
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgAttendance}%</p>
                <p className="text-sm text-gray-600">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{needsAttentionCount}</p>
                <p className="text-sm text-gray-600">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                <p className="text-sm text-gray-600">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Class Filter */}
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full lg:w-[200px] h-11">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subject Filter */}
            {subjects.length > 0 && (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full lg:w-[200px] h-11">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: "name" | "class" | "attendance") => setSortBy(v)}>
              <SelectTrigger className="w-full lg:w-[180px] h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading students...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">Error Loading Students</p>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No students found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className={`hover:shadow-md transition-shadow ${
                student.needsAttention ? "border-orange-200 bg-orange-50/30" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0"
                    style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                  >
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {student.firstName} {student.lastName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {student.className}
                          </Badge>
                          {student.rollNumber && (
                            <span className="text-sm text-gray-600">Roll: {student.rollNumber}</span>
                          )}
                          {student.needsAttention && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Needs Attention
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Attendance</p>
                          <p
                            className={`font-semibold ${
                              (student.attendanceRate || 0) >= 80
                                ? "text-green-600"
                                : (student.attendanceRate || 0) >= 60
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {student.attendanceRate || 0}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Homework</p>
                          <p
                            className={`font-semibold ${
                              (student.homeworkCompletion || 0) >= 80
                                ? "text-green-600"
                                : (student.homeworkCompletion || 0) >= 60
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {student.homeworkCompletion || 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Actions */}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      {student.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">{student.email}</span>
                        </div>
                      )}
                      {student.parentGuardianPhone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          <span>Guardian: {student.parentGuardianPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>
                          {student.homeworkSummary?.graded ?? 0}/{student.homeworkSummary?.total ?? 0} homework graded
                        </span>
                      </div>

                      <div className="ml-auto flex items-center gap-2">
                        <Link href={`/teacher/students/${student.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Dialog */}
      <Dialog open={selectedStudent !== null} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </DialogTitle>
            <DialogDescription>
              Student and guardian contact details for {selectedStudent?.firstName} {selectedStudent?.lastName}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 pt-4">
              {/* Student Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Student</p>
                <p className="font-medium text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <div className="flex flex-wrap gap-4 mt-3">
                  {selectedStudent.email && (
                    <a
                      href={`mailto:${selectedStudent.email}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedStudent.email}
                    </a>
                  )}
                  {selectedStudent.rollNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-gray-400">ID:</span>
                      {selectedStudent.rollNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Guardian Info */}
              {(selectedStudent.parentGuardianName || selectedStudent.parentGuardianPhone || selectedStudent.parentGuardianEmail) && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Parent / Guardian</p>
                  {selectedStudent.parentGuardianName && (
                    <p className="font-medium text-gray-900">{selectedStudent.parentGuardianName}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-3">
                    {selectedStudent.parentGuardianPhone && (
                      <a
                        href={`tel:${selectedStudent.parentGuardianPhone}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {selectedStudent.parentGuardianPhone}
                      </a>
                    )}
                    {selectedStudent.parentGuardianEmail && (
                      <a
                        href={`mailto:${selectedStudent.parentGuardianEmail}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {selectedStudent.parentGuardianEmail}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Class Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Class:</span>
                <Badge variant="outline">{selectedStudent.className}</Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {selectedStudent.email && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = `mailto:${selectedStudent.email}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Student
                  </Button>
                )}
                {selectedStudent.parentGuardianEmail && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = `mailto:${selectedStudent.parentGuardianEmail}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Guardian
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
