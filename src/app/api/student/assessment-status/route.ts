import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

/**
 * GET /api/student/assessment-status
 *
 * Returns the assessment status for the current student
 * Used by the AssessmentOnboarding component
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student']);

    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { user } = authResult;

    // Check if user has completed any assessments
    // This is a simplified check - in production you'd query the assessments table
    const hasCompletedAssessments = user.onboardingComplete === true;

    return NextResponse.json({
      data: {
        hasCompletedAssessments,
        studentId: user.id,
        needsAssessment: !hasCompletedAssessments,
      },
    });
  } catch (error: any) {
    console.error('Assessment status error:', error);
    return NextResponse.json(
      { error: 'Failed to check assessment status', hasCompletedAssessments: false, needsAssessment: true },
      { status: 500 }
    );
  }
}
