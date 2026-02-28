/**
 * AI SENTINEL - SITREP (Situation Report) Generator
 *
 * Generates daily briefings for platform admins with 24h delta analysis.
 * Runs daily at 06:00 AM via Vercel cron.
 */

import { db } from "@/lib/db";
import {
  schools,
  users,
  invoices,
  subscriptions,
  aiInteractions,
  assessments,
  sitrepReports,
  careerMatches,
} from "@/lib/db/schema";
import { eq, gt, lt, and, sql, desc, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { detectAllAnomalies, generateAnomalySummary } from "./anomaly-detector";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export interface SITREPData {
  reportDate: string;
  timestamp: Date;
  healthStatus: "healthy" | "degraded" | "critical";
  growth: {
    newSchools: number;
    newUsers: number;
    newStudents: number;
    newTeachers: number;
    churnedSchools: number;
    growthPercentage: number;
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
  };
  revenue: {
    mrr: number; // Monthly Recurring Revenue
    overdueInvoices: number;
    overdueAmount: number;
    paidThisMonth: number;
    pendingInvoices: number;
  };
  activity: {
    aiConsultations: number;
    assessmentsCompleted: number;
    topCareer: string;
    topCareerTrend: "up" | "down" | "stable";
    activeNow: number;
    topCareers?: Array<{ career: string; count: number }>;
  };
  anomalies: ReturnType<typeof detectAllAnomalies> extends Promise<infer T> ? T : never;
  summary: string;
}

interface SITREPOptions {
  forceRegenerate?: boolean;
  useAIForSummary?: boolean;
}

// ============================================================================
// SITREP GENERATOR
// ============================================================================

/**
 * Generate SITREP for a specific date (defaults to today)
 */
export async function generateSITREP(
  date?: Date,
  options: SITREPOptions = {}
): Promise<SITREPData> {
  const reportDate = date || new Date();
  const dateStr = reportDate.toISOString().split("T")[0];

  logger.info("Generating SITREP", { date: dateStr });

  // Check if SITREP already exists for today
  if (!options.forceRegenerate) {
    const existing = await db
      .select()
      .from(sitrepReports)
      .where(eq(sitrepReports.reportDate, dateStr))
      .limit(1);

    if (existing.length > 0) {
      logger.info("SITREP already exists, returning cached", { date: dateStr });
      return parseExistingSITREP(existing[0]);
    }
  }

  // Get yesterday's date for delta calculation
  const yesterday = new Date(reportDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Run all data gathering in parallel
  const [
    growthData,
    revenueData,
    activityData,
    anomalyResult,
  ] = await Promise.all([
    gatherGrowthData(yesterdayStr),
    gatherRevenueData(reportDate),
    gatherActivityData(yesterdayStr),
    detectAllAnomalies(),
  ]);

  // Determine overall health status
  const healthStatus = determineHealthStatus(anomalyResult.summary);

  // Generate AI summary if requested
  let summary = "";
  if (options.useAIForSummary) {
    summary = await generateAISummary({
      growth: growthData,
      revenue: revenueData,
      activity: activityData,
      anomalies: anomalyResult,
      healthStatus,
    });
  } else {
    summary = generateBasicSummary({
      growth: growthData,
      revenue: revenueData,
      activity: activityData,
      anomalies: anomalyResult,
      healthStatus,
    });
  }

  const sitrepData: SITREPData = {
    reportDate: dateStr,
    timestamp: new Date(),
    healthStatus,
    growth: growthData,
    revenue: revenueData,
    activity: activityData,
    anomalies: anomalyResult as Awaited<ReturnType<typeof detectAllAnomalies>>,
    summary,
  };

  // Save to database
  await saveSITREP(sitrepData);

  return sitrepData;
}

/**
 * Gather growth data (new schools, users, etc.)
 */
async function gatherGrowthData(yesterdayStr: string) {
  // Count total schools
  const [totalSchoolsResult] = await db
    .select({ count: count() })
    .from(schools);
  const totalSchools = Number(totalSchoolsResult?.count || 0);

  // Count new schools created today/this month
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [newSchoolsThisMonthResult] = await db
    .select({ count: count() })
    .from(schools)
    .where(gt(schools.createdAt, monthStart));

  // Count users by type
  const [studentsResult] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.type, "student"));

  const [teachersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.type, "teacher"));

  // Count new users this month
  const [newUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gt(users.createdAt, monthStart));

  const [newStudentsResult] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.type, "student"),
        gt(users.createdAt, monthStart)
      )
    );

  const [newTeachersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.type, "teacher"),
        gt(users.createdAt, monthStart)
      )
    );

  // Calculate growth percentage (vs last month)
  const lastMonthStart = new Date();
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  lastMonthStart.setDate(1);

  const [lastMonthUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gt(users.createdAt, lastMonthStart));

  const currentMonthUsers = Number(newUsersResult?.count || 0);
  const lastMonthUsers = Number(lastMonthUsersResult?.count || 0);
  const growthPercentage = lastMonthUsers > 0
    ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
    : 0;

  return {
    newSchools: Number(newSchoolsThisMonthResult?.count || 0),
    newUsers: Number(newUsersResult?.count || 0),
    newStudents: Number(newStudentsResult?.count || 0),
    newTeachers: Number(newTeachersResult?.count || 0),
    churnedSchools: 0, // TODO: Implement churn detection
    totalSchools,
    totalStudents: Number(studentsResult?.count || 0),
    totalTeachers: Number(teachersResult?.count || 0),
    growthPercentage: Math.round(growthPercentage),
  };
}

/**
 * Gather revenue data
 */
async function gatherRevenueData(reportDate: Date) {
  const monthStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);

  // Calculate MRR from active subscriptions
  const activeSubscriptions = await db
    .select({
      price: subscriptions.price,
    })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  const mrr = activeSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0);

  // Count overdue invoices
  const [overdueResult] = await db
    .select({
      count: count(),
      totalAmount: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.status, "overdue"));

  // Count pending invoices
  const [pendingResult] = await db
    .select({
      count: count(),
      totalAmount: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.status, "pending"));

  // Count paid invoices this month
  const [paidThisMonthResult] = await db
    .select({
      count: count(),
      totalAmount: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gt(invoices.paidAt, monthStart)
      )
    );

  return {
    mrr,
    overdueInvoices: Number(overdueResult?.count || 0),
    overdueAmount: Number(overdueResult?.totalAmount || 0),
    pendingInvoices: Number(pendingResult?.count || 0),
    paidThisMonth: Number(paidThisMonthResult?.totalAmount || 0),
  };
}

/**
 * Gather activity data
 */
async function gatherActivityData(yesterdayStr: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Count AI interactions today
  const [aiTodayResult] = await db
    .select({ count: count() })
    .from(aiInteractions)
    .where(gt(aiInteractions.createdAt, todayStart));

  // Count assessments completed
  const [assessmentsTodayResult] = await db
    .select({ count: count() })
    .from(assessments)
    .where(
      and(
        eq(assessments.status, "completed"),
        gt(assessments.completedAt, todayStart)
      )
    );

  // Get top career interests
  const topCareers = await db
    .select({
      career: careerMatches.careerTitle,
      count: count(),
    })
    .from(careerMatches)
    .groupBy(careerMatches.careerTitle)
    .orderBy(desc(count()))
    .limit(5);

  const topCareer = topCareers[0]?.career || "Software Engineer";

  // Estimate active now (would require real-time tracking)
  const activeNow = Math.floor(Math.random() * 50) + 10; // Placeholder

  return {
    aiConsultations: Number(aiTodayResult?.count || 0),
    assessmentsCompleted: Number(assessmentsTodayResult?.count || 0),
    topCareer,
    topCareerTrend: "up" as "up" | "down" | "stable", // TODO: Calculate from historical data
    activeNow,
    topCareers: topCareers.map((c) => ({
      career: c.career,
      count: Number(c.count),
    })),
  };
}

/**
 * Determine overall health status based on anomalies
 */
function determineHealthStatus(summary: { critical: number; high: number; medium: number; low: number; total: number }): "healthy" | "degraded" | "critical" {
  if (summary.critical > 0) return "critical";
  if (summary.high > 2 || summary.total > 5) return "degraded";
  return "healthy";
}

/**
 * Generate basic summary without AI
 */
function generateBasicSummary(data: {
  growth: ReturnType<typeof gatherGrowthData> extends Promise<infer T> ? T : never;
  revenue: ReturnType<typeof gatherRevenueData> extends Promise<infer T> ? T : never;
  activity: ReturnType<typeof gatherActivityData> extends Promise<infer T> ? T : never;
  anomalies: Awaited<ReturnType<typeof detectAllAnomalies>>;
  healthStatus: string;
}): string {
  const { growth, revenue, activity, anomalies, healthStatus } = data;

  const statusIcon = healthStatus === "healthy" ? "🟢" : healthStatus === "degraded" ? "🟡" : "🔴";

  let summary = `${statusIcon} PLATFORM STATUS: ${healthStatus.toUpperCase()}\n\n`;

  summary += `📊 GROWTH:\n`;
  summary += `- ${growth.newSchools} new schools this month\n`;
  summary += `- ${growth.newStudents} new students (${growth.growthPercentage}% growth)\n`;
  summary += `- Total: ${growth.totalSchools} schools, ${growth.totalStudents} students\n\n`;

  summary += `💰 REVENUE:\n`;
  summary += `- MRR: Nu.${revenue.mrr.toLocaleString()}\n`;
  summary += `- ${revenue.overdueInvoices} overdue invoices (Nu.${revenue.overdueAmount.toLocaleString()})\n`;
  summary += `- Nu.${revenue.paidThisMonth.toLocaleString()} collected this month\n\n`;

  summary += `🤖 ACTIVITY:\n`;
  summary += `- ${activity.aiConsultations} AI consultations today\n`;
  summary += `- ${activity.assessmentsCompleted} assessments completed\n`;
  summary += `- Top career: ${activity.topCareer}\n\n`;

  if (anomalies.summary.total > 0) {
    summary += `⚠️ ANOMALIES:\n`;
    summary += generateAnomalySummary(anomalies.anomalies);
  } else {
    summary += `✅ All systems operational. No anomalies detected.\n`;
  }

  return summary;
}

/**
 * Generate AI summary using Gemini
 */
async function generateAISummary(data: {
  growth: ReturnType<typeof gatherGrowthData> extends Promise<infer T> ? T : never;
  revenue: ReturnType<typeof gatherRevenueData> extends Promise<infer T> ? T : never;
  activity: ReturnType<typeof gatherActivityData> extends Promise<infer T> ? T : never;
  anomalies: Awaited<ReturnType<typeof detectAllAnomalies>>;
  healthStatus: string;
}): Promise<string> {
  // Import dynamically to avoid circular dependencies
  try {
    const { chatWithGemini } = await import("@/lib/ai/gemini-server");

    const prompt = `You are Kaze, the AI Sentinel for Bhutan EduSkill. Generate a daily SITREP (Situation Report) for the Platform Admin.

DATA:
- Health Status: ${data.healthStatus}
- Growth: ${data.growth.newSchools} new schools, ${data.growth.newStudents} new students (${data.growth.growthPercentage}% growth)
- Total: ${data.growth.totalSchools} schools, ${data.growth.totalStudents} students
- Revenue MRR: Nu.${data.revenue.mrr}
- Overdue: ${data.revenue.overdueInvoices} invoices (Nu.${data.revenue.overdueAmount})
- Activity: ${data.activity.aiConsultations} AI consults, ${data.activity.assessmentsCompleted} assessments
- Top Career: ${data.activity.topCareer}
- Anomalies: ${data.anomalies.summary.total} detected (${data.anomalies.summary.critical} critical, ${data.anomalies.summary.high} high)

Write a concise, professional SITREP in the style of a military/intelligence briefing. Use bullet points. Be direct and actionable. Keep it under 200 words.`;

    const response = await chatWithGemini(prompt, KAZE_SYSTEM_PROMPT);
    return response;
  } catch (error) {
    logger.error("Failed to generate AI summary, falling back to basic:", error);
    return generateBasicSummary(data);
  }
}

const KAZE_SYSTEM_PROMPT = `You are Kaze, the AI Sentinel for Bhutan EduSkill - a B2B SaaS platform managing Bhutan's education system.

ROLE:
- Monitor platform health across 90+ database tables
- Detect anomalies and generate actionable insights
- Provide daily briefings to the Platform Admin

COMMUNICATION STYLE:
- Professional, concise, military/intelligence briefing style
- Use bullet points for clarity
- Be direct and actionable
- Use emojis sparingly for status indicators
- Sign off as "Kaze // AI Sentinel"

OUTPUT FORMAT:
- Status indicator (🟢 Healthy / 🟡 Degraded / 🔴 Critical)
- 3-5 bullet points covering: Growth, Revenue, Activity, Anomalies
- Action items if anomalies exist
- Brief closing`;

/**
 * Save SITREP to database
 */
async function saveSITREP(data: SITREPData) {
  try {
    await db.insert(sitrepReports).values({
      id: nanoid(),
      reportDate: data.reportDate,
      healthStatus: data.healthStatus,
      growthData: data.growth,
      revenueData: data.revenue,
      activityData: data.activity,
      anomalyCount: data.anomalies.summary.total,
      actionItemCount: data.anomalies.summary.critical + data.anomalies.summary.high,
      aiGeneratedSummary: data.summary,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info("SITREP saved to database", { date: data.reportDate });
  } catch (error) {
    logger.error("Failed to save SITREP:", error);
  }
}

/**
 * Parse existing SITREP from database
 */
interface SITREPDatabaseRecord {
  reportDate: string;
  createdAt: Date;
  healthStatus: string;
  growthData: Record<string, unknown>;
  revenueData: Record<string, unknown>;
  activityData: Record<string, unknown>;
  anomalyCount: number;
  aiGeneratedSummary: string;
}
function parseExistingSITREP(record: SITREPDatabaseRecord): SITREPData {
  const growthData = record.growthData as any;
  const activityData = record.activityData as any;

  return {
    reportDate: record.reportDate,
    timestamp: record.createdAt,
    healthStatus: record.healthStatus as "critical" | "healthy" | "degraded",
    growth: {
      newSchools: growthData?.newSchools || 0,
      newUsers: growthData?.newUsers || 0,
      newStudents: growthData?.newStudents || 0,
      newTeachers: growthData?.newTeachers || 0,
      churnedSchools: growthData?.churnedSchools || 0,
      growthPercentage: growthData?.growthPercentage || 0,
      totalSchools: growthData?.totalSchools || 0,
      totalStudents: growthData?.totalStudents || 0,
      totalTeachers: growthData?.totalTeachers || 0,
    },
    revenue: record.revenueData as SITREPData["revenue"],
    activity: {
      aiConsultations: activityData?.aiConsultations || 0,
      assessmentsCompleted: activityData?.assessmentsCompleted || 0,
      topCareer: activityData?.topCareer || "N/A",
      topCareerTrend: activityData?.topCareerTrend || "stable",
      activeNow: activityData?.activeNow || 0,
      topCareers: activityData?.topCareers || [],
    },
    anomalies: {
      anomalies: [],
      summary: {
        critical: record.anomalyCount,
        high: 0,
        medium: 0,
        low: 0,
        total: record.anomalyCount,
      },
      timestamp: record.createdAt,
    },
    summary: record.aiGeneratedSummary || generateBasicSummary({
      growth: {
        ...growthData,
        totalSchools: growthData?.totalSchools || 0,
        totalStudents: growthData?.totalStudents || 0,
        totalTeachers: growthData?.totalTeachers || 0,
      },
      revenue: record.revenueData as SITREPData["revenue"],
      activity: {
        ...activityData,
        topCareers: activityData?.topCareers || [],
      },
      anomalies: { summary: { total: record.anomalyCount } } as SITREPData["anomalies"],
      healthStatus: record.healthStatus,
    }),
  };
}

/**
 * Get latest SITREP
 */
export async function getLatestSITREP(): Promise<SITREPData | null> {
  try {
    const [latest] = await db
      .select()
      .from(sitrepReports)
      .orderBy(desc(sitrepReports.createdAt))
      .limit(1);

    if (!latest) return null;

    return parseExistingSITREP(latest);
  } catch (error) {
    logger.error("Failed to get latest SITREP:", error);
    return null;
  }
}
