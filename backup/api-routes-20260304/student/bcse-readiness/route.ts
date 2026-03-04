import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { calculateBCSEReadiness, getBCSEReadinessSummary } from "@/lib/intelligence/bcse-tracker";
import { successResponse, notFoundResponse, errorResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/student/bcse-readiness
 *
 * Get BCSE readiness status for the current student
 * Shows: Current scores vs target, gap analysis, recommendations
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const readiness = await calculateBCSEReadiness(userId);

    if (!readiness) {
      return errorResponse("Could not calculate BCSE readiness. Please complete your RIASEC assessment.", 404);
    }

    return successResponse(readiness);
  },
  ["student"]
);
