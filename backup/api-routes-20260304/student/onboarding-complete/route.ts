/**
 * STUDENT ONBOARDING COMPLETE API
 *
 * POST /api/student/onboarding-complete
 *
 * Marks the student's onboarding as complete (after all assessments done)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    await db
      .update(users)
      .set({
        onboardingComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info("Student onboarding marked complete", { userId });

    return successResponse({
      message: "Onboarding marked complete",
    });
  },
  ["student"]
);
