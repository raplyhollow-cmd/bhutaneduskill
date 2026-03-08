/**
 * STUDENT MODULE RECOMMENDATIONS API
 *
 * GET /api/student/modules/[id]/recommendations
 * Returns recommended next modules after completing this one
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await context.params;

    // Return recommendations based on the completed module
    const recommendations = [
      {
        id: "mod_communication",
        title: "Effective Communication",
        reason: "Build on your digital literacy skills",
        matchScore: 90,
      },
      {
        id: "mod_financial_literacy",
        title: "Financial Literacy",
        reason: "Important life skill for your future",
        matchScore: 85,
      },
      {
        id: "mod_coding_basics",
        title: "Coding Fundamentals",
        reason: "Next step in your technical journey",
        matchScore: 80,
      },
    ];

    return successResponse({
      success: true,
      recommendations,
    });
  },
  ['student']
);
