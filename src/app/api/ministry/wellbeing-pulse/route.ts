/**
 * MINISTRY WELLBEING PULSE API
 * GET /api/ministry/wellbeing-pulse
 *
 * Returns anonymized well-being data for Ministry monitoring
 * Aggregated by dzongkhag, school level, intervention category
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { counselingSessions, redFlags, schools, users } from "@/lib/db/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";
import { NextRequest } from "next/server";

// ============================================================================
// TYPES
// ============================================================================

interface SqlRow {
  [key: string]: string | number | null;
}

interface DzongkhagBreakdownItem {
  dzongkhag: string;
  totalStudents: number;
  sessionsCompleted: number;
  crisisInterventions: number;
  interventionRate: number;
}

interface SchoolLevelBreakdownItem {
  schoolLevel: string;
  totalStudents: number;
  sessionsCompleted: number;
  crisisInterventions: number;
}

interface RedFlagsBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TopConcernItem {
  concern: string;
  frequency: number;
}

interface RedFlagsByLocation {
  [dzongkhag: string]: RedFlagsBySeverity;
}

interface WellbeingPulseResponse {
  period: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalSessions: number;
    trend: "increasing" | "decreasing" | "stable";
    change: number;
  };
  byDzongkhag: DzongkhagBreakdownItem[];
  bySchoolLevel: SchoolLevelBreakdownItem[];
  redFlags: {
    bySeverity: RedFlagsBySeverity;
    byLocation: RedFlagsByLocation;
  };
  topConcerns: TopConcernItem[];
}

/**
 * GET /api/ministry/wellbeing-pulse
 *
 * Returns anonymized well-being data for Ministry monitoring
 * Aggregated by dzongkhag, school level, intervention category
 */
export const GET = createApiRoute(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const dzongkhag = searchParams.get("dzongkhag");
    const period = searchParams.get("period") || "90"; // days
    const aggregateBy = searchParams.get("aggregateBy") || "dzongkhag"; // dzongkhag, school_level, category

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(period));

    // Aggregate by dzongkhag
    const dzongkhagData = await db.execute(sql`
      SELECT
        s.dzongkhag,
        COUNT(DISTINCT cs.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN cs.status = 'completed' THEN cs.id END) as sessions_completed,
        COUNT(DISTINCT CASE WHEN cs.type = 'crisis' THEN cs.id END) as crisis_interventions,
        COUNT(DISTINCT CASE WHEN cs.type = 'individual' THEN cs.id END) as individual_sessions,
        COUNT(DISTINCT CASE WHEN cs.type = 'group' THEN cs.id END) as group_sessions,
        COUNT(DISTINCT CASE WHEN cs.type = 'family' THEN cs.id END) as family_sessions
      FROM counseling_sessions cs
      JOIN users u ON u.id = cs.student_id
      JOIN students st ON st.user_id = u.id
      JOIN schools s ON s.id = st.school_id
      WHERE cs.created_at >= ${cutoffDate.toISOString()}
        ${dzongkhag ? sql`AND s.dzongkhag = ${dzongkhag}` : sql``}
      GROUP BY s.dzongkhag
      ORDER BY s.dzongkhag
    `);

    // Aggregate by school level
    const schoolLevelData = await db.execute(sql`
      SELECT
        s.level as school_level,
        COUNT(DISTINCT cs.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN cs.status = 'completed' THEN cs.id END) as sessions_completed,
        COUNT(DISTINCT CASE WHEN cs.type = 'crisis' THEN cs.id END) as crisis_interventions
      FROM counseling_sessions cs
      JOIN users u ON u.id = cs.student_id
      JOIN students st ON st.user_id = u.id
      JOIN schools s ON s.id = st.school_id
      WHERE cs.created_at >= ${cutoffDate.toISOString()}
        ${dzongkhag ? sql`AND s.dzongkhag = ${dzongkhag}` : sql``}
      GROUP BY s.level
      ORDER BY s.level
    `);

    // Get red flags summary (anonymized - no student names)
    const redFlagsSummary = await db.execute(sql`
      SELECT
        s.dzongkhag,
        rf.severity,
        rf.flag_type,
        COUNT(*) as count,
        COUNT(DISTINCT rf.student_id) as unique_students
      FROM red_flags rf
      JOIN schools s ON s.id = rf.school_id
      WHERE rf.created_at >= ${cutoffDate.toISOString()}
        AND rf.status = 'flagged'
        ${dzongkhag ? sql`AND s.dzongkhag = ${dzongkhag}` : sql``}
      GROUP BY s.dzongkhag, rf.severity, rf.flag_type
      ORDER BY s.dzongkhag, rf.severity
    `);

    // Calculate trend (compare to previous period)
    const previousCutoff = new Date(cutoffDate);
    previousCutoff.setDate(previousCutoff.getDate() - parseInt(period));

    const currentPeriod = await db.execute(sql`
      SELECT COUNT(*) as count FROM counseling_sessions
      WHERE created_at >= ${cutoffDate.toISOString()}
        AND created_at < NOW()
    `);

    const previousPeriod = await db.execute(sql`
      SELECT COUNT(*) as count FROM counseling_sessions
      WHERE created_at >= ${previousCutoff.toISOString()}
        AND created_at < ${cutoffDate.toISOString()}
    `);

    const currentCount = parseInt((currentPeriod.rows[0]?.count as string | undefined) || "0");
    const previousCount = parseInt((previousPeriod.rows[0]?.count as string | undefined) || "0");
    const trend = currentCount > previousCount ? "increasing" : currentCount < previousCount ? "decreasing" : "stable";

    // Top concerns from session topics (anonymized word cloud)
    const topConcerns = await db.execute(sql`
      SELECT
        TRIM(UNNEST(STRING_TO_ARRAY(cs.topic, ','))) as concern,
        COUNT(*) as frequency
      FROM counseling_sessions cs
      WHERE cs.created_at >= ${cutoffDate.toISOString()}
        AND cs.topic IS NOT NULL
      GROUP BY TRIM(UNNEST(STRING_TO_ARRAY(cs.topic, ',')))
      ORDER BY frequency DESC
      LIMIT 10
    `);

    // Format response
    const dzongkhagBreakdown: DzongkhagBreakdownItem[] = dzongkhagData.rows.map((row: SqlRow) => ({
      dzongkhag: String(row.dzongkhag ?? ""),
      totalStudents: parseInt(String(row.total_students ?? "0")),
      sessionsCompleted: parseInt(String(row.sessions_completed ?? "0")),
      crisisInterventions: parseInt(String(row.crisis_interventions ?? "0")),
      interventionRate: typeof row.total_students === "number" && row.total_students > 0
        ? Math.round((parseInt(String(row.sessions_completed ?? "0")) / row.total_students) * 100)
        : 0,
    }));

    const schoolLevelBreakdown: SchoolLevelBreakdownItem[] = schoolLevelData.rows.map((row: SqlRow) => ({
      schoolLevel: String(row.school_level ?? ""),
      totalStudents: parseInt(String(row.total_students ?? "0")),
      sessionsCompleted: parseInt(String(row.sessions_completed ?? "0")),
      crisisInterventions: parseInt(String(row.crisis_interventions ?? "0")),
    }));

    const redFlagsBySeverity: RedFlagsBySeverity = {
      critical: redFlagsSummary.rows.filter((r: SqlRow) => r.severity === "critical").reduce((sum, r: SqlRow) => sum + parseInt(String(r.count ?? "0")), 0),
      high: redFlagsSummary.rows.filter((r: SqlRow) => r.severity === "high").reduce((sum, r: SqlRow) => sum + parseInt(String(r.count ?? "0")), 0),
      medium: redFlagsSummary.rows.filter((r: SqlRow) => r.severity === "medium").reduce((sum, r: SqlRow) => sum + parseInt(String(r.count ?? "0")), 0),
      low: redFlagsSummary.rows.filter((r: SqlRow) => r.severity === "low").reduce((sum, r: SqlRow) => sum + parseInt(String(r.count ?? "0")), 0),
    };

    const topConcernsList: TopConcernItem[] = topConcerns.rows.map((row: SqlRow) => ({
      concern: String(row.concern ?? ""),
      frequency: parseInt(String(row.frequency ?? "0")),
    }));

    const byLocation: RedFlagsByLocation = redFlagsSummary.rows.reduce<RedFlagsByLocation>((acc, row: SqlRow) => {
      const dzongkhag = String(row.dzongkhag ?? "");
      const severity = String(row.severity ?? "") as keyof RedFlagsBySeverity;
      const count = parseInt(String(row.count ?? "0"));

      if (!acc[dzongkhag]) {
        acc[dzongkhag] = { critical: 0, high: 0, medium: 0, low: 0 };
      }
      if (severity === "critical" || severity === "high" || severity === "medium" || severity === "low") {
        acc[dzongkhag][severity] = count;
      }
      return acc;
    }, {} as RedFlagsByLocation);

    const responseData: WellbeingPulseResponse = {
      period: {
        start: cutoffDate.toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
        days: parseInt(period),
      },
      summary: {
        totalSessions: currentCount,
        trend: trend as "increasing" | "decreasing" | "stable",
        change: previousCount > 0 ? Math.round(((currentCount - previousCount) / previousCount) * 100) : 0,
      },
      byDzongkhag: dzongkhagBreakdown,
      bySchoolLevel: schoolLevelBreakdown,
      redFlags: {
        bySeverity: redFlagsBySeverity,
        byLocation,
      },
      topConcerns: topConcernsList,
    };

    return { data: responseData };
  },
  ["admin", "ministry"]
);
