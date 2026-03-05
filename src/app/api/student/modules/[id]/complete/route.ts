/**
 * STUDENT MODULE COMPLETE API
 *
 * POST /api/student/modules/[id]/complete
 * Marks a module as completed for the student
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

export const POST = createApiRoute(
  async (request: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context.params;

    const body = await request.json();
    const { score, answers } = body;

    // Validate score if provided
    if (score !== undefined && (typeof score !== "number" || score < 0 || score > 100)) {
      return badRequestResponse("Score must be a number between 0 and 100");
    }

    // In a real implementation, this would:
    // 1. Store the completion in a user_modules table
    // 2. Issue a certificate
    // 3. Update the user's progress

    return successResponse({
      success: true,
      message: "Module completed successfully",
      completion: {
        moduleId: id,
        userId,
        score: score || null,
        completedAt: new Date().toISOString(),
        certificateIssued: true,
        certificateUrl: `/api/student/modules/${id}/certificate`,
      },
    });
  },
  ['student']
);
