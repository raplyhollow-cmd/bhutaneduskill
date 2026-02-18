import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { examResultsEnhanced } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/student/results - Get student's exam results
 *
 * Returns:
 * - All exam results for the student
 * - Subject-wise marks
 * - Aggregate results (total percentage, division, rank)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['student', 'teacher', 'counselor', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
    // Get exam results - use select() instead of query since examResultsEnhanced has no relations defined
    const results = await db
      .select()
      .from(examResultsEnhanced)
      .where(eq(examResultsEnhanced.studentId, userId))
      .orderBy(desc(examResultsEnhanced.examYear), desc(examResultsEnhanced.createdAt));

    if (!results || results.length === 0) {
      return NextResponse.json({ results: [], summary: null });
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

    return NextResponse.json({ results, summary });
  } catch (error) {
    logger.error("Student results fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results", results: [], summary: null },
      { status: 500 }
    );
  }
}
