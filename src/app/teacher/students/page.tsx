/**
 * TEACHER STUDENTS PAGE
 * View all students across teacher's classes with filters
 */
"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  classGrade: number;
  section: string;
  rollNumber?: string;
  classId: string;
  className: string;
  attendanceRate?: number;
  homeworkCompletion?: number;
  lastAssessment?: string;
  needsAttention?: boolean;
}

interface ClassData {
  id: string;
  name: string;
  grade: number;
  section: string;
  subject?: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "class" | "attendance">("name");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch teacher's classes and students
        const response = await fetch("/api/teacher/students");
        if (response.ok) {
          const data = await response.json();
          setClasses(data.classes || []);
          setStudents(data.students || []);
          setFilteredStudents(data.students || []);
        } else {
          // Use mock data for now
          const mockClasses: ClassData[] = [
            { id: "c1", name: "Class 10 A", grade: 10, section: "A", subject: "Mathematics" },
            { id: "c2", name: "Class 10 B", grade: 10, section: "B", subject: "Mathematics" },
            { id: "c3", name: "Class 9 A", grade: 9, section: "A", subject: "Physics" },
            { id: "c4", name: "Class 8 A", grade: 8, section: "A", subject: "Mathematics" },
          ];

          const mockStudents: Student[] = [
            {
              id: "s1",
              firstName: "Tashi",
              lastName: "Dorji",
              email: "tashi.dorji@school.edu.bt",
              phone: "+975-17-123456",
              classGrade: 10,
              section: "A",
              rollNumber: "01",
              classId: "c1",
              className: "Class 10 A",
              attendanceRate: 95,
              homeworkCompletion: 88,
              lastAssessment: "RIASEC - AIR",
            },
            {
              id: "s2",
              firstName: "Karma",
              lastName: "Wangmo",
              email: "karma.wangmo@school.edu.bt",
              phone: "+975-17-234567",
              classGrade: 10,
              section: "A",
              rollNumber: "02",
              classId: "c1",
              className: "Class 10 A",
              attendanceRate: 82,
              homeworkCompletion: 75,
              lastAssessment: "Not started",
              needsAttention: true,
            },
            {
              id: "s3",
              firstName: "Pema",
              lastName: "Lhamo",
              email: "pema.lhamo@school.edu.bt",
              phone: "+975-17-345678",
              classGrade: 10,
              section: "B",
              rollNumber: "01",
              classId: "c2",
              className: "Class 10 B",
              attendanceRate: 91,
              homeworkCompletion: 92,
              lastAssessment: "RIASEC - SIE",
            },
            {
              id: "s4",
              firstName: "Dorji",
              lastName: "Wangchuk",
              email: "dorji.wangchuk@school.edu.bt",
              classGrade: 9,
              section: "A",
              rollNumber: "05",
              classId: "c3",
              className: "Class 9 A",
              attendanceRate: 78,
              homeworkCompletion: 65,
              lastAssessment: "MBTI - INFJ",
              needsAttention: true,
            },
            {
              id: "s5",
              firstName: "Sonam",
              lastName: "Choden",
              email: "sonam.choden@school.edu.bt",
              phone: "+975-17-456789",
              classGrade: 9,
              section: "A",
              rollNumber: "06",
              classId: "c3",
              className: "Class 9 A",
              attendanceRate: 98,
              homeworkCompletion: 100,
              lastAssessment: "RIASEC - CES",
            },
            {
              id: "s6",
              firstName: "Jigme",
              lastName: "Tenzin",
              email: "jigme.tenzin@school.edu.bt",
              classGrade: 8,
              section: "A",
              rollNumber: "03",
              classId: "c4",
              className: "Class 8 A",
              attendanceRate: 85,
              homeworkCompletion: 80,
              lastAssessment: "DISC - Steady",
            },
            {
              id: "s7",
              firstName: "Dechen",
              lastName: "Wangmo",
              email: "dechen.wangmo@school.edu.bt",
              phone: "+975-17-567890",
              classGrade: 8,
              section: "A",
              rollNumber: "04",
              classId: "c4",
              className: "Class 8 A",
              attendanceRate: 72,
              homeworkCompletion: 58,
              lastAssessment: "In progress",
              needsAttention: true,
            },
            {
              id: "s8",
              firstName: "Kinley",
              lastName: "Dorji",
              email: "kinley.dorji@school.edu.bt",
              classGrade: 10,
              section: "B",
              rollNumber: "03",
              classId: "c2",
              className: "Class 10 B",
              attendanceRate: 89,
              homeworkCompletion: 85,
              lastAssessment: "RIASEC - RIA",
            },
          ];

          setClasses(mockClasses);
          setStudents(mockStudents);
          setFilteredStudents(mockStudents);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
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
        >
          <Download className="w-4 h-4 mr-2" />
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
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
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
                      {student.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Last: {student.lastAssessment || "N/A"}</span>
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
                          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
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
    </div>
  );
}
