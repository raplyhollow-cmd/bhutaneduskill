/**
 * MINISTRY SCHOOL COMPARISON API
 * GET /api/ministry/analytics/school-comparison - Compare schools by GNH metrics
 *
 * Provides school-level GNH metrics comparison:
 * - Top performing schools by GNH score
 * - Schools needing support (bottom performers)
 * - Year-over-year comparison (placeholder for future historical data)
 * - Risk level breakdown
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  schools,
  assessmentSubmissions,
  attendance,
  studentInterventions,
  redFlags,
} from "@/lib/db/schema";
import { eq, and, sql, count, avg, desc, inArray } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface SchoolGNHMetrics {
  schoolId: string;
  schoolName: string;
  dzongkhag: string;
  studentCount: number;
  gnhScore: number;
  mentalHealthIndex: number;
  attendanceRate: number;
  academicPerformance: number;
  socialCooperation: number;
  emotionalStability: number;
  riskLevel: "low" | "medium" | "high";
  interventionCount: number;
  redFlagCount: number;
  rank: number;
  change?: number; // Year-over-year change
}

interface SchoolComparisonResponse {
  topPerformers: SchoolGNHMetrics[];
  needsSupport: SchoolGNHMetrics[];
  nationalAverage: {
    gnhScore: number;
    mentalHealth: number;
    attendance: number;
    academic: number;
    social: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  totalSchools: number;
  timestamp: string;
}

// ============================================================================
// GNH CALCULATION HELPERS (reused from GNH API)
// ============================================================================

function calculateMentalHealthIndex(
  interventionCount: number,
  studentCount: number,
  redFlagCount: number,
  activeInterventionCount: number
): number {
  let score = 100;
  const interventionRate = studentCount > 0 ? interventionCount / studentCount : 0;
  score -= Math.min(interventionRate * 15, 20);
  const activeRate = studentCount > 0 ? activeInterventionCount / studentCount : 0;
  score -= Math.min(activeRate * 10, 15);
  const redFlagRate = studentCount > 0 ? redFlagCount / studentCount : 0;
  score -= Math.min(redFlagRate * 25, 30);
  return Math.max(30, Math.min(95, Math.round(score)));
}

function calculateAttendanceRate(presentCount: number, totalRecords: number): number {
  if (totalRecords === 0) return 85;
  const rate = (presentCount / totalRecords) * 100;
  return Math.max(50, Math.min(100, Math.round(rate)));
}

function calculateAcademicPerformance(
  completedAssessments: number,
  totalAssessments: number,
  avgScore: number | null
): number {
  if (totalAssessments === 0) return 65;
  const completionRate = (completedAssessments / totalAssessments) * 100;
  const scoreAvg = avgScore ?? 75;
  return Math.round((completionRate * 0.4) + (scoreAvg * 0.6));
}

function calculateSocialCooperation(
  academicPerformance: number,
  behavioralInterventionCount: number,
  socialInterventionCount: number,
  studentCount: number
): number {
  let score = academicPerformance * 0.9 + 10;
  const interventionRate = studentCount > 0
    ? (behavioralInterventionCount + socialInterventionCount) / studentCount
    : 0;
  score -= Math.min(interventionRate * 20, 25);
  return Math.max(40, Math.min(95, Math.round(score)));
}

function calculateGNHScore(
  mentalHealth: number,
  attendance: number,
  academic: number,
  social: number,
  emotionalStability: number
): number {
  return Math.round(
    mentalHealth * 0.30 +
    attendance * 0.25 +
    academic * 0.20 +
    social * 0.15 +
    emotionalStability * 0.10
  );
}

function getRiskLevel(gnhScore: number): "low" | "medium" | "high" {
  if (gnhScore >= 70) return "low";
  if (gnhScore >= 60) return "medium";
  return "high";
}

// ============================================================================
// GET HANDLER
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sortBy = url.searchParams.get("sortBy") || "gnhScore"; // gnhScore | attendance | mentalHealth | academic

    logger.info("Ministry school comparison accessed", {
      route: "/api/ministry/analytics/school-comparison",
      userId,
      limit,
      sortBy,
    });

    // ============================================================================
    // STEP 1: Get all active schools
    // ============================================================================

    const allSchools = await db.select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      city: schools.city,
    }).from(schools).where(eq(schools.isActive, true));

    // ============================================================================
    // STEP 2: Calculate GNH metrics for each school
    // ============================================================================

    const schoolMetrics: SchoolGNHMetrics[] = [];

    for (const school of allSchools) {
      // Get students for this school
      const students = await db.select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.type, "student"),
            eq(users.schoolId, school.id),
            eq(users.isActive, true)
          )
        );

      const studentIds = students.map(s => s.id);
      const studentCount = studentIds.length;

      // Skip schools with no students
      if (studentCount === 0) continue;

      // ========================================================================
      // Get attendance data
      // ========================================================================

      const attendanceData = await db.select({
        presentCount: count(
          sql`CASE WHEN ${attendance.status} = 'present' THEN 1 END`
        ),
        totalRecords: count(),
      })
        .from(attendance)
        .where(eq(attendance.schoolId, school.id));

      const attendanceRate = calculateAttendanceRate(
        attendanceData[0]?.presentCount ?? 0,
        attendanceData[0]?.totalRecords ?? 0
      );

      // ========================================================================
      // Get academic performance data
      // ========================================================================

      const assessmentData = await db.select({
        total: count(),
        completed: count(
          sql`CASE WHEN ${assessmentSubmissions.status} IN ('submitted', 'graded') THEN 1 END`
        ),
        avgScore: sql<number>`CAST(AVG(${assessmentSubmissions.score}) AS INTEGER)`,
      })
        .from(assessmentSubmissions)
        .innerJoin(users, eq(assessmentSubmissions.userId, users.id))
        .where(eq(users.schoolId, school.id));

      const academicPerformance = calculateAcademicPerformance(
        assessmentData[0]?.completed ?? 0,
        assessmentData[0]?.total ?? 0,
        assessmentData[0]?.avgScore ?? null
      );

      // ========================================================================
      // Get intervention and red flag data
      // ========================================================================

      const interventionData = await db.select({
        total: count(),
        active: count(
          sql`CASE WHEN ${studentInterventions.status} IN ('active', 'monitoring') THEN 1 END`
        ),
        behavioral: count(
          sql`CASE WHEN ${studentInterventions.type} = 'behavioral' THEN 1 END`
        ),
        social: count(
          sql`CASE WHEN ${studentInterventions.type} = 'social' THEN 1 END`
        ),
      })
        .from(studentInterventions)
        .where(eq(studentInterventions.schoolId, school.id));

      const redFlagData = await db.select({
        count: count(),
      })
        .from(redFlags)
        .where(
          and(
            eq(redFlags.schoolId, school.id),
            sql`${redFlags.status} IN ('flagged', 'intervention_planned')`
          )
        );

      // ========================================================================
      // Calculate all GNH components
      // ========================================================================

      const mentalHealthIndex = calculateMentalHealthIndex(
        interventionData[0]?.total ?? 0,
        studentCount,
        redFlagData[0]?.count ?? 0,
        interventionData[0]?.active ?? 0
      );

      const socialCooperation = calculateSocialCooperation(
        academicPerformance,
        interventionData[0]?.behavioral ?? 0,
        interventionData[0]?.social ?? 0,
        studentCount
      );

      const emotionalStability = Math.round(
        (mentalHealthIndex * 0.6) + (academicPerformance * 0.3) + 10
      );
      const clampedEmotionalStability = Math.max(40, Math.min(95, emotionalStability));

      const gnhScore = calculateGNHScore(
        mentalHealthIndex,
        attendanceRate,
        academicPerformance,
        socialCooperation,
        clampedEmotionalStability
      );

      const riskLevel = getRiskLevel(gnhScore);

      schoolMetrics.push({
        schoolId: school.id,
        schoolName: school.name,
        dzongkhag: school.state || school.city || "Bhutan",
        studentCount,
        gnhScore,
        mentalHealthIndex,
        attendanceRate,
        academicPerformance,
        socialCooperation,
        emotionalStability: clampedEmotionalStability,
        riskLevel,
        interventionCount: interventionData[0]?.total ?? 0,
        redFlagCount: redFlagData[0]?.count ?? 0,
        rank: 0, // Will be set after sorting
      });
    }

    // ============================================================================
    // STEP 3: Sort and rank schools
    // ============================================================================

    // Sort by the requested metric
    schoolMetrics.sort((a, b) => {
      switch (sortBy) {
        case "attendance":
          return b.attendanceRate - a.attendanceRate;
        case "mentalHealth":
          return b.mentalHealthIndex - a.mentalHealthIndex;
        case "academic":
          return b.academicPerformance - a.academicPerformance;
        default:
          return b.gnhScore - a.gnhScore;
      }
    });

    // Assign ranks
    schoolMetrics.forEach((school, index) => {
      school.rank = index + 1;
    });

    // ============================================================================
    // STEP 4: Calculate national averages
    // ============================================================================

    const totalSchools = schoolMetrics.length;
    const nationalAverage = {
      gnhScore: totalSchools > 0
        ? Math.round(schoolMetrics.reduce((sum, s) => sum + s.gnhScore, 0) / totalSchools)
        : 70,
      mentalHealth: totalSchools > 0
        ? Math.round(schoolMetrics.reduce((sum, s) => sum + s.mentalHealthIndex, 0) / totalSchools)
        : 70,
      attendance: totalSchools > 0
        ? Math.round(schoolMetrics.reduce((sum, s) => sum + s.attendanceRate, 0) / totalSchools)
        : 85,
      academic: totalSchools > 0
        ? Math.round(schoolMetrics.reduce((sum, s) => sum + s.academicPerformance, 0) / totalSchools)
        : 70,
      social: totalSchools > 0
        ? Math.round(schoolMetrics.reduce((sum, s) => sum + s.socialCooperation, 0) / totalSchools)
        : 75,
    };

    // ============================================================================
    // STEP 5: Get risk distribution
    // ============================================================================

    const riskDistribution = {
      low: schoolMetrics.filter(s => s.riskLevel === "low").length,
      medium: schoolMetrics.filter(s => s.riskLevel === "medium").length,
      high: schoolMetrics.filter(s => s.riskLevel === "high").length,
    };

    // ============================================================================
    // STEP 6: Prepare response
    // ============================================================================

    // Top performers (top N by rank)
    const topPerformers = schoolMetrics.slice(0, limit);

    // Schools needing support (bottom N, highest risk)
    const needsSupport = [...schoolMetrics]
      .sort((a, b) => a.gnhScore - b.gnhScore)
      .slice(0, limit)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    const response: SchoolComparisonResponse = {
      topPerformers,
      needsSupport,
      nationalAverage,
      riskDistribution,
      totalSchools,
      timestamp: new Date().toISOString(),
    };

    logger.info("Ministry school comparison retrieved successfully", {
      route: "/api/ministry/analytics/school-comparison",
      userId,
      totalSchools,
      topScore: topPerformers[0]?.gnhScore ?? 0,
    });

    return successResponse(response);
  },
  ['ministry', 'admin']
);
