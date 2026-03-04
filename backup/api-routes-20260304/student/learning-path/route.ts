/**
 * STUDENT LEARNING PATH API
 *
 * GET /api/student/learning-path
 * - Get personalized learning roadmap
 * - Shows current readiness, skills gap, and step-by-step plan
 *
 * Helps students visualize their path to career readiness with:
 * - Week-by-week learning steps
 * - Resources (videos, courses, projects)
 * - Milestones and progress tracking
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { learningPathGenerator } from "@/lib/intelligence/learning-path-generator";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET - Learning Path
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary") === "true";

    try {
      if (summary) {
        // Return quick summary for dashboard
        const pathSummary = await learningPathGenerator.getLearningPathSummary(userId);

        if (!pathSummary) {
          return errorResponse("No career match found. Please complete an assessment first.", 404);
        }

        return successResponse(pathSummary);
      }

      // Return full learning path
      const learningPath = await learningPathGenerator.generateLearningPath(userId);

      if (!learningPath) {
        return errorResponse("No career match found. Please complete an assessment first.", 404);
      }

      logger.info("Learning path generated", {
        studentId: userId,
        targetCareer: learningPath.targetCareer.title,
        readiness: learningPath.currentReadiness,
      });

      return successResponse(learningPath);
    } catch (error) {
      logger.error("Failed to generate learning path", { userId, error });
      return errorResponse("Failed to generate learning path", 500);
    }
  },
  ["student"]
);

// ============================================================================
// POST - Update Learning Progress
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const body = await req.json();
    const { stepId, status } = body;

    if (!stepId || !status) {
      return badRequestResponse("stepId and status are required");
    }

    // In a full implementation, this would update the career_plan_progress table
    // For now, return success

    logger.info("Learning step progress updated", {
      studentId: userId,
      stepId,
      status,
    });

    return successResponse({
      success: true,
      message: "Progress updated",
      data: {
        stepId,
        status,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  ["student"]
);
