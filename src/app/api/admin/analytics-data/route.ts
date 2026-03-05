/**
 * Platform-wide Analytics API
 * Returns comprehensive statistics for the admin dashboard
 *
 * GET /api/admin/analytics-data
 *
 * Protected: Requires 'admin' role
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, schools, assessments, assessmentResults, riasecResults, mbtiResults, discResults, careerMatches, examResultsEnhanced, attendance, feePayments, studentFees, subscriptions, invoices } from "@/lib/db/schema";
import { sql, eq, and, gte, desc, count, avg, sum } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

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
  collectedAmount: number; // Total amount from paid invoices
  schoolsWithPaidInvoices: number; // Count of schools with paid invoices
  paymentStatus: {
    pending: number;
    paid: number;
    overdue: number;
    collectedAmount?: number; // Total collected from school invoices
  };
}

interface AnalyticsData {
  schoolEngagement?: SchoolEngagementMetrics;
  userGrowth?: UserGrowthTrends;
  careerInterests?: CareerInterestsDistribution;
  assessmentCompletion?: AssessmentCompletionMetrics;
  academicPerformance?: AcademicPerformanceMetrics;
  revenue?: RevenueMetrics;
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

export const GET = createApiRoute(
  async (_request: NextRequest, auth) => {
    const startTime = Date.now();
    const { userId } = auth;

    logger.info("Fetching analytics data", { userId });

    try {
      // Calculate all metrics in parallel for better performance
      const results = await Promise.allSettled([
        getSchoolEngagementMetrics(),
        getUserGrowthTrends(),
        getCareerInterestsDistribution(),
        getAssessmentCompletionMetrics(),
        getAcademicPerformanceMetrics(),
        getRevenueMetrics(),
      ]);

      // Check for errors and log them
      const errors: string[] = [];
      const metricNames = ["schoolEngagement", "userGrowth", "careerInterests", "assessmentCompletion", "academicPerformance", "revenue"];

      for (let i = 0; i < results.length; i++) {
        const result = results[i] as PromiseFulfilledResult<unknown> | PromiseRejectedResult;
        if (result.status === "rejected") {
          const metricName = metricNames[i];
          const error = result.reason;
          errors.push(`${metricName}: ${error?.message || String(error)}`);
          logger.error(`Analytics metric ${metricName} failed`, { error: error?.message || String(error), stack: (error as Error)?.stack });
        }
      }

      if (errors.length > 0) {
        return errorResponse(`Failed to fetch analytics data: ${errors.join("; ")}`, 500);
      }

      // Extract values from fulfilled promises
      const [
        schoolEngagement,
        userGrowth,
        careerInterests,
        assessmentCompletion,
        academicPerformance,
        revenue,
      ] = results.map((r) => r.status === "fulfilled" ? r.value : null);

      const data: AnalyticsData = {
        schoolEngagement: (schoolEngagement ?? undefined) as SchoolEngagementMetrics | undefined,
        userGrowth: (userGrowth ?? undefined) as UserGrowthTrends | undefined,
        careerInterests: (careerInterests ?? undefined) as CareerInterestsDistribution | undefined,
        assessmentCompletion: (assessmentCompletion ?? undefined) as AssessmentCompletionMetrics | undefined,
        academicPerformance: (academicPerformance ?? undefined) as AcademicPerformanceMetrics | undefined,
        revenue: (revenue ?? undefined) as RevenueMetrics | undefined,
        generatedAt: new Date().toISOString(),
      };

      const duration = Date.now() - startTime;
      logger.info("Analytics data fetched successfully", { userId, duration: `${duration}ms` });

      return successResponse(data);
    } catch (error) {
      logger.apiError(error, { route: "/api/admin/analytics-data", method: "GET" });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to fetch analytics data: ${errorMessage}`, 500);
    }
  },
  ['admin']
);

// ============================================================================
// Metric Calculation Functions
// ============================================================================

/**
 * Calculate School Engagement Metrics
 */
async function getSchoolEngagementMetrics(): Promise<SchoolEngagementMetrics> {
  // Total schools
  const [totalResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schools);
  const totalSchools = totalResult?.count || 0;

  // Active schools (with user activity in last 30 days)
  const thirtyDaysAgo = getDateDaysAgo(30);
  const [activeResult] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
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
      count: sql<number>`COUNT(*)::int`,
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
      count: sql<number>`COUNT(*)::int`,
    })
    .from(schools)
    .groupBy(schools.level);

  const schoolsByLevel: Record<string, number> = {};
  for (const row of schoolsByLevelResult) {
    schoolsByLevel[row.level || 'unknown'] = row.count;
  }

  // Top 10 schools by student count - OPTIMIZED with single query
  const topSchoolsByStudentCount = await db
    .select({
      schoolId: schools.id,
      schoolName: schools.name,
      studentCount: sql<number>`COUNT(*)::int`,
    })
    .from(schools)
    .innerJoin(users, eq(schools.id, users.schoolId))
    .where(eq(users.type, 'student'))
    .groupBy(schools.id, schools.name)
    .orderBy(desc(sql<number>`COUNT(*)::int`))
    .limit(10);

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
      count: sql<number>`COUNT(*)::int`,
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
      count: sql<number>`COUNT(*)::int`,
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
      count: sql<number>`COUNT(*)::int`,
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
      count: sql<number>`COUNT(*)::int`,
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
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(gte(users.lastLogin, oneWeekAgo));

  const activeLast7Days = active7DaysResult?.count || 0;

  const thirtyDaysAgoForActive = getDateDaysAgo(30);

  const [active30DaysResult] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(gte(users.lastLogin, thirtyDaysAgoForActive));

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
      count: sql<number>`COUNT(*)::int`,
    })
    .from(careerMatches)
    .groupBy(careerMatches.careerTitle)
    .orderBy(desc(sql<number>`COUNT(*)::int`))
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
      count: sql<number>`COUNT(*)::int`,
    })
    .from(users)
    .where(and(
      eq(users.type, 'student'),
      sql`${users.grade} IS NOT NULL`
    ))
    .groupBy(users.grade)
    .orderBy(desc(sql<number>`COUNT(*)::int`))
    .limit(5);

  // OPTIMIZATION: Batch fetch top categories for all grades at once
  // Get all student grades with their career matches in one query
  const gradeCareerData = await db
    .select({
      grade: users.grade,
      category: careerMatches.careerTitle,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(users)
    .innerJoin(assessments, eq(users.id, assessments.userId))
    .innerJoin(careerMatches, eq(assessments.id, careerMatches.assessmentId))
    .where(eq(users.type, 'student'))
    .groupBy(users.grade, careerMatches.careerTitle)
    .orderBy(desc(sql<number>`COUNT(*)::int`));

  // Group by grade and find top category for each
  const gradeTopCategories = new Map<number | null, { category: string; count: number }>();
  for (const row of gradeCareerData) {
    const existing = gradeTopCategories.get(row.grade);
    if (!existing || row.count > existing.count) {
      gradeTopCategories.set(row.grade, { category: row.category, count: row.count });
    }
  }

  // Combine with student count data
  const interestByGrade = studentGradesResult.map((row) => ({
    grade: row.grade || 0,
    topCategory: gradeTopCategories.get(row.grade)?.category || 'N/A',
    count: row.count,
  }));

  // RIASEC distribution
  const riasecDistributionResult = await db
    .select({
      code: riasecResults.primaryHollandCode,
      count: sql<number>`COUNT(*)::int`,
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
  const [totalResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(assessments);
  const totalAssessments = totalResult?.count || 0;

  // Completed assessments
  const [completedResult] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(assessments)
    .where(sql`${assessments.completedAt} IS NOT NULL`);

  const completedAssessments = completedResult?.count || 0;

  const completionRate = totalAssessments > 0
    ? Math.round((completedAssessments / totalAssessments) * 100)
    : 0;

  // By type (RIASEC, MBTI, DISC)
  const riasecTotal = await db.select({ count: sql<number>`COUNT(*)::int` }).from(riasecResults);
  const mbtiTotal = await db.select({ count: sql<number>`COUNT(*)::int` }).from(mbtiResults);
  const discTotal = await db.select({ count: sql<number>`COUNT(*)::int` }).from(discResults);

  // Get started assessments count for each type
  const riasecStartedResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(assessments)
    .where(eq(assessments.type, 'riasec'));

  const mbtiStartedResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(assessments)
    .where(eq(assessments.type, 'mbti'));

  const discStartedResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
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
      count: sql<number>`COUNT(*)::int`,
    })
    .from(examResultsEnhanced)
    .where(gte(examResultsEnhanced.percentage, 40));

  const [totalResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(examResultsEnhanced);

  const passRate = totalResult?.count
    ? Math.round((passResult?.count || 0) / totalResult.count * 100)
    : 0;

  // Top performing schools - OPTIMIZED with single grouped query
  const schoolPerformanceData = await db
    .select({
      schoolId: schools.id,
      schoolName: schools.name,
      avgPercentage: avg(examResultsEnhanced.percentage),
    })
    .from(schools)
    .innerJoin(users, eq(schools.id, users.schoolId))
    .innerJoin(examResultsEnhanced, eq(users.id, examResultsEnhanced.userId))
    .groupBy(schools.id, schools.name)
    .orderBy(desc(avg(examResultsEnhanced.percentage)))
    .limit(10);

  const topPerformingSchools = schoolPerformanceData.map((school) => ({
    schoolId: school.schoolId,
    schoolName: school.schoolName,
    averagePercentage: school.avgPercentage ? Math.round(Number(school.avgPercentage)) : 0,
  }));

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
  try {
    // Active subscriptions from subscriptions table (multi-tenant billing)
    const [activeSubsResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(subscriptions)
      .where(sql`${subscriptions.status} = 'active' OR ${subscriptions.status} = 'trialing'`);

    const activeSubscriptionsFromBilling = activeSubsResult?.count || 0;

    // Monthly recurring revenue (MRR) from subscriptions
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

    // Annual recurring revenue (ARR) from subscriptions
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;

    // Invoice-based revenue (school billing)
    // Sum totalAmount for paid invoices
    const [paidInvoicesResult] = await db
      .select({
        total: sum(invoices.totalAmount),
      })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    const collectedAmount = paidInvoicesResult?.total
      ? Number(paidInvoicesResult.total)
      : 0;

    // Count distinct schools with paid invoices using SQL template
    const [schoolsResult] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${invoices.schoolId})::int`,
      })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    const schoolsWithPaidInvoices = schoolsResult?.count || 0;

    // Payment status from fee payments
    const [pendingResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(feePayments)
      .where(eq(feePayments.status, 'pending'));

    const [paidResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(feePayments)
      .where(eq(feePayments.status, 'paid'));

    // Overdue: fee records with due date past and status pending
    const [overdueResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(studentFees)
      .where(and(
        eq(studentFees.status, 'pending'),
        sql`${studentFees.dueDate} < ${new Date().toISOString()}`
      ));

    // COMBINE metrics from both billing systems:
    // - Subscriptions (multi-tenant billing)
    // - Invoices (school-based billing where Pelkhil's Nu 10,000 is)
    // Note: Invoice amounts are annual payments, so divide by 12 for MRR
    const annualRevenueFromInvoices = collectedAmount; // Full amount is annual
    const monthlyRevenueFromInvoices = Math.round(collectedAmount / 12); // Convert to monthly equivalent

    return {
      activeSubscriptions: activeSubscriptionsFromBilling + schoolsWithPaidInvoices,
      monthlyRecurringRevenue: monthlyRecurringRevenue + monthlyRevenueFromInvoices,
      annualRecurringRevenue: annualRecurringRevenue + annualRevenueFromInvoices,
      collectedAmount,
      schoolsWithPaidInvoices,
      paymentStatus: {
        pending: pendingResult?.count || 0,
        paid: paidResult?.count || 0,
        overdue: overdueResult?.count || 0,
        collectedAmount,
      },
    };
  } catch (error) {
    console.error("[Analytics] Revenue metrics failed (billing tables may not exist):", error);
    // Return zeros if billing tables don't exist or queries fail
    return {
      activeSubscriptions: 0,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      collectedAmount: 0,
      schoolsWithPaidInvoices: 0,
      paymentStatus: {
        pending: 0,
        paid: 0,
        overdue: 0,
      },
    };
  }
}
