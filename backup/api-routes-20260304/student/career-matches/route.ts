import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { careerMatches, assessments, riasecResults, mbtiResults, users } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/student/career-matches
 *
 * Returns the student's personalized career matches based on their assessment results.
 * This replaces the static CAREERS_DATABASE with real student-specific data.
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    // Get student's completed assessments
    const userAssessments = await db
      .select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.status, 'completed')
      ))
      .orderBy(desc(assessments.completedAt))
      .limit(10);

    if (userAssessments.length === 0) {
      return {
        hasAssessments: false,
        careerMatches: [],
        message: "Complete assessments to see your personalized career matches"
      };
    }

    // Get all assessment IDs
    const assessmentIds = userAssessments.map(a => a.id);

    // Get student's career matches - CRITICAL: Filter by studentId
    const matches = await db
      .select()
      .from(careerMatches)
      .where(and(
        inArray(careerMatches.assessmentId, assessmentIds),
        eq(careerMatches.studentId, userId) // CRITICAL: Only get this student's matches
      ))
      .orderBy(desc(careerMatches.matchScore))
      .limit(20);

    // Get RIASEC results for additional context
    const [riasecResult] = await db
      .select()
      .from(riasecResults)
      .where(eq(riasecResults.userId, userId))
      .orderBy(desc(riasecResults.createdAt))
      .limit(1);

    // Get user profile for context
    const [user] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        classGrade: users.classGrade,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

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

    return {
      hasAssessments: true,
      assessmentCount: userAssessments.length,
      careerMatches: careerMatchesWithDetails,
      hollandCode: riasecResult?.hollandCode || null,
      studentName: `${user?.firstName || 'Student'} ${user?.lastName || ''}`.trim(),
    };
  },
  ["student"]
);
