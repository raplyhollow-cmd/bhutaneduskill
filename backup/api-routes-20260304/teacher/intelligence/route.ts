/**
 * TEACHER CLASS INTELLIGENCE API
 *
 * GET /api/teacher/intelligence?classId=xxx
 * - Comprehensive class intelligence summary
 * - Performance insights, recommendations, groupings
 * - At-risk student detection
 *
 * Provides teachers with AI-powered insights to:
 * - Identify students needing support
 * - Get teaching recommendations
 * - Create effective student groups
 * - Prepare for parent meetings
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { aiInsightsGenerator } from "@/lib/intelligence/ai-insights-generator";
import { earlyWarningSystem } from "@/lib/intelligence/early-warning-system";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface IntelligenceRequest {
  classId?: string;
  studentId?: string;
  includeGroupings?: boolean;
  includeRecommendations?: boolean;
}

// ============================================================================
// GET - Class Intelligence Summary
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const includeGroupings = searchParams.get("includeGroupings") !== "false";
    const includeRecommendations = searchParams.get("includeRecommendations") !== "false";

    // Parent meeting preparation mode
    if (studentId) {
      const parentPrep = await aiInsightsGenerator.generateParentMeetingPrep(studentId);
      return successResponse({
        mode: "parent-meeting-prep",
        data: parentPrep,
      });
    }

    // Class intelligence mode
    if (!classId) {
      return badRequestResponse("classId is required (unless using studentId mode)");
    }

    // Verify teacher has access to this class
    // (In a real implementation, check if teacher teaches this class)

    try {
      const intelligence = await aiInsightsGenerator.generateClassIntelligence(classId, userId);

      // Filter out optional data if requested
      if (!includeGroupings) {
        intelligence.groupings = [];
      }
      if (!includeRecommendations) {
        intelligence.recommendations = [];
      }

      logger.info("Teacher class intelligence generated", {
        teacherId: userId,
        classId,
        atRiskCount: intelligence.atRiskStudents.length,
      });

      return successResponse(intelligence);
    } catch (error) {
      logger.error("Failed to generate class intelligence", { userId, classId, error });
      return errorResponse("Failed to generate intelligence", 500);
    }
  },
  ["teacher"]
);

// ============================================================================
// POST - Trigger Intelligence Refresh
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const body = await req.json() as IntelligenceRequest;
    const { classId, studentId } = body;

    if (studentId) {
      // Refresh specific student's risk analysis
      const analysis = await earlyWarningSystem.analyzeStudent(studentId);

      return successResponse({
        success: !!analysis,
        studentId,
        riskLevel: analysis?.riskLevel || "none",
        analysis,
      });
    }

    if (classId) {
      // Refresh entire class analysis
      const classSummary = await earlyWarningSystem.analyzeClass(classId);

      return successResponse({
        success: true,
        classId,
        summary: classSummary,
      });
    }

    return badRequestResponse("Either classId or studentId is required");
  },
  ["teacher"]
);
