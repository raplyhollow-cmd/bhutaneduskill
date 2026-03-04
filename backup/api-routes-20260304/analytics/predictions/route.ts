/**
 * PREDICTIVE ANALYTICS API
 *
 * GET /api/analytics/predictions?type=dropout&studentId=xxx
 * - Predict dropout risk for a student
 *
 * GET /api/analytics/predictions?type=career&studentId=xxx
 * - Predict career success probability
 *
 * GET /api/analytics/predictions?type=workforce&region=xxx
 * - National workforce projections for Ministry/Platform Admin
 *
 * Provides forward-looking insights for proactive intervention
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { predictiveEngine } from "@/lib/intelligence/predictive-engine";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET - Predictions
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId, user } = auth;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const studentId = searchParams.get("studentId");
    const region = searchParams.get("region");

    if (!type) {
      return badRequestResponse("type parameter is required (dropout, career, or workforce)");
    }

    try {
      switch (type) {
        case "dropout": {
          // Dropout risk prediction - for teachers, counselors, school admins
          if (!studentId) {
            return badRequestResponse("studentId is required for dropout prediction");
          }

          const prediction = await predictiveEngine.predictDropoutRisk(studentId);

          if (!prediction) {
            return notFoundResponse("Student");
          }

          logger.info("Dropout risk prediction generated", {
            requestedBy: userId,
            studentId,
            riskLevel: prediction.riskLevel,
          });

          return successResponse(prediction);
        }

        case "career": {
          // Career success prediction - for students, teachers, counselors
          const effectiveStudentId = studentId || userId;

          const prediction = await predictiveEngine.predictCareerSuccess(effectiveStudentId);

          if (!prediction) {
            return errorResponse("No career match found for student. Complete an assessment first.", 404);
          }

          logger.info("Career success prediction generated", {
            requestedBy: userId,
            studentId,
            career: prediction.targetCareer,
            probability: prediction.successProbability,
          });

          return successResponse(prediction);
        }

        case "workforce": {
          // Workforce projections - for ministry and platform admins
          const projection = await predictiveEngine.generateWorkforceProjection(region || undefined);

          logger.info("Workforce projection generated", {
            requestedBy: userId,
            year: projection.year,
            region: projection.region,
          });

          return successResponse(projection);
        }

        default:
          return badRequestResponse(`Invalid type: ${type}. Use dropout, career, or workforce`);
      }
    } catch (error) {
      logger.error("Failed to generate prediction", { userId, type, error });
      return errorResponse("Failed to generate prediction", 500);
    }
  },
  ["student", "teacher", "school-admin", "counselor", "admin", "ministry"]
);
