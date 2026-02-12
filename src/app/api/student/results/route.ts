import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, examResultsEnhanced } from "@/lib/db/schema";
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
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current student user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

    // Get exam results
    const results = await db.query.examResultsEnhanced.findMany({
      where: eq(examResultsEnhanced.studentId, currentUser.id),
      orderBy: [desc(examResultsEnhanced.examYear), desc(examResultsEnhanced.createdAt)],
    });

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
    console.error("Student results fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results", results: [], summary: null },
      { status: 500 }
    );
  }
}
