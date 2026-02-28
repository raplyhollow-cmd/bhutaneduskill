/**
 * SCHOOL ADMIN - STUDENT DETAIL PAGE
 *
 * Features:
 * - View detailed student profile
 * - Personal information, academics, attendance, assessments, fees, documents
 * - Edit/delete student actions
 */

import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, enrollments, classes, attendance, studentFees, feePayments, assessments, riasecResults, examResultsEnhanced, homeworkSubmissions, homework } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardGridSkeleton } from "@/components/ui/skeleton/card-skeleton";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Download,
  Award,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  Folder,
  File,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

type HomeworkSubmission = {
  id: string;
  homework?: {
    title: string;
  } | null;
  submittedAt?: Date | null;
  score?: number | null;
  maxScore?: number | null;
};

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getStudentData(studentId: string) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return null;
  }
  const { userId } = authResult;

  // Get student basic info using db.select
  const studentResult = await db
    .select()
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  const student = studentResult[0];

  if (!student || student.type !== "student") {
    return null;
  }

  // Get enrollment with class details using explicit join
  const enrollmentResult = await db
    .select({
      id: enrollments.id,
      studentId: enrollments.studentId,
      classId: enrollments.classId,
      rollNumber: enrollments.rollNumber,
      status: enrollments.status,
      section: enrollments.section,
      academicYear: enrollments.academicYear,
      enrollmentDate: enrollments.enrollmentDate,
      className: classes.name,
      grade: classes.grade,
    })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .where(and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active")
    ))
    .limit(1);

  const enrollment = enrollmentResult[0] ? {
    ...enrollmentResult[0],
    class: enrollmentResult[0] ? {
      id: enrollmentResult[0].classId,
      name: enrollmentResult[0].className,
      grade: enrollmentResult[0].grade,
    } : null,
  } : null;

  // Get attendance stats (last 30 days)
  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(eq(attendance.studentId, studentId))
    .orderBy(desc(attendance.date))
    .limit(30);

  const attendanceStats = {
    present: attendanceRecords.filter((a) => a.status === "present").length,
    absent: attendanceRecords.filter((a) => a.status === "absent").length,
    late: attendanceRecords.filter((a) => a.status === "late").length,
    excused: attendanceRecords.filter((a) => a.status === "excused").length,
    total: attendanceRecords.length,
    percentage: attendanceRecords.length > 0
      ? Math.round((attendanceRecords.filter((a) => a.status === "present" || a.status === "late").length / attendanceRecords.length) * 100)
      : 0,
  };

  // Get fee information
  const feeRecords = await db
    .select()
    .from(studentFees)
    .where(eq(studentFees.studentId, studentId))
    .orderBy(desc(studentFees.createdAt));

  // Get payments for each fee
  const feeIds = feeRecords.map(f => f.id);
  const paymentsMap = new Map<string, typeof feePayments.$inferSelect[]>();

  if (feeIds.length > 0) {
    const payments = await db
      .select()
      .from(feePayments)
      .where(sql`${feePayments.studentFeeId} = ANY(${feeIds})`);

    payments.forEach(p => {
      const feeId = (p as { studentFeeId?: string }).studentFeeId;
      if (feeId && !paymentsMap.has(feeId)) {
        paymentsMap.set(feeId, []);
      }
      if (feeId) {
        paymentsMap.get(feeId)!.push(p);
      }
    });
  }

  const feeRecordsWithPayments = feeRecords.map(f => ({
    ...f,
    payments: paymentsMap.get(f.id) || [],
  }));

  const totalFees = feeRecords.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
  const totalPaid = feeRecords.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const totalPending = totalFees - totalPaid;

  // Get assessment results - using direct select since riasecResults is in a separate table
  const assessmentResults = await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, studentId))
    .orderBy(desc(assessments.completedAt));

  // Get exam results
  const examResults = await db
    .select()
    .from(examResultsEnhanced)
    .where(eq(examResultsEnhanced.studentId, studentId))
    .orderBy(desc(examResultsEnhanced.examYear));

  // Get homework submissions with homework details
  const submissionsResult = await db
    .select({
      submissionId: homeworkSubmissions.id,
      studentId: homeworkSubmissions.studentId,
      homeworkId: homeworkSubmissions.homeworkId,
      submittedAt: homeworkSubmissions.submittedAt,
      score: homeworkSubmissions.score,
      feedback: homeworkSubmissions.feedback,
      homeworkTitle: homework.title,
      homeworkDueDate: homework.dueDate,
    })
    .from(homeworkSubmissions)
    .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
    .where(eq(homeworkSubmissions.studentId, studentId))
    .orderBy(desc(homeworkSubmissions.submittedAt))
    .limit(10);

  const homeworkSubs = submissionsResult.map(s => ({
    id: s.submissionId,
    studentId: s.studentId,
    homeworkId: s.homeworkId,
    submittedAt: s.submittedAt,
    score: s.score,
    feedback: s.feedback,
    homework: {
      id: s.homeworkId,
      title: s.homeworkTitle,
      dueDate: s.homeworkDueDate,
    },
  }));

  return {
    student,
    enrollment,
    attendanceStats,
    attendanceRecords: attendanceRecords.slice(0, 10),
    feeRecords: feeRecordsWithPayments,
    feeStats: {
      totalFees,
      totalPaid,
      totalPending,
      feeStatus: totalPending === 0 ? "paid" : totalPaid > 0 ? "partial" : "pending",
    },
    assessmentResults,
    examResults,
    homeworkSubmissions: homeworkSubs,
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-1/3 animate-pulse rounded-lg bg-muted duration-500" />
      <CardGridSkeleton count={4} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="h-64 animate-pulse rounded-lg bg-muted duration-500" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="h-80 animate-pulse rounded-lg bg-muted duration-500" />
        </div>
      </div>
    </div>
  );
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return <div>{authResult.error}</div>;
  }
  const { userId } = authResult;

  const { id } = await params;
  const data = await getStudentData(id);

  if (!data) {
    notFound();
  }

  const {
    student,
    enrollment,
    attendanceStats,
    attendanceRecords,
    feeRecords,
    feeStats,
    assessmentResults,
    examResults,
    homeworkSubmissions,
  } = data;

  const getFeeStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-green-100 text-green-700 border-green-200",
      partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
      pending: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getAttendanceStatusBadge = (status: string) => {
    const styles = {
      present: "bg-green-100 text-green-700 border-green-200",
      absent: "bg-red-100 text-red-700 border-red-200",
      late: "bg-yellow-100 text-yellow-700 border-yellow-200",
      excused: "bg-blue-100 text-blue-700 border-blue-200",
      sick_leave: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const calculateAge = (dateOfBirth: string | null) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/school-admin/students">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
            <p className="text-gray-500">Student ID: {student.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats.percentage}%</p>
                <p className="text-sm text-gray-500">Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Nu. {feeStats.totalPaid.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Fees Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{assessmentResults.length}</p>
                <p className="text-sm text-gray-500">Assessments</p>
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
                <p className="text-2xl font-bold text-gray-900">{Array.isArray(homeworkSubmissions) ? homeworkSubmissions.length : 0}</p>
                <p className="text-sm text-gray-500">Homework Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {student.firstName[0]}{student.lastName?.[0] || ""}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-gray-500">Student</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {student.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{student.phone}</span>
                  </div>
                )}
                {student.dateOfBirth && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {new Date(student.dateOfBirth).toLocaleDateString()} ({calculateAge(student.dateOfBirth)} years)
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollment ? (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Class</p>
                    <p className="font-medium text-gray-900">
                      Grade {enrollment.class?.grade} - Section {enrollment.section || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Roll Number</p>
                    <p className="font-medium text-gray-900">{enrollment.rollNumber || "Not Assigned"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Academic Year</p>
                    <p className="font-medium text-gray-900">{enrollment.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Enrollment Status</p>
                    <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                      {enrollment.status}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Not enrolled in any class</p>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Documents
              </CardTitle>
              <CardDescription>Student documents and certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <File className="w-4 h-4 mr-2 text-gray-400" />
                  Birth Certificate
                  <Download className="w-4 h-4 ml-auto" />
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <File className="w-4 h-4 mr-2 text-gray-400" />
                  Previous School Record
                  <Download className="w-4 h-4 ml-auto" />
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <File className="w-4 h-4 mr-2 text-gray-400" />
                  ID Card Photo
                  <Download className="w-4 h-4 ml-auto" />
                </Button>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                <LinkIcon className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Attendance Overview
              </CardTitle>
              <CardDescription>Attendance record for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                  <p className="text-xs text-green-700">Present</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                  <p className="text-xs text-red-700">Absent</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                  <p className="text-xs text-yellow-700">Late</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.excused}</p>
                  <p className="text-xs text-blue-700">Excused</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Recent Attendance</p>
                {attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
                          {record.checkInTime && (
                            <span className="text-xs text-gray-500">
                              In: {record.checkInTime}
                            </span>
                          )}
                        </div>
                        <Badge className={getAttendanceStatusBadge(record.status)} variant="outline">
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No attendance records found</p>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                <Link href="/school-admin/attendance">View Full Attendance</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Fee Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fee Status
              </CardTitle>
              <CardDescription>Payment history and outstanding fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Total Fees</p>
                    <p className="text-xl font-bold text-gray-900">Nu. {feeStats.totalFees.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="text-xl font-bold text-green-600">Nu. {feeStats.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-xl font-bold text-red-600">Nu. {feeStats.totalPending.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getFeeStatusBadge(feeStats.feeStatus)} variant="outline">
                      {feeStats.feeStatus}
                    </Badge>
                  </div>
                </div>

                {feeRecords.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Recent Payments</p>
                    {feeRecords.slice(0, 3).map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Fee for {new Date(fee.createdAt || 0).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">Receipt: {fee.payments[0]?.receiptNumber || "N/A"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Nu. {(fee.amountPaid || 0).toLocaleString()}</p>
                          <Badge className={getFeeStatusBadge(fee.status || "pending")} variant="outline">
                            {fee.status || "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                <Link href="/school-admin/fees">Manage Fees</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Assessment Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Assessment Results
              </CardTitle>
              <CardDescription>Career and personality assessment results</CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentResults.length > 0 ? (
                <div className="space-y-3">
                  {assessmentResults.slice(0, 5).map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{assessment.type}</p>
                          <p className="text-xs text-gray-500">
                            {assessment.completedAt
                              ? new Date(assessment.completedAt).toLocaleDateString()
                              : "In progress"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            assessment.status === "completed"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }
                          variant="outline"
                        >
                          {assessment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No assessment results yet</p>
                  <Button variant="outline" className="mt-4" size="sm" asChild>
                    <Link href="/dashboard/assessment">View Assessments</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Homework Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Homework Submissions
              </CardTitle>
              <CardDescription>Recent homework and submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {homeworkSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {homeworkSubmissions.map((submission: HomeworkSubmission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{submission.homework?.title}</p>
                          <p className="text-xs text-gray-500">
                            Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {submission.score !== null ? (
                          <p className="font-medium text-gray-900">{submission.score}/{submission.maxScore}</p>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No homework submissions yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exam Results */}
          {examResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Exam Results
                </CardTitle>
                <CardDescription>Board exam and term results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {examResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{result.examName}</p>
                        <p className="text-xs text-gray-500">{result.examYear}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{(result as { overallPercentage?: number }).overallPercentage ?? "N/A"}%</p>
                        <p className="text-xs text-gray-500">{(result as { division?: string })?.division || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
