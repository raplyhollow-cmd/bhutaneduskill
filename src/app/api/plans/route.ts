/**
 * CAREER PLANS API
 *
 * GET /api/plans - Get user's career plans
 * POST /api/plans - Create career plan
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { careerPlans } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, createdResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET - Get user's career plans
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;

    // Use direct select instead of query (relations not configured)
    const plans = await db
      .select()
      .from(careerPlans)
      .where(eq(careerPlans.userId, user.id))
      .orderBy(desc(careerPlans.createdAt))
      .limit(10);

    return successResponse({ plans });
  },
  ['student', 'counselor', 'admin']
);

// ============================================================================
// POST - Create career plan
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;

    try {
      const body = await request.json();
      const { targetCareer, currentPhase, shortTermGoals, longTermGoals, actionSteps, milestones } = body;

      const [plan] = await db
        .insert(careerPlans)
        .values({
          id: `plan_${Date.now()}`,
          userId: user.id,
          studentId: user.id,
          targetCareer: targetCareer || "Not specified",
          targetCareerId: `career_${Date.now()}`,
          shortTermGoals: shortTermGoals || [],
          longTermGoals: longTermGoals || [],
          subjects: [],
          milestones: milestones || [],
          notes: "",
          counselorNotes: "",
          counselorId: user.type === "counselor" ? user.id : null,
          currentPhase: currentPhase || "self_assessment",
          actionSteps: actionSteps || [],
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return createdResponse({ success: true, plan });
    } catch (error) {
      logger.apiError(error, { route: "/api/plans", method: "POST" });
      return errorResponse("Failed to create plan", 500);
    }
  },
  ['student', 'counselor', 'admin']
);
