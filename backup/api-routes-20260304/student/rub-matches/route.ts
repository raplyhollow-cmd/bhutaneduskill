import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { matchStudentToRUB, getRUBMatchesSummary } from "@/lib/intelligence/rub-matcher";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/student/rub-matches
 *
 * Get RUB college and program matches for the current student
 * Based on: RIASEC results, current grades, career interests
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const matches = await matchStudentToRUB(userId);

    if (!matches) {
      return errorResponse("Could not match to RUB programs. Please complete your RIASEC assessment.", 404);
    }

    return successResponse(matches);
  },
  ["student"]
);
