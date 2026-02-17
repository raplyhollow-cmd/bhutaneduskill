/**
 * SCHOOL ADMIN - CLASS DETAIL PAGE
 *
 * Features:
 * - View detailed class information
 * - Student roster with enrollment management
 * - Subjects and timetable
 * - Class teacher details
 * - Assign/remove students functionality
 */

import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { classes, users, enrollments, subjects, teacherAssignments, attendance, homework } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  ClipboardCheck,
  Mail,
  Phone,
  Download,
} from "lucide-react";
import Link from "next/link";

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

interface Teacher {
  id: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  email?: string;
}

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface DrizzleEnrollmentResult {
  id: string;
  studentId: string;
  rollNumber?: string;
  status: string;
  section?: string;
  academicYear: string;
  enrollmentDate: string;
  classId: string;
  createdAt: Date;
  updatedAt: Date;
  student: Student[];
}

interface DrizzleTeacherAssignmentResult {
  id: string;
  teacherId: string;
  classId: string;
  subjectId?: string;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
  teacher: Teacher[];
}

interface HomeworkItem {
  id: string;
  title: string;
  dueDate: string | Date;
  isPublished: boolean;
}

interface ClassInfo {
  id: string;
  grade: number;
  section: string;
  academicYear: string;
  teacherId: string;
  schoolId: string;
}

async function getClassData(classId: string) {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Get class details
  const classInfo = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
  }) as ClassInfo | null;

  if (!classInfo) {
    return null;
  }

  // Get class teacher
  const classTeacher = await db.query.users.findFirst({
    where: eq(users.id, classInfo.teacherId),
  }) as Teacher | null;

  // Get enrolled students
  const enrollmentList = await db.query.enrollments.findMany({
    where: and(
      eq(enrollments.classId, classId),
      eq(enrollments.status, "active")
    ),
    with: {
      student: true,
    },
    orderBy: [enrollments.rollNumber],
  }) as DrizzleEnrollmentResult[];

  // Get subjects for this grade
  const gradeSubjects = await db.query.subjects.findMany({
    where: eq(subjects.grade, classInfo.grade),
  });

  // Get other teacher assignments
  const otherTeachers = await db.query.teacherAssignments.findMany({
    where: and(
      eq(teacherAssignments.classId, classId),
      eq(teacherAssignments.isActive, true)
    ),
    with: {
      teacher: true,
    },
  }) as DrizzleTeacherAssignmentResult[];

  // Get recent homework for this class
  const recentHomework = await db.query.homework.findMany({
    where: eq(homework.classId, classId),
    orderBy: [desc(homework.createdAt)],
    limit: 5,
  }) as HomeworkItem[];

  // Get attendance summary for today
  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = await db.query.attendance.findMany({
    where: eq(attendance.classId, classId),
  });

  const todayStats = {
    present: todayAttendance.filter((a) => a.status === "present").length,
    absent: todayAttendance.filter((a) => a.status === "absent").length,
    total: todayAttendance.length,
  };

  // Get available students (not enrolled in this class but in same grade)
  // Note: Disable ts-expect for Drizzle ORM query results
  const availableStudents = await db.query.users.findMany({
    where: eq(users.type, "student"),
  }) as Student[];

  return {
    classInfo,
    classTeacher,
    enrolledStudents: enrollmentList,
    gradeSubjects,
    otherTeachers,
    recentHomework,
    todayStats,
    availableStudents,
  };
}

export default async function ClassDetailPage({ params, searchParams }: ClassDetailPageProps) {
  const { userId } = await auth();
  if (!userId) {
    return <div>Please sign in to access this page.</div>;
  }

  const { id } = await params;
  const data = await getClassData(id);

  if (!data) {
    notFound();
  }

  const {
    classInfo,
    classTeacher,
    enrolledStudents,
    gradeSubjects,
    otherTeachers,
    recentHomework,
    todayStats,
    availableStudents,
  } = data;

  const { page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const studentsPerPage = 10;
  const totalPages = Math.ceil(enrolledStudents.length / studentsPerPage);
  const paginatedStudents = enrolledStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  // Filter available students (those not in this class)
  const enrolledStudentIds = enrolledStudents.map((e) => e.studentId);
  const studentsNotInClass = availableStudents.filter(
    (s) => !enrolledStudentIds.includes(s.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/school-admin/classes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grade {classInfo.grade} - Section {classInfo.section}</h1>
            <p className="text-gray-500">Class ID: {classInfo.id} | Academic Year: {classInfo.academicYear}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Class
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{enrolledStudents.length}</p>
                <p className="text-sm text-gray-500">Enrolled Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{gradeSubjects.length}</p>
                <p className="text-sm text-gray-500">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayStats.present}</p>
                <p className="text-sm text-gray-500">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{recentHomework.length}</p>
                <p className="text-sm text-gray-500">Active Homework</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Class Details */}
        <div className="space-y-6">
          {/* Class Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Class Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Grade</p>
                <p className="font-medium text-gray-900">{classInfo.grade}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Section</p>
                <p className="font-medium text-gray-900">{classInfo.section}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Academic Year</p>
                <p className="font-medium text-gray-900">{classInfo.academicYear}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Room</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">Room {classInfo.grade}0{classInfo.section === "A" ? "1" : classInfo.section === "B" ? "2" : "3"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Class Teacher */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Class Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classTeacher ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {(classTeacher.firstName && classTeacher.firstName[0]) || ""}{(classTeacher.lastName && classTeacher.lastName[0]) || ""}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{classTeacher.firstName || ""} {classTeacher.lastName || ""}</p>
                    <p className="text-sm text-gray-500">{classTeacher.employeeId || "Teacher"}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/school-admin/teachers/${classTeacher.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm text-gray-500">No class teacher assigned</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Assign Teacher
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Subjects
              </CardTitle>
              <CardDescription>Grade {classInfo.grade} curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              {gradeSubjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gradeSubjects.map((subject) => (
                    <Badge key={subject.id} variant="outline" className="px-3 py-1">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No subjects configured for this grade</p>
              )}
              <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                <Link href="/school-admin/subjects">Manage Subjects</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Other Teachers */}
          {otherTeachers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Other Teachers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {otherTeachers.map((assignment) => {
                  const teacher = assignment.teacher[0]; // teacher is an array from Drizzle query
                  return (
                    <div key={assignment.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                        {teacher?.firstName?.[0]}{teacher?.lastName?.[0] || ""}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{teacher?.firstName || ""} {teacher?.lastName || ""}</p>
                        <p className="text-xs text-gray-500 capitalize">{assignment.role}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Student Roster */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Roster */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Student Roster
                  </CardTitle>
                  <CardDescription>
                    {enrolledStudents.length} student{enrolledStudents.length !== 1 ? "s" : ""} enrolled
                  </CardDescription>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Student List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">No.</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Attendance</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((enrollment, index) => (
                      <tr key={enrollment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">{enrollment.rollNumber || (currentPage - 1) * studentsPerPage + index + 1}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                              <span className="text-violet-600 font-medium text-sm">
                                {(enrollment.student[0]?.firstName?.[0] ?? '') + (enrollment.student[0]?.lastName?.[0] ?? '')}
                              </span>
                            </div>
                            <div>
                              <Link
                                href={`/school-admin/students/${enrollment.studentId}`}
                                className="font-medium text-gray-900 hover:text-violet-600"
                              >
                                {enrollment.student[0]?.firstName ?? ''} {enrollment.student[0]?.lastName ?? ''}
                              </Link>
                              <p className="text-sm text-gray-500">{enrollment.student[0]?.email || "No email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 text-sm">
                            {enrollment.student[0]?.phone && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone className="w-3 h-3" />
                                {enrollment.student[0].phone}
                              </div>
                            )}
                            {enrollment.student[0]?.email && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Mail className="w-3 h-3" />
                                {enrollment.student[0].email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                            Present
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/school-admin/students/${enrollment.studentId}`}>
                                <Users className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <UserMinus className="w-4 h-4" />
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
                    Showing {(currentPage - 1) * studentsPerPage + 1} to{" "}
                    {Math.min(currentPage * studentsPerPage, enrolledStudents.length)} of {enrolledStudents.length}{" "}
                    students
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      asChild={currentPage > 1}
                    >
                      {currentPage > 1 ? (
                        <Link href={`/school-admin/classes/${id}?page=${currentPage - 1}`}>
                          <ChevronLeft className="w-4 h-4" />
                        </Link>
                      ) : (
                        <ChevronLeft className="w-4 h-4" />
                      )}
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
                          asChild
                        >
                          <Link href={`/school-admin/classes/${id}?page=${pageNum}`}>
                            {pageNum}
                          </Link>
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      asChild={currentPage < totalPages}
                    >
                      {currentPage < totalPages ? (
                        <Link href={`/school-admin/classes/${id}?page={currentPage + 1}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Homework */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Recent Homework
              </CardTitle>
              <CardDescription>Latest assignments for this class</CardDescription>
            </CardHeader>
            <CardContent>
              {recentHomework.length > 0 ? (
                <div className="space-y-3">
                  {recentHomework.map((hw) => (
                    <div key={hw.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{hw.title}</p>
                        <p className="text-xs text-gray-500">
                          Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "No deadline"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={hw.isPublished ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}
                          variant="outline"
                        >
                          {hw.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/school-admin/homework`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No homework assigned yet</p>
                  <Button variant="outline" className="mt-4" size="sm" asChild>
                    <Link href="/school-admin/homework">Create Homework</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timetable Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Class timetable overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-24 font-medium text-gray-700">{day}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>8:00 AM - 2:00 PM</span>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                      6 Periods
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                View Full Timetable
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Actions Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Email All Students
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Roster
              </Button>
              <Button variant="outline">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Take Attendance
              </Button>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700" asChild>
              <Link href="/school-admin/homework">
                <BookOpen className="w-4 h-4 mr-2" />
                Assign Homework
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
