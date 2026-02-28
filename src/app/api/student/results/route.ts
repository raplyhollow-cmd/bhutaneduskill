import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { examResultsEnhanced } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/results - Get student's exam results
 *
 * Returns:
 * - All exam results for the student
 * - Subject-wise marks
 * - Aggregate results (total percentage, division, rank)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    // Get exam results - use select() instead of query since examResultsEnhanced has no relations defined
    // Try both studentId and userId fields since the schema has both
    const results = await db
      .select()
      .from(examResultsEnhanced)
      .where(eq(examResultsEnhanced.userId, userId))
      .orderBy(desc(examResultsEnhanced.examYear), desc(examResultsEnhanced.createdAt));

    logger.info("Student results fetched", {
      route: "/api/student/results",
      userId,
      resultsCount: results.length,
    });

    if (!results || results.length === 0) {
      return { results: [], summary: null };
    }

    // Calculate aggregate summary
    const totalExams = results.length;
    const latestResult = results[0];
    const averagePercentage = results.reduce((sum, r) => sum + (r.overallPercentage || 0), 0) / results.length;

    // Find best and worst performance
    const bestResult = results.reduce((best, current) =>
      (current.overallPercentage || 0) > (best.overallPercentage || 0) ? current : best
    );
    const worstResult = results.reduce((worst, current) =>
      (current.overallPercentage || 0) < (worst.overallPercentage || 0) ? current : worst
    );

    const summary = {
      totalExams,
      averagePercentage: Math.round(averagePercentage),
      bestResult: {
        examName: bestResult.examName,
        overallPercentage: bestResult.overallPercentage,
        division: bestResult.division,
        examYear: bestResult.examYear,
      },
      worstResult: {
        examName: worstResult.examName,
        overallPercentage: worstResult.overallPercentage,
        division: worstResult.division,
        examYear: worstResult.examYear,
      },
      latestResult: latestResult ? {
        examName: latestResult.examName,
        overallPercentage: latestResult.overallPercentage,
        division: latestResult.division,
        examYear: latestResult.examYear,
      } : null,
    };

    return { results, summary };
  },
  ["student", "teacher", "counselor", "admin"]
);
