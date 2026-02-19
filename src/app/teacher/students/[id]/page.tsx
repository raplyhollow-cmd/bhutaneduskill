/**
 * TEACHER - STUDENT DETAIL PAGE
 *
 * Features:
 * - Comprehensive student profile view
 * - Academic performance tracking
 * - Attendance and homework history
 * - Parent/guardian contact information
 * - Quick actions for teacher
 */

import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Target,
  TrendingUp,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  BookOpen,
  MessageSquare,
  Download,
  Users,
} from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { CrossPortalLinks } from "@/components/shared/cross-portal-links";
import { db } from "@/lib/db";
import { users, classes, enrollments, attendance, homeworkSubmissions, homework } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string | null;
  profilePicture?: string | null;
  dateOfBirth?: string | null;
  grade?: number | null;
  section?: string | null;
  rollNumber?: string | null;
  address?: string | null;
  parentContact?: string | null;
  parentPhone?: string | null;
  emergencyContact?: string | null;
  parentId?: string | null;
  enrollmentDate?: string | null;
}

interface ClassEnrollment {
  id: string;
  className: string;
  grade: number;
  section: string;
  rollNumber?: string | null;
  enrollmentDate: string | null;
}

async function getStudentData(studentId: string, teacherUserId: string) {
  // Get student
  const studentRecords = await db
    .select()
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (studentRecords.length === 0) {
    return null;
  }

  const student = studentRecords[0] as StudentData;

  // Get teacher's classes
  const teacherClasses = await db.query.classes.findMany({
    where: eq(classes.teacherId, teacherUserId),
    columns: { id: true },
  });

  const teacherClassIds = teacherClasses.map((c) => c.id);

  // Check if student is enrolled in teacher's classes
  const enrollmentRecords = await db.query.enrollments.findMany({
    where: and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ),
    with: {
      class: true,
    },
  });

  // Filter to only teacher's classes and transform to ClassEnrollment
  // Note: e.class might be an array due to Drizzle typing, handle both cases
  const validEnrollments = enrollmentRecords.filter((e) => {
    if (!e.class) return false;
    const classArray = Array.isArray(e.class) ? e.class : [e.class];
    return classArray.some((c: { id: string }) => c.id && teacherClassIds.includes(c.id));
  });

  if (validEnrollments.length === 0) {
    return null; // Student not in teacher's class
  }

  const classEnrollments: ClassEnrollment[] = validEnrollments.map((e) => {
    const classArray = Array.isArray(e.class) ? e.class : [e.class];
    const cls = classArray[0] as { id: string; name: string; grade: number; section: string };
    return {
      id: e.id,
      className: cls.name,
      grade: cls.grade,
      section: cls.section,
      rollNumber: e.rollNumber,
      enrollmentDate: e.enrollmentDate,
    };
  });

  const classInfo = (() => {
    const classArray = Array.isArray(validEnrollments[0].class) ? validEnrollments[0].class : [validEnrollments[0].class];
    return classArray[0] as { id: string; name: string; grade: number; section: string };
  })();

  // Get attendance data
  const attendanceRecords = await db.query.attendance.findMany({
    where: eq(attendance.studentId, studentId),
    orderBy: [desc(attendance.date)],
    limit: 30,
  });

  const presentDays = attendanceRecords.filter((a) => a.status === "present").length;
  const absentDays = attendanceRecords.filter((a) => a.status === "absent").length;
  const lateDays = attendanceRecords.filter((a) => a.status === "late").length;
  const attendancePercentage = attendanceRecords.length > 0
    ? Math.round((presentDays / attendanceRecords.length) * 100)
    : null;

  // Get homework submissions
  const hwSubmissions = await db.query.homeworkSubmissions.findMany({
    where: eq(homeworkSubmissions.studentId, studentId),
    with: {
      homework: true,
    },
  });

  const submittedCount = hwSubmissions.filter((h) => h.status === "submitted").length;
  const gradedCount = hwSubmissions.filter((h) => h.status === "graded").length;
  const pendingCount = hwSubmissions.filter((h) => h.status === "draft").length;
  const lateSubmissions = hwSubmissions.filter((h) => {
    if (!h.submittedAt || !h.homework) return false;
    const homeworkArray = Array.isArray(h.homework) ? h.homework : [h.homework];
    const hw = homeworkArray[0] as { dueDate?: string | Date } | undefined;
    return hw?.dueDate && new Date(h.submittedAt) > new Date(hw.dueDate);
  }).length;

  // Get parent info
  let parentInfo: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } = {
    name: student.parentContact || null,
    email: null,
    phone: student.parentPhone || student.emergencyContact || null,
  };

  if (student.parentId) {
    const parentRecords = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, student.parentId))
      .limit(1);

    if (parentRecords.length > 0) {
      const parent = parentRecords[0];
      parentInfo.name = parentInfo.name || `${parent.firstName || ""} ${parent.lastName || ""}`.trim() || null;
      parentInfo.email = parent.email;
      parentInfo.phone = parentInfo.phone || parent.phone;
    }
  }

  return {
    student,
    classInfo: {
      id: classInfo.id,
      name: classInfo.name,
      grade: classInfo.grade,
      section: classInfo.section,
    },
    enrollment: {
      rollNumber: classEnrollments[0].rollNumber,
      enrollmentDate: classEnrollments[0].enrollmentDate,
    },
    attendance: {
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      percentage: attendancePercentage,
      total: attendanceRecords.length,
      records: attendanceRecords.slice(0, 10),
    },
    homework: {
      submitted: submittedCount,
      graded: gradedCount,
      pending: pendingCount,
      late: lateSubmissions,
      total: hwSubmissions.length,
      recentSubmissions: hwSubmissions.slice(0, 5),
    },
    parentInfo,
  };
}

export default async function TeacherStudentDetailPage({ params }: PageProps) {
  // Auth check
  const authResult = await requireAuth(["teacher"]);
  if ("error" in authResult) {
    // On auth error, redirect to sign-in
    const { redirect } = await import("next/navigation");
    redirect("/sign-in");
  }

  // At this point, authResult is guaranteed to be the success type
  const userId = (authResult as { user: { id: string }; userId: string }).userId;
  const { id } = await params;

  const data = await getStudentData(id, userId);

  if (!data) {
    notFound();
  }

  const { student, classInfo, enrollment, attendance, homework, parentInfo } = data;

  const calculateAge = (dateOfBirth: string | null | undefined) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const studentAge = calculateAge(student.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/students">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-500">Student ID: {student.id.substring(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button
            className="gap-2"
            style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
          >
            <MessageSquare className="w-4 h-4" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{attendance.present}</p>
                <p className="text-xs text-gray-500">Present Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: (attendance.percentage || 0) >= 80
                    ? "rgb(34 197 94 / 0.1)"
                    : (attendance.percentage || 0) >= 60
                    ? "rgb(249 115 22 / 0.1)"
                    : "rgb(239 68 68 / 0.1)",
                }}
              >
                <Target
                  className="w-5 h-5"
                  style={{
                    color: (attendance.percentage || 0) >= 80
                      ? "rgb(34 197 94)"
                      : (attendance.percentage || 0) >= 60
                      ? "rgb(249 115 22)"
                      : "rgb(239 68 68)",
                  }}
                />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{attendance.percentage || 0}%</p>
                <p className="text-xs text-gray-500">Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{homework.graded}</p>
                <p className="text-xs text-gray-500">Graded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{homework.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgb(59 130 246 / 0.1), rgb(37 99 235 / 0.1))" }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: "rgb(37 99 235)" }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{homework.total}</p>
                <p className="text-xs text-gray-500">Total HW</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Portal Navigation */}
      <CrossPortalLinks
        studentId={id}
        userType="teacher"
        showLinks={["assessment", "career", "attendance", "homework", "progress", "results"]}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                >
                  {student.firstName?.[0]}
                  {student.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Grade {classInfo.grade} - Section {classInfo.section}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {student.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${student.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {student.email}
                    </a>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${student.phone}`} className="text-gray-700">
                      {student.phone}
                    </a>
                  </div>
                )}
                {student.dateOfBirth && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {new Date(student.dateOfBirth).toLocaleDateString()}
                      {studentAge !== null && ` (${studentAge} years)`}
                    </span>
                  </div>
                )}
                {enrollment.rollNumber && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">ID:</span>
                    <span className="text-gray-700">{enrollment.rollNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Class Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Class Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Class</p>
                <p className="font-medium text-gray-900">{classInfo.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Grade & Section</p>
                <p className="font-medium text-gray-900">
                  Grade {classInfo.grade} - Section {classInfo.section}
                </p>
              </div>
              {enrollment.enrollmentDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Enrollment Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parentInfo.name && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Guardian Name</p>
                  <p className="font-medium text-gray-900">{parentInfo.name}</p>
                </div>
              )}
              {parentInfo.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${parentInfo.phone}`} className="text-blue-600 hover:underline">
                    {parentInfo.phone}
                  </a>
                </div>
              )}
              {parentInfo.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a
                    href={`mailto:${parentInfo.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {parentInfo.email}
                  </a>
                </div>
              )}
              {!parentInfo.name && !parentInfo.phone && !parentInfo.email && (
                <p className="text-sm text-gray-500 italic">No guardian information available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Performance & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Overview
              </CardTitle>
              <CardDescription>Recent attendance record</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{attendance.present}</p>
                  <p className="text-xs text-gray-600">Present</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{attendance.absent}</p>
                  <p className="text-xs text-gray-600">Absent</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{attendance.late}</p>
                  <p className="text-xs text-gray-600">Late</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{attendance.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>

              {attendance.records.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Attendance</h3>
                  <div className="space-y-2">
                    {attendance.records.map((record, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            record.status === "present"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : record.status === "absent"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Homework Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Homework Overview
              </CardTitle>
              <CardDescription>Homework submission status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{homework.total}</p>
                  <p className="text-xs text-gray-600">Assigned</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{homework.graded}</p>
                  <p className="text-xs text-gray-600">Graded</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{homework.pending}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{homework.late}</p>
                  <p className="text-xs text-gray-600">Late</p>
                </div>
              </div>

              {homework.recentSubmissions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Submissions</h3>
                  <div className="space-y-2">
                    {homework.recentSubmissions.map((sub, index: number) => {
                      // Extract homework title - homework can be an array or single object
                      const homeworkData = sub.homework;
                      const homeworkArray = Array.isArray(homeworkData) ? homeworkData : homeworkData ? [homeworkData] : [];
                      const firstHomework = homeworkArray[0] as { title?: string } | undefined;
                      const homeworkTitle = firstHomework?.title || "Homework";

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {homeworkTitle}
                            </p>
                            <p className="text-xs text-gray-500">
                              {sub.submittedAt
                                ? new Date(sub.submittedAt).toLocaleDateString()
                                : "Not submitted"}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              sub.status === "graded"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : sub.status === "submitted"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Needs Attention Alert */}
          {((attendance.percentage ?? 100) < 75 || homework.late > 2) && (
            <Card
              className="border-orange-200"
              style={{ background: "linear-gradient(to right, rgb(249 115 22 / 0.1), rgb(234 88 12 / 0.1))" }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Needs Attention</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {attendance.percentage !== null && attendance.percentage < 75 && (
                        <>Low attendance rate ({attendance.percentage}%). </>
                      )}
                      {homework.late > 2 && (
                        <>Multiple late homework submissions ({homework.late}). </>
                      )}
                      Consider reaching out to the student or guardian.
                    </p>
                    <div className="flex gap-2 mt-3">
                      {student.email && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`mailto:${student.email}`}>Email Student</a>
                        </Button>
                      )}
                      {parentInfo.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          style={{ background: "white" }}
                          asChild
                        >
                          <a href={`mailto:${parentInfo.email}`}>Email Guardian</a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
