/**
 * Platform-wide Analytics API
 * Returns comprehensive statistics for the admin dashboard
 *
 * GET /api/admin/analytics-data
 *
 * Protected: Requires 'admin' role
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, schools, assessments, assessmentResults, riasecResults, mbtiResults, discResults, careerMatches, examResultsEnhanced, attendance, feePayments, studentFees, subscriptions, invoices, homework, homeworkSubmissions, rubApplications } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { sql, eq, and, gte, lte, desc, count, avg, sum } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface SchoolEngagementMetrics {
  totalSchools: number;
  activeSchools: number; // With activity in last 30 days
  schoolsByType: Record<string, number>;
  schoolsByLevel: Record<string, number>;
  topSchoolsByStudentCount: Array<{
    schoolId: string;
    schoolName: string;
    studentCount: number;
  }>;
}

interface UserGrowthTrends {
  totalByType: Record<string, number>;
  newThisWeek: Record<string, number>;
  newThisMonth: Record<string, number>;
  newThisYear: Record<string, number>;
  activeLast7Days: number;
  activeLast30Days: number;
  growthOverTime: Array<{
    month: string;
    students: number;
    teachers: number;
    parents: number;
    total: number;
  }>;
}

interface CareerInterestsDistribution {
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  interestByGrade: Array<{
    grade: number;
    topCategory: string;
    count: number;
  }>;
  riasecDistribution: Record<string, number>;
}

interface AssessmentCompletionMetrics {
  totalAssessments: number;
  completedAssessments: number;
  completionRate: number;
  byType: Record<string, {
    total: number;
    completed: number;
    completionRate: number;
  }>;
}

interface AcademicPerformanceMetrics {
  averageGrade: number;
  passRate: number;
  topPerformingSchools: Array<{
    schoolId: string;
    schoolName: string;
    averagePercentage: number;
  }>;
}

interface RevenueMetrics {
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  paymentStatus: {
    pending: number;
    paid: number;
    overdue: number;
  };
}

interface AnalyticsData {
  schoolEngagement: SchoolEngagementMetrics;
  userGrowth: UserGrowthTrends;
  careerInterests: CareerInterestsDistribution;
  assessmentCompletion: AssessmentCompletionMetrics;
  academicPerformance: AcademicPerformanceMetrics;
  revenue: RevenueMetrics;
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

/**
 * Get date for N months ago
 */
function getDateMonthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

/**
 * Get month key for grouping
 */
function getMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7); // YYYY-MM
}

// ============================================================================
// API Handler
// ============================================================================

export async function GET(req: Request) {
  const startTime = Date.now();

  try {
    // Authentication check
    const authResult = await requireAuth(['admin']);
    if ('error' in authResult) {
      logger.security("unauthorized_access_attempt", {
        route: "/api/admin/analytics-data",
        method: "GET",
      });
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    logger.info("Fetching analytics data", { userId });

    // Calculate all metrics in parallel for better performance
    const [
      schoolEngagement,
      userGrowth,
      careerInterests,
      assessmentCompletion,
      academicPerformance,
      revenue,
    ] = await Promise.all([
      getSchoolEngagementMetrics(),
      getUserGrowthTrends(),
      getCareerInterestsDistribution(),
      getAssessmentCompletionMetrics(),
      getAcademicPerformanceMetrics(),
      getRevenueMetrics(),
    ]);

    const data: AnalyticsData = {
      schoolEngagement,
      userGrowth,
      careerInterests,
      assessmentCompletion,
      academicPerformance,
      revenue,
      generatedAt: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.info("Analytics data fetched successfully", { userId, duration: `${duration}ms` });

    return NextResponse.json({ data } satisfies ApiSuccess<AnalyticsData>);

  } catch (error) {
    logger.apiError(error, { route: "/api/admin/analytics-data", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch analytics data", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// Metric Calculation Functions
// ============================================================================

/**
 * Calculate School Engagement Metrics
 */
async function getSchoolEngagementMetrics(): Promise<SchoolEngagementMetrics> {
  // Total schools
  const [totalResult] = await db.select({ count: count() }).from(schools);
  const totalSchools = totalResult?.count || 0;

  // Active schools (with user activity in last 30 days)
  const thirtyDaysAgo = getDateDaysAgo(30);
  const [activeResult] = await db
    .select({ count: count() })
    .from(schools)
    .where(sql`${schools.id} IN (
      SELECT DISTINCT ${users.schoolId}
      FROM ${users}
      WHERE ${users.lastLogin} >= ${thirtyDaysAgo.toISOString()}
      AND ${users.schoolId} IS NOT NULL
    )`);

  const activeSchools = activeResult?.count || 0;

  // Schools by type
  const schoolsByTypeResult = await db
    .select({
      type: schools.type,
      count: count(),
    })
    .from(schools)
    .groupBy(schools.type);

  const schoolsByType: Record<string, number> = {};
  for (const row of schoolsByTypeResult) {
    schoolsByType[row.type || 'unknown'] = row.count;
  }

  // Schools by level
  const schoolsByLevelResult = await db
    .select({
      level: schools.level,
      count: count(),
    })
    .from(schools)
    .groupBy(schools.level);

  const schoolsByLevel: Record<string, number> = {};
  for (const row of schoolsByLevelResult) {
    schoolsByLevel[row.level || 'unknown'] = row.count;
  }

  // Top 10 schools by student count
  const topSchoolsResult = await db
    .select({
      schoolId: schools.id,
      schoolName: schools.name,
    })
    .from(schools)
    .orderBy(desc(sql`(
      SELECT COUNT(*)
      FROM ${users}
      WHERE ${users.schoolId} = ${schools.id}
      AND ${users.type} = 'student'
    )`))
    .limit(10);

  // Get student counts for each school
  const topSchoolsByStudentCount = await Promise.all(
    topSchoolsResult.map(async (school) => {
      const [studentCountResult] = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.schoolId, school.schoolId), eq(users.type, 'student')));

      return {
        schoolId: school.schoolId,
        schoolName: school.schoolName,
        studentCount: studentCountResult?.count || 0,
      };
    })
  );

  return {
    totalSchools,
    activeSchools,
    schoolsByType,
    schoolsByLevel,
    topSchoolsByStudentCount,
  };
}

/**
 * Calculate User Growth Trends
 */
async function getUserGrowthTrends(): Promise<UserGrowthTrends> {
  // Total users by type
  const totalByTypeResult = await db
    .select({
      type: users.type,
      count: count(),
    })
    .from(users)
    .groupBy(users.type);

  const totalByType: Record<string, number> = {};
  for (const row of totalByTypeResult) {
    totalByType[row.type] = row.count;
  }

  // Users created this week
  const oneWeekAgo = getDateDaysAgo(7);
  const newThisWeekResult = await db
    .select({
      type: users.type,
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, oneWeekAgo))
    .groupBy(users.type);

  const newThisWeek: Record<string, number> = {};
  for (const row of newThisWeekResult) {
    newThisWeek[row.type] = row.count;
  }

  // Users created this month
  const oneMonthAgo = getDateMonthsAgo(1);
  const newThisMonthResult = await db
    .select({
      type: users.type,
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, oneMonthAgo))
    .groupBy(users.type);

  const newThisMonth: Record<string, number> = {};
  for (const row of newThisMonthResult) {
    newThisMonth[row.type] = row.count;
  }

  // Users created this year
  const oneYearAgo = getDateMonthsAgo(12);
  const newThisYearResult = await db
    .select({
      type: users.type,
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, oneYearAgo))
    .groupBy(users.type);

  const newThisYear: Record<string, number> = {};
  for (const row of newThisYearResult) {
    newThisYear[row.type] = row.count;
  }

  // Active users (logged in recently)
  const [active7DaysResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.lastLogin, oneWeekAgo));

  const activeLast7Days = active7DaysResult?.count || 0;

  const [active30DaysResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.lastLogin, thirtyDaysAgo));

  const activeLast30Days = active30DaysResult?.count || 0;

  // Growth over time (last 12 months)
  const twelveMonthsAgo = getDateMonthsAgo(12);
  const usersGrowthData = await db
    .select({
      type: users.type,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(gte(users.createdAt, twelveMonthsAgo));

  // Group by month
  const growthByMonth: Record<string, Record<string, number>> = {};

  for (const user of usersGrowthData) {
    const monthKey = getMonthKey(user.createdAt);
    if (!growthByMonth[monthKey]) {
      growthByMonth[monthKey] = { students: 0, teachers: 0, parents: 0, total: 0 };
    }
    if (user.type === 'student') growthByMonth[monthKey].students++;
    else if (user.type === 'teacher') growthByMonth[monthKey].teachers++;
    else if (user.type === 'parent') growthByMonth[monthKey].parents++;
    growthByMonth[monthKey].total++;
  }

  // Convert to array and sort
  const growthOverTime: Array<{
    month: string;
    students: number;
    teachers: number;
    parents: number;
    total: number;
  }> = Object.entries(growthByMonth)
    .map(([month, counts]) => ({
      month,
      students: counts.students,
      teachers: counts.teachers,
      parents: counts.parents,
      total: counts.total,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalByType,
    newThisWeek,
    newThisMonth,
    newThisYear,
    activeLast7Days,
    activeLast30Days,
    growthOverTime,
  };
}

/**
 * Calculate Career Interests Distribution
 */
async function getCareerInterestsDistribution(): Promise<CareerInterestsDistribution> {
  // Top career categories from career matches
  const topCategoriesResult = await db
    .select({
      category: careerMatches.careerTitle,
      count: count(),
    })
    .from(careerMatches)
    .groupBy(careerMatches.careerTitle)
    .orderBy(desc(count()))
    .limit(10);

  const totalCareerMatches = topCategoriesResult.reduce((sum, row) => sum + row.count, 0);

  const topCategories = topCategoriesResult.map((row) => ({
    category: row.category,
    count: row.count,
    percentage: totalCareerMatches > 0 ? Math.round((row.count / totalCareerMatches) * 100) : 0,
  }));

  // Interest by grade (from users table)
  const studentGradesResult = await db
    .select({
      grade: users.grade,
      count: count(),
    })
    .from(users)
    .where(eq(users.type, 'student'))
    .groupBy(users.grade)
    .having((users) => sql`${users.grade} IS NOT NULL`)
    .orderBy(desc(count()))
    .limit(5);

  const interestByGrade = await Promise.all(
    studentGradesResult.map(async (row) => {
      // Get top career category for this grade
      const [topCategoryResult] = await db
        .select({
          category: careerMatches.careerTitle,
          count: count(),
        })
        .from(careerMatches)
        .innerJoin(users, eq(careerMatches.studentId, users.id))
        .where(and(eq(users.type, 'student'), eq(users.grade, row.grade)))
        .groupBy(careerMatches.careerTitle)
        .orderBy(desc(count()))
        .limit(1);

      return {
        grade: row.grade || 0,
        topCategory: topCategoryResult?.category || 'N/A',
        count: row.count,
      };
    })
  );

  // RIASEC distribution
  const riasecDistributionResult = await db
    .select({
      code: riasecResults.primaryHollandCode,
      count: count(),
    })
    .from(riasecResults)
    .groupBy(riasecResults.primaryHollandCode);

  const riasecDistribution: Record<string, number> = {};
  for (const row of riasecDistributionResult) {
    riasecDistribution[row.code || 'unknown'] = row.count;
  }

  return {
    topCategories,
    interestByGrade,
    riasecDistribution,
  };
}

/**
 * Calculate Assessment Completion Metrics
 */
async function getAssessmentCompletionMetrics(): Promise<AssessmentCompletionMetrics> {
  // Total assessments
  const [totalResult] = await db.select({ count: count() }).from(assessments);
  const totalAssessments = totalResult?.count || 0;

  // Completed assessments
  const [completedResult] = await db
    .select({ count: count() })
    .from(assessments)
    .where(sql`${assessments.completedAt} IS NOT NULL`);

  const completedAssessments = completedResult?.count || 0;

  const completionRate = totalAssessments > 0
    ? Math.round((completedAssessments / totalAssessments) * 100)
    : 0;

  // By type (RIASEC, MBTI, DISC)
  const riasecTotal = await db.select({ count: count() }).from(riasecResults);
  const mbtiTotal = await db.select({ count: count() }).from(mbtiResults);
  const discTotal = await db.select({ count: count() }).from(discResults);

  // Get started assessments count for each type
  const riasecStartedResult = await db
    .select({ count: count() })
    .from(assessments)
    .where(eq(assessments.type, 'riasec'));

  const mbtiStartedResult = await db
    .select({ count: count() })
    .from(assessments)
    .where(eq(assessments.type, 'mbti'));

  const discStartedResult = await db
    .select({ count: count() })
    .from(assessments)
    .where(eq(assessments.type, 'disc'));

  const byType: Record<string, { total: number; completed: number; completionRate: number }> = {
    riasec: {
      total: riasecStartedResult[0]?.count || 0,
      completed: riasecTotal[0]?.count || 0,
      completionRate: riasecStartedResult[0]?.count
        ? Math.round(((riasecTotal[0]?.count || 0) / riasecStartedResult[0].count) * 100)
        : 0,
    },
    mbti: {
      total: mbtiStartedResult[0]?.count || 0,
      completed: mbtiTotal[0]?.count || 0,
      completionRate: mbtiStartedResult[0]?.count
        ? Math.round(((mbtiTotal[0]?.count || 0) / mbtiStartedResult[0].count) * 100)
        : 0,
    },
    disc: {
      total: discStartedResult[0]?.count || 0,
      completed: discTotal[0]?.count || 0,
      completionRate: discStartedResult[0]?.count
        ? Math.round(((discTotal[0]?.count || 0) / discStartedResult[0].count) * 100)
        : 0,
    },
  };

  return {
    totalAssessments,
    completedAssessments,
    completionRate,
    byType,
  };
}

/**
 * Calculate Academic Performance Metrics
 */
async function getAcademicPerformanceMetrics(): Promise<AcademicPerformanceMetrics> {
  // Average grade across all exam results
  const [avgResult] = await db
    .select({
      avg: avg(examResultsEnhanced.percentage),
    })
    .from(examResultsEnhanced);

  const averageGrade = avgResult?.avg ? Math.round(Number(avgResult.avg)) : 0;

  // Pass rate (assuming 40% is passing)
  const [passResult] = await db
    .select({
      count: count(),
    })
    .from(examResultsEnhanced)
    .where(gte(examResultsEnhanced.percentage, 40));

  const [totalResult] = await db.select({ count: count() }).from(examResultsEnhanced);

  const passRate = totalResult?.count
    ? Math.round((passResult?.count || 0) / totalResult.count * 100)
    : 0;

  // Top performing schools
  const schoolPerformanceResult = await db
    .select({
      schoolId: schools.id,
      schoolName: schools.name,
    })
    .from(schools)
    .orderBy(desc(sql`(
      SELECT AVG(${examResultsEnhanced.percentage})
      FROM ${examResultsEnhanced}
      INNER JOIN ${users} ON ${examResultsEnhanced.userId} = ${users.id}
      WHERE ${users.schoolId} = ${schools.id}
    )`))
    .limit(10);

  const topPerformingSchools = await Promise.all(
    schoolPerformanceResult.map(async (school) => {
      const [schoolAvgResult] = await db
        .select({
          avg: avg(examResultsEnhanced.percentage),
        })
        .from(examResultsEnhanced)
        .innerJoin(users, eq(examResultsEnhanced.userId, users.id))
        .where(eq(users.schoolId, school.schoolId));

      return {
        schoolId: school.schoolId,
        schoolName: school.schoolName,
        averagePercentage: schoolAvgResult?.avg ? Math.round(Number(schoolAvgResult.avg)) : 0,
      };
    })
  );

  return {
    averageGrade,
    passRate,
    topPerformingSchools,
  };
}

/**
 * Calculate Revenue Metrics
 */
async function getRevenueMetrics(): Promise<RevenueMetrics> {
  // Active subscriptions
  const [activeSubsResult] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(sql`${subscriptions.status} = 'active' OR ${subscriptions.status} = 'trialing'`);

  const activeSubscriptions = activeSubsResult?.count || 0;

  // Monthly recurring revenue (MRR)
  const [mrrResult] = await db
    .select({
      total: sum(subscriptions.price),
    })
    .from(subscriptions)
    .where(sql`${subscriptions.status} = 'active' AND ${subscriptions.billingCycle} = 'monthly'`);

  const mrrFromMonthly = mrrResult?.total || 0;

  // Convert yearly subscriptions to monthly equivalent
  const [yearlyResult] = await db
    .select({
      total: sum(subscriptions.price),
    })
    .from(subscriptions)
    .where(sql`${subscriptions.status} = 'active' AND ${subscriptions.billingCycle} = 'yearly'`);

  const mrrFromYearly = yearlyResult?.total
    ? Math.round((Number(yearlyResult.total) / 12))
    : 0;

  const monthlyRecurringRevenue = Number(mrrFromMonthly) + mrrFromYearly;

  // Annual recurring revenue (ARR)
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;

  // Payment status from fee payments
  const [pendingResult] = await db
    .select({ count: count() })
    .from(feePayments)
    .where(eq(feePayments.status, 'pending'));

  const [paidResult] = await db
    .select({ count: count() })
    .from(feePayments)
    .where(eq(feePayments.status, 'paid'));

  // Overdue: fee records with due date past and status pending
  const [overdueResult] = await db
    .select({ count: count() })
    .from(studentFees)
    .where(and(
      eq(studentFees.status, 'pending'),
      sql`${studentFees.dueDate} < ${new Date().toISOString()}`
    ));

  return {
    activeSubscriptions,
    monthlyRecurringRevenue,
    annualRecurringRevenue,
    paymentStatus: {
      pending: pendingResult?.count || 0,
      paid: paidResult?.count || 0,
      overdue: overdueResult?.count || 0,
    },
  };
}

// Date reference for queries
const thirtyDaysAgo = getDateDaysAgo(30);
