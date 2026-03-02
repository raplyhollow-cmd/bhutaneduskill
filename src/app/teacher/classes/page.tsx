"use client";

import { logger } from "@/lib/logger";
/**
 * TEACHER CLASSES PAGE
 * View and manage all classes assigned to the teacher
 *
 * SMART UX FEATURES:
 * - QuickActionMenu for each class (View Students, View Homework, Take Attendance)
 */


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardGridSkeleton } from "@/components/ui/skeleton/card-skeleton";
import { ListSkeleton } from "@/components/ui/skeleton/list-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  ChevronDown,
  GraduationCap,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { TableQuickActions } from "@/components/shared/table-quick-actions";

interface TeacherClass {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYear?: string;
  subjectId?: string;
  schoolId?: string;
  teacherId?: string;
  roomNumber?: string;
  capacity?: number;
  schedule?: string;
  isActive?: boolean;
  status?: "active" | "archived";
  createdAt?: string;
  updatedAt?: string;
  teacher?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  school?: {
    id: string;
    name: string;
  };
  // Computed properties
  students?: number;
  attendanceRate?: number;
  homeworkCompletion?: number;
  averageScore?: number;
  topic?: string;
  nextClass?: string;
}

interface ClassStudent {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string | null;
  classGrade: number;
  section: string;
  className: string;
  classId: string;
  rollNumber?: string;
  attendanceSummary?: {
    present: number;
    absent: number;
    percentage: number | null;
    totalRecorded: number;
  };
  homeworkSummary?: {
    submitted: number;
    graded: number;
    pending: number;
    total: number;
  };
  enrolledAt?: string;
}

interface StudentsByClass {
  classId: string;
  className: string;
  grade: number;
  section: string;
  students: ClassStudent[];
}

type FilterStatus = "all" | "active" | "archived";

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<StudentsByClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<"name" | "students" | "schedule">("name");
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  // Fetch classes and students from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both classes and students data in parallel
        const [classesResponse, studentsResponse] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/teacher/students"),
        ]);

        if (!classesResponse.ok) {
          throw new Error(`Failed to fetch classes: ${classesResponse.statusText}`);
        }

        const classesData = await classesResponse.json();

        // Process students data if available
        // API returns { data: { students: [...], studentsByClass: [...] } }, so we need to access data.data
        let studentsData: { studentsByClass?: StudentsByClass[]; students?: ClassStudent[] } = {};
        if (studentsResponse.ok) {
          const rawData = await studentsResponse.json();
          studentsData = rawData.data || rawData;
        }

        // Process and enrich class data with real student counts
        // API returns { data: { classes: [...] } }, so we need to access data.data.classes
        const classesArray = classesData.data?.classes || classesData.classes || [];
        const processedClasses: TeacherClass[] = classesArray.map((cls: TeacherClass) => {
          // Find students for this class
          const classStudents = studentsData.studentsByClass?.find(
            (sbc) => sbc.classId === cls.id
          );

          // Calculate stats from real student data
          const classStudentList = classStudents?.students || [];
          const studentCount = classStudentList.length;

          // Calculate average attendance from student data
          const attendanceValues = classStudentList
            .map((s) => s.attendanceSummary?.percentage)
            .filter((p): p is number => p !== null && p !== undefined);
          const avgAttendance = attendanceValues.length > 0
            ? Math.round(attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length)
            : 0;

          // Calculate homework completion rate
          const totalHomework = classStudentList.reduce((sum, s) => sum + (s.homeworkSummary?.total || 0), 0);
          const submittedHomework = classStudentList.reduce((sum, s) => sum + (s.homeworkSummary?.submitted || 0), 0);
          const homeworkCompletion = totalHomework > 0
            ? Math.round((submittedHomework / totalHomework) * 100)
            : 0;

          return {
            ...cls,
            students: studentCount,
            attendanceRate: avgAttendance,
            homeworkCompletion: homeworkCompletion,
            averageScore: 0, // Would be calculated from assessment results
            topic: "Current topic", // Could be fetched from class topics/lessons
            nextClass: cls.schedule || "Schedule not set",
            status: cls.isActive !== false ? "active" : "archived",
          };
        });

        setClasses(processedClasses);
        setStudentsByClass(studentsData.studentsByClass || []);
      } catch (err) {
        logger.error("Error fetching classes data:", err);
        setError(err instanceof Error ? err.message : "Failed to load classes");
        setClasses([]);
        setStudentsByClass([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort classes
  const filteredClasses = classes
    .filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.section?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || cls.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "students") return (b.students || 0) - (a.students || 0);
      if (sortBy === "schedule") return (a.nextClass || "").localeCompare(b.nextClass || "");
      return 0;
    });

  // Toggle class expansion
  const toggleClassExpand = (classId: string) => {
    setExpandedClassId((prev) => (prev === classId ? null : classId));
  };

  // Get students for a specific class
  const getStudentsForClass = (classId: string): ClassStudent[] => {
    const classData = studentsByClass.find((sbc) => sbc.classId === classId);
    return classData?.students || [];
  };

  const stats = {
    totalClasses: classes.length,
    totalStudents: classes.reduce((sum, cls) => sum + (cls.students || 0), 0),
    avgAttendance: classes.length
      ? Math.round(classes.reduce((sum, cls) => sum + (cls.attendanceRate || 0), 0) / classes.length)
      : 0,
    avgCompletion: classes.length
      ? Math.round(classes.reduce((sum, cls) => sum + (cls.homeworkCompletion || 0), 0) / classes.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your classes and track student progress
          </p>
        </div>
        <Button
          style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          View Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Active this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgAttendance}%</div>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Homework Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.avgCompletion}%</div>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search classes or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: FilterStatus) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: "name" | "students" | "schedule") => setSortBy(v)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <CardGridSkeleton count={4} />

          {/* Filters Skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="h-11 w-full bg-muted rounded-lg animate-pulse" />
            </CardContent>
          </Card>

          {/* Classes List Skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-muted rounded-lg animate-pulse" />
            </CardHeader>
            <CardContent>
              <ListSkeleton items={8} showIcon showAction />
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">Error Loading Classes</p>
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
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "You don't have any classes assigned yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredClasses.map((cls) => {
            const classStudents = getStudentsForClass(cls.id);
            const isExpanded = expandedClassId === cls.id;

            return (
              <Card
                key={cls.id}
                className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Grade {cls.grade} - {cls.section}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cls.status === "active" ? "default" : "secondary"}>
                        {cls.status === "active" ? "Active" : "Archived"}
                      </Badge>
                      {/* Quick Action Menu */}
                      <TableQuickActions
                        actions={[
                          {
                            label: "View Students",
                            icon: <Users className="w-4 h-4" />,
                            onClick: () => window.location.assign(`/teacher/students?classId=${cls.id}`),
                          },
                          {
                            label: "View Homework",
                            icon: <FileText className="w-4 h-4" />,
                            onClick: () => window.location.assign(`/teacher/homework?classId=${cls.id}`),
                          },
                          {
                            label: "Take Attendance",
                            icon: <CheckCircle className="w-4 h-4" />,
                            onClick: () => window.location.assign(`/teacher/attendance?classId=${cls.id}`),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Class Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{cls.students || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{cls.roomNumber || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <Clock className="w-4 h-4" />
                      <span>{cls.nextClass}</span>
                    </div>
                  </div>

                  {/* Current Topic */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Current Topic</p>
                    <p className="text-sm font-medium text-gray-900">{cls.topic || "Not set"}</p>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Attendance</span>
                        <span className="font-medium text-gray-700">{cls.attendanceRate || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${cls.attendanceRate || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Homework</span>
                        <span className="font-medium text-gray-700">{cls.homeworkCompletion || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${cls.homeworkCompletion || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expandable Students List */}
                  <div className="border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-gray-700 hover:text-gray-900"
                      onClick={() => toggleClassExpand(cls.id)}
                    >
                      <span className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Students ({classStudents.length})
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </Button>

                    {isExpanded && classStudents.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                        {classStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-xs">
                                  {student.firstName?.charAt(0) || student.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">
                                  {student.rollNumber ? `Roll: ${student.rollNumber}` : `ID: ${student.id.slice(-6)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {student.attendanceSummary?.percentage ?? "--"}%
                                </p>
                                <p className="text-xs text-gray-400">Attendance</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {student.homeworkSummary?.submitted ?? 0}/{student.homeworkSummary?.total ?? 0}
                                </p>
                                <p className="text-xs text-gray-400">Homework</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isExpanded && classStudents.length === 0 && (
                      <div className="mt-3 text-center py-4 text-sm text-gray-500">
                        No students enrolled in this class yet.
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/teacher/homework/create?classId=${cls.id}`}>
                        <BookOpen className="w-4 h-4 mr-1" />
                        Homework
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/teacher/attendance?classId=${cls.id}`}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Attendance
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
