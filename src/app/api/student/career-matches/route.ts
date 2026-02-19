import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { careerMatches, assessments, riasecResults, mbtiResults, users } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * GET /api/student/career-matches
 *
 * Returns the student's personalized career matches based on their assessment results.
 * This replaces the static CAREERS_DATABASE with real student-specific data.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const { userId } = authResult;

    // Get student's completed assessments
    const userAssessments = await db.query.assessments.findMany({
      where: and(
        eq(assessments.userId, userId),
        eq(assessments.status, 'completed')
      ),
      orderBy: [desc(assessments.completedAt)],
      limit: 10,
    });

    if (userAssessments.length === 0) {
      return NextResponse.json({
        hasAssessments: false,
        careerMatches: [],
        message: "Complete assessments to see your personalized career matches"
      });
    }

    // Get all assessment IDs
    const assessmentIds = userAssessments.map(a => a.id);

    // Get student's career matches - CRITICAL: Filter by studentId
    const matches = await db.query.careerMatches.findMany({
      where: and(
        inArray(careerMatches.assessmentId, assessmentIds),
        eq(careerMatches.studentId, userId) // CRITICAL: Only get this student's matches
      ),
      orderBy: [desc(careerMatches.matchScore)],
      limit: 20,
    });

    // Get RIASEC results for additional context
    const riasecResult = await db.query.riasecResults.findFirst({
      where: eq(riasecResults.userId, userId),
      orderBy: [desc(riasecResults.createdAt)],
    });

    // Get user profile for context
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        firstName: true,
        lastName: true,
        classGrade: true,
      },
    });

    // Transform matches with full career details
    const careerMatchesWithDetails = matches.map((match) => {
      // Parse career ID to get readable name
      const careerIdParts = match.careerId.split('-');
      const careerName = careerIdParts
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        id: match.id,
        careerId: match.careerId,
        careerTitle: match.careerTitle || careerName,
        matchScore: match.matchScore,
        matchReason: match.matchReason,
        isTopMatch: match.isTopMatch,
        assessmentType: match.assessmentType,
        assessmentId: match.assessmentId,
      };
    });

    return NextResponse.json({
      hasAssessments: true,
      assessmentCount: userAssessments.length,
      careerMatches: careerMatchesWithDetails,
      hollandCode: riasecResult?.hollandCode || null,
      studentName: `${user?.firstName || 'Student'} ${user?.lastName || ''}`.trim(),
    });
  } catch (error) {
    logger.error(error, { route: "/api/student/career-matches", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch career matches" },
      { status: 500 }
    );
  }
}
