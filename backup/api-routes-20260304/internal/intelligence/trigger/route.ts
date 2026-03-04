import { NextRequest, NextResponse } from "next/server";
import { triggerAssessmentComplete, triggerGradePosted, checkAttendancePatterns } from "@/lib/intelligence/engine";
import { logger } from "@/lib/logger";
import { verifyInternalApiKey } from "@/lib/api/internal-auth";

/**
 * POST /api/internal/intelligence/trigger
 *
 * Internal endpoint to trigger intelligence generation.
 * Called by various services when events occur.
 *
 * This endpoint is protected by an internal API key.
 *
 * Body:
 * {
 *   triggerType: "assessment_complete" | "grade_posted" | "check_attendance",
 *   data: { ... }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify internal API key
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    if (!verifyInternalApiKey(apiKey)) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await req.json();
    const { triggerType, data } = body as { triggerType: string; data: Record<string, unknown> };

    logger.info(`Intelligence trigger: ${triggerType}`);

    switch (triggerType) {
      case "assessment_complete":
        await triggerAssessmentComplete({
          userId: data.userId as string,
          assessmentType: data.assessmentType as string,
          assessmentId: data.assessmentId as string,
          result: data.result as Record<string, unknown>,
        });
        break;

      case "grade_posted":
        await triggerGradePosted({
          studentId: data.studentId as string,
          subject: data.subject as string,
          grade: data.grade as string,
          score: data.score as number,
          teacherId: data.teacherId as string,
        });
        break;

      case "check_attendance":
        await checkAttendancePatterns(data.studentId as string);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown trigger type: ${triggerType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Trigger ${triggerType} processed`,
    });
  } catch (error) {
    logger.error(`Intelligence trigger error: ${error}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
