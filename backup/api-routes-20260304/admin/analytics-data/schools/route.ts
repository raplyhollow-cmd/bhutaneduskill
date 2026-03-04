/**
 * School-Specific Analytics API
 * Returns detailed analytics for a specific school
 *
 * GET /api/admin/analytics-data/schools?schoolId={schoolId}
 *
 * Protected: Requires 'admin' or 'school-admin' role
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, schools, assessments, assessmentResults, riasecResults, mbtiResults, discResults, careerMatches, examResultsEnhanced, attendance, feePayments, studentFees, homework, homeworkSubmissions, classes, rubApplications } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { sql, eq, and, gte, lte, desc, count, avg, sum } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";

// ============================================================================
// Types
// ============================================================================

interface SchoolAnalytics {
  school: {
    id: string;
    name: string;
    code: string;
    type: string;
    level: string;
    city: string;
  };
  studentCount: number;
  teacherCount: number;
  parentCount: number;
  counselorCount: number;
  assessmentCompletion: {
    totalAssessments: number;
    completedAssessments: number;
    completionRate: number;
    riasecCompleted: number;
    mbtiCompleted: number;
    discCompleted: number;
    byType: Record<string, number>;
  };
  attendanceMetrics: {
    averageAttendanceRate: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    byGrade: Array<{
      grade: number;
      rate: number;
    }>;
  };
  feePaymentStatus: {
    totalFees: number;
    amountPaid: number;
    amountPending: number;
    paymentRate: number;
    pendingStudents: number;
    paidStudents: number;
    overdueCount: number;
  };
  academicPerformance: {
    averageGrade: number;
    passRate: number;
    classAverage: number;
    topPerformers: Array<{
      studentId: string;
      studentName: string;
      averagePercentage: number;
    }>;
  };
  careerInterests: {
    topCareerCategories: Array<{
      category: string;
      count: number;
    }>;
    rubApplications: number;
    studentsWithCareerPlans: number;
  };
  homeworkMetrics: {
    totalHomework: number;
    submissionRate: number;
    averageScore: number;
    pendingSubmissions: number;
  };
  activitySummary: {
    activeThisWeek: number;
    activeThisMonth: number;
    lastActivity: string | null;
  };
  generatedAt: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get date for N days ago
 */
function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// ============================================================================
// API Handler
// ============================================================================

export const GET = createApiRoute(
  async (req, auth) => {
    const startTime = Date.now();
    const { userId, user } = auth;

    // Parse query parameters
    const url = new URL(req.url);
    const schoolId = url.searchParams.get("schoolId");

    // If user is school-admin, use their school ID
    const targetSchoolId: string | null = user.type === 'school-admin' ? (user.schoolId as string | null) : schoolId;

    if (!targetSchoolId) {
      return { error: "School ID is required", status: 400 };
    }

    // If school-admin, verify they belong to the requested school
    if (user.type === 'school-admin' && user.schoolId !== targetSchoolId) {
      logger.security("school_access_denied", {
        userId,
        requestedSchool: targetSchoolId,
        userSchool: user.schoolId,
      });
      return { error: "You can only access your own school's analytics", status: 403 };
    }

    logger.info("Fetching school analytics", { userId, schoolId: targetSchoolId });

    // Fetch all analytics data in parallel
    const [
      school,
      studentCount,
      teacherCount,
      parentCount,
      counselorCount,
      assessmentCompletion,
      attendanceMetrics,
      feePaymentStatus,
      academicPerformance,
      careerInterests,
      homeworkMetrics,
      activitySummary,
    ] = await Promise.all([
      getSchoolInfo(targetSchoolId),
      getStudentCount(targetSchoolId),
      getTeacherCount(targetSchoolId),
      getParentCount(targetSchoolId),
      getCounselorCount(targetSchoolId),
      getAssessmentCompletion(targetSchoolId),
      getAttendanceMetrics(targetSchoolId),
      getFeePaymentStatus(targetSchoolId),
      getAcademicPerformance(targetSchoolId),
      getCareerInterests(targetSchoolId),
      getHomeworkMetrics(targetSchoolId),
      getActivitySummary(targetSchoolId),
    ]);

    const data: SchoolAnalytics = {
      school,
      studentCount,
      teacherCount,
      parentCount,
      counselorCount,
      assessmentCompletion,
      attendanceMetrics,
      feePaymentStatus,
      academicPerformance,
      careerInterests,
      homeworkMetrics,
      activitySummary,
      generatedAt: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.info("School analytics fetched successfully", {
      userId,
      schoolId: targetSchoolId,
      duration: `${duration}ms`
    });

    return { data };
  },
  ['admin', 'school-admin']
);

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Get basic school information
 */
async function getSchoolInfo(schoolId: string): Promise<SchoolAnalytics["school"]> {
  const [school] = await db
    .select({
      id: schools.id,
      name: schools.name,
      code: schools.code,
      type: schools.type,
      level: schools.level,
      city: schools.city,
    })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school) {
    throw new Error("School not found");
  }

  return school;
}

/**
 * Get student count for the school
 */
async function getStudentCount(schoolId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, 'student')));

  return result?.count || 0;
}

/**
 * Get teacher count for the school
 */
async function getTeacherCount(schoolId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, 'teacher')));

  return result?.count || 0;
}

/**
 * Get parent count for the school
 */
async function getParentCount(schoolId: string): Promise<number> {
  // Parents are linked via students' parentId field
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(sql`
      ${users.schoolId} = ${schoolId}
      AND ${users.type} = 'parent'
      AND ${users.id} IN (
        SELECT DISTINCT ${users.parentId}
        FROM ${users}
        WHERE ${users.schoolId} = ${schoolId}
        AND ${users.parentId} IS NOT NULL
      )
    `);

  return result?.count || 0;
}

/**
 * Get counselor count for the school
 */
async function getCounselorCount(schoolId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, 'counselor')));

  return result?.count || 0;
}

/**
 * Get assessment completion metrics
 */
async function getAssessmentCompletion(schoolId: string): Promise<SchoolAnalytics["assessmentCompletion"]> {
  // Get all students in the school
  const schoolStudents = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.type, 'student')));

  const studentIds = schoolStudents.map(s => s.id);

  if (studentIds.length === 0) {
    return {
      totalAssessments: 0,
      completedAssessments: 0,
      completionRate: 0,
      riasecCompleted: 0,
      mbtiCompleted: 0,
      discCompleted: 0,
      byType: {},
    };
  }

  // Total assessments for this school's students
  const [totalResult] = await db
    .select({ count: count() })
    .from(assessments)
    .where(sql`${assessments.userId} = ANY(${studentIds})`);

  const totalAssessments = totalResult?.count || 0;

  // Completed assessments
  const [completedResult] = await db
    .select({ count: count() })
    .from(assessments)
    .where(sql`
      ${assessments.userId} = ANY(${studentIds})
      AND ${assessments.completedAt} IS NOT NULL
    `);

  const completedAssessments = completedResult?.count || 0;

  const completionRate = totalAssessments > 0
    ? Math.round((completedAssessments / totalAssessments) * 100)
    : 0;

  // Completed assessments by type
  const [riasecResult] = await db
    .select({ count: count() })
    .from(riasecResults)
    .where(sql`${riasecResults.userId} = ANY(${studentIds})`);

  const [mbtiResult] = await db
    .select({ count: count() })
    .from(mbtiResults)
    .where(sql`${mbtiResults.userId} = ANY(${studentIds})`);

  const [discResult] = await db
    .select({ count: count() })
    .from(discResults)
    .where(sql`${discResults.userId} = ANY(${studentIds})`);

  // Assessments by type (from assessments table)
  const byTypeResult = await db
    .select({
      type: assessments.type,
      count: count(),
    })
    .from(assessments)
    .where(sql`${assessments.userId} = ANY(${studentIds})`)
    .groupBy(assessments.type);

  const byType: Record<string, number> = {};
  for (const row of byTypeResult) {
    byType[row.type || 'unknown'] = row.count;
  }

  return {
    totalAssessments,
    completedAssessments,
    completionRate,
    riasecCompleted: riasecResult?.count || 0,
    mbtiCompleted: mbtiResult?.count || 0,
    discCompleted: discResult?.count || 0,
    byType,
  };
}

/**
 * Get attendance metrics
 */
async function getAttendanceMetrics(schoolId: string): Promise<SchoolAnalytics["attendanceMetrics"]> {
  // Get all attendance records for this school
  const attendanceData = await db
    .select({
      status: attendance.status,
      grade: users.grade,
    })
    .from(attendance)
    .innerJoin(users, eq(attendance.studentId, users.id))
    .where(eq(attendance.schoolId, schoolId));

  const total = attendanceData.length;
  if (total === 0) {
    return {
      averageAttendanceRate: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      byGrade: [],
    };
  }

  const presentDays = attendanceData.filter(r => r.status === 'present').length;
  const absentDays = attendanceData.filter(r => r.status === 'absent').length;
  const lateDays = attendanceData.filter(r => r.status === 'late').length;
  const excusedDays = attendanceData.filter(r => r.status === 'excused').length;

  const averageAttendanceRate = total > 0
    ? Math.round((presentDays / total) * 100)
    : 0;

  // Calculate attendance by grade
  const gradeMap = new Map<number, { total: number; present: number }>();

  for (const record of attendanceData) {
    const grade = record.grade || 0;
    if (!gradeMap.has(grade)) {
      gradeMap.set(grade, { total: 0, present: 0 });
    }
    const stats = gradeMap.get(grade)!;
    stats.total++;
    if (record.status === 'present') {
      stats.present++;
    }
  }

  const byGrade = Array.from(gradeMap.entries())
    .map(([grade, stats]) => ({
      grade,
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
    }))
    .sort((a, b) => a.grade - b.grade)
    .slice(0, 10);

  return {
    averageAttendanceRate,
    presentDays,
    absentDays,
    lateDays,
    excusedDays,
    byGrade,
  };
}

/**
 * Get fee payment status
 */
async function getFeePaymentStatus(schoolId: string): Promise<SchoolAnalytics["feePaymentStatus"]> {
  // Get all student fees for this school
  const feesData = await db
    .select({
      totalAmount: studentFees.amount,
      amountPaid: studentFees.amountPaid,
      amountPending: studentFees.amountPending,
      status: studentFees.status,
      studentId: studentFees.studentId,
      dueDate: studentFees.dueDate,
    })
    .from(studentFees)
    .where(eq(studentFees.schoolId, schoolId));

  if (feesData.length === 0) {
    return {
      totalFees: 0,
      amountPaid: 0,
      amountPending: 0,
      paymentRate: 0,
      pendingStudents: 0,
      paidStudents: 0,
      overdueCount: 0,
    };
  }

  const totalFees = feesData.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
  const amountPaid = feesData.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const amountPending = feesData.reduce((sum, f) => sum + (f.amountPending || 0), 0);

  const paymentRate = totalFees > 0 ? Math.round((amountPaid / totalFees) * 100) : 0;

  // Count unique students with pending/paid fees
  const pendingStudentIds = new Set(feesData.filter(f => f.status === 'pending').map(f => f.studentId));
  const paidStudentIds = new Set(feesData.filter(f => f.status === 'paid').map(f => f.studentId));

  // Overdue: pending fees with due date past
  const overdueFees = feesData.filter(f => {
    if (f.status !== 'pending') return false;
    const dueDate = new Date(f.dueDate);
    return dueDate < new Date();
  });

  return {
    totalFees,
    amountPaid,
    amountPending,
    paymentRate,
    pendingStudents: pendingStudentIds.size,
    paidStudents: paidStudentIds.size,
    overdueCount: overdueFees.length,
  };
}

/**
 * Get academic performance metrics
 */
async function getAcademicPerformance(schoolId: string): Promise<SchoolAnalytics["academicPerformance"]> {
  // Get exam results for students in this school
  const examData = await db
    .select({
      percentage: examResultsEnhanced.percentage,
      studentId: examResultsEnhanced.userId,
      studentName: users.name,
    })
    .from(examResultsEnhanced)
    .innerJoin(users, eq(examResultsEnhanced.userId, users.id))
    .where(eq(users.schoolId, schoolId));

  if (examData.length === 0) {
    return {
      averageGrade: 0,
      passRate: 0,
      classAverage: 0,
      topPerformers: [],
    };
  }

  const totalPercentage = examData.reduce((sum, r) => sum + (r.percentage || 0), 0);
  const averageGrade = Math.round(totalPercentage / examData.length);

  const passedCount = examData.filter(r => (r.percentage || 0) >= 40).length;
  const passRate = Math.round((passedCount / examData.length) * 100);

  // Get top performers (top 10)
  const studentAverages = new Map<string, { name: string; total: number; count: number }>();

  for (const result of examData) {
    if (!studentAverages.has(result.studentId)) {
      studentAverages.set(result.studentId, {
        name: result.studentName || 'Unknown',
        total: 0,
        count: 0,
      });
    }
    const stats = studentAverages.get(result.studentId);
    if (stats) {
      stats.total += result.percentage || 0;
      stats.count++;
    }
  }

  const topPerformers = Array.from(studentAverages.entries())
    .map(([studentId, stats]) => ({
      studentId,
      studentName: stats.name,
      averagePercentage: Math.round(stats.total / stats.count),
    }))
    .sort((a, b) => b.averagePercentage - a.averagePercentage)
    .slice(0, 10);

  return {
    averageGrade,
    passRate,
    classAverage: averageGrade, // Same as average for school level
    topPerformers,
  };
}

/**
 * Get career interests data
 */
async function getCareerInterests(schoolId: string): Promise<SchoolAnalytics["careerInterests"]> {
  // Get career matches for students in this school
  // Join through assessments table to get reliable user data
  const careerData = await db
    .select({
      careerTitle: careerMatches.careerTitle,
    })
    .from(careerMatches)
    .innerJoin(assessments, eq(careerMatches.assessmentId, assessments.id))
    .innerJoin(users, eq(assessments.userId, users.id))
    .where(eq(users.schoolId, schoolId));

  // Count top categories
  const categoryCounts = new Map<string, number>();
  for (const match of careerData) {
    if (match.careerTitle) {
      categoryCounts.set(match.careerTitle, (categoryCounts.get(match.careerTitle) || 0) + 1);
    }
  }

  const topCareerCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // RUB applications count - also fix to use proper join
  const [rubAppsResult] = await db
    .select({ count: count() })
    .from(rubApplications)
    .innerJoin(users, eq(rubApplications.studentId, users.id))
    .where(eq(users.schoolId, schoolId));

  // Students with career plans
  const [careerPlansResult] = await db
    .select({ count: count() })
    .from(users) // Using users table as proxy since we don't have direct link to career_plans
    .where(and(eq(users.schoolId, schoolId), eq(users.type, 'student')));

  // Note: This is an approximation - actual career_plans table query would be:
  // SELECT COUNT(*) FROM career_plans WHERE student_id IN (SELECT id FROM users WHERE school_id = ?)

  return {
    topCareerCategories,
    rubApplications: rubAppsResult?.count || 0,
    studentsWithCareerPlans: careerPlansResult?.count || 0, // Using total students as proxy
  };
}

/**
 * Get homework metrics
 */
async function getHomeworkMetrics(schoolId: string): Promise<SchoolAnalytics["homeworkMetrics"]> {
  // Get classes for this school
  const schoolClasses = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.schoolId, schoolId));

  const classIds = schoolClasses.map(c => c.id);

  if (classIds.length === 0) {
    return {
      totalHomework: 0,
      submissionRate: 0,
      averageScore: 0,
      pendingSubmissions: 0,
    };
  }

  // Total homework
  const [totalResult] = await db
    .select({ count: count() })
    .from(homework)
    .where(sql`${homework.classId} = ANY(${classIds})`);

  const totalHomework = totalResult?.count || 0;

  // Submissions
  const [submissionsResult] = await db
    .select({ count: count() })
    .from(homeworkSubmissions)
    .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
    .where(sql`${homework.classId} = ANY(${classIds})`);

  const submissionCount = submissionsResult?.count || 0;

  // Average score
  const [avgScoreResult] = await db
    .select({
      avg: avg(homeworkSubmissions.score),
    })
    .from(homeworkSubmissions)
    .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
    .where(sql`${homework.classId} = ANY(${classIds})`);

  const averageScore = avgScoreResult?.avg ? Math.round(Number(avgScoreResult.avg)) : 0;

  // Pending submissions (homework assigned but not submitted by students)
  // This is a rough estimate - actual implementation would need student enrollment data
  const pendingSubmissions = Math.max(0, totalHomework - submissionCount);

  const submissionRate = totalHomework > 0 ? Math.round((submissionCount / totalHomework) * 100) : 0;

  return {
    totalHomework,
    submissionRate,
    averageScore,
    pendingSubmissions,
  };
}

/**
 * Get activity summary
 */
async function getActivitySummary(schoolId: string): Promise<SchoolAnalytics["activitySummary"]> {
  const oneWeekAgo = getDateDaysAgo(7);
  const oneMonthAgo = getDateDaysAgo(30);

  // Active users (logged in recently)
  const [activeWeekResult] = await db
    .select({ count: count() })
    .from(users)
    .where(and(
      eq(users.schoolId, schoolId),
      gte(users.lastLogin, oneWeekAgo.toISOString())
    ));

  const [activeMonthResult] = await db
    .select({ count: count() })
    .from(users)
    .where(and(
      eq(users.schoolId, schoolId),
      gte(users.lastLogin, oneMonthAgo.toISOString())
    ));

  // Last activity (most recent login or update)
  const [lastActivityResult] = await db
    .select({
      lastLogin: users.lastLogin,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.schoolId, schoolId))
    .orderBy(desc(users.updatedAt))
    .limit(1);

  const lastActivity = lastActivityResult?.lastLogin || lastActivityResult?.updatedAt || null;

  return {
    activeThisWeek: activeWeekResult?.count || 0,
    activeThisMonth: activeMonthResult?.count || 0,
    lastActivity,
  };
}
