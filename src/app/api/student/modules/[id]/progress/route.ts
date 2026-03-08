/**
 * STUDENT MODULE PROGRESS API
 *
 * POST /api/student/modules/[id]/progress
 * Updates the student's progress in a module
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

export const POST = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id } = await context.params;

    const body = await request.json();
    const { lessonId, completed, timeSpent } = body;

    // Validate required fields
    if (!lessonId || typeof completed !== "boolean") {
      return badRequestResponse("Missing required fields: lessonId, completed");
    }

    // In a real implementation, this would:
    // 1. Store the progress in a user_module_progress table
    // 2. Update the overall module progress percentage

    return successResponse({
      success: true,
      progress: {
        moduleId: id,
        lessonId,
        completed,
        timeSpent: timeSpent || 0,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  ['student']
);
