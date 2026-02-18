import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { assessments, users } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { parseJsonArray } from "@/lib/db/json-helpers";

/**
 * Student Onboarding Status API
 *
 * Checks if a student has completed required assessments.
 * Used by the frontend to determine if the assessment onboarding modal should be shown.
 *
 * Returns:
 * - isFirstTime: true if student has completed < 3 assessments
 * - hasCompletedAssessments: true if student has 3+ assessments
 * - completedAssessments: count of completed assessments
 * - requiredAssessments: minimum required (default: 3)
 * - profileComplete: true if interests, goals, and grade are set
 * - canProceed: true if assessments complete AND profile is complete
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }
    const { userId } = authResult;

    // Check assessment completion count
    const [completedCount] = await db
      .select({ count: count() })
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.status, 'completed')
        )
      );

    const assessmentCount = Number(completedCount?.count) || 0;

    // Required assessments: RIASEC + MBTI + Work Values minimum
    const REQUIRED_ASSESSMENTS = 3;

    const hasCompletedAssessments = assessmentCount >= REQUIRED_ASSESSMENTS;
    const isFirstTime = !hasCompletedAssessments;

    // Check user profile completeness
    const [user] = await db
      .select({
        interests: users.interests,
        goals: users.goals,
        grade: users.grade,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Safely parse interests (JSON field) and check goals (TEXT field)
    const interests = parseJsonArray<string>(user?.interests as string | string[] | null | undefined);
    const goals = user?.goals || "";

    const profileComplete = !!(
      interests.length > 0 &&
      goals.length > 0 &&
      user?.grade &&
      user?.grade > 0
    );

    logger.info("Student onboarding status checked", {
      userId,
      isFirstTime,
      assessmentCount,
      profileComplete,
    });

    return NextResponse.json({
      isFirstTime,
      hasCompletedAssessments,
      completedAssessments: assessmentCount,
      requiredAssessments: REQUIRED_ASSESSMENTS,
      profileComplete,
      canProceed: hasCompletedAssessments && profileComplete,
      // Assessment-specific status for progress tracking
      assessmentProgress: {
        riasec: assessmentCount >= 1, // Simplified - actual would check specific types
        mbti: assessmentCount >= 2,
        workValues: assessmentCount >= 3,
        learningStyles: assessmentCount >= 4,
        disc: assessmentCount >= 5,
      }
    });
  } catch (error) {
    logger.error(error, { route: "/api/student/onboarding/status", method: "GET" });
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}
