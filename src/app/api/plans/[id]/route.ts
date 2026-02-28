import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users, careerPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/plans/[id] - Get single career plan
export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user } = auth;
    const { id } = await context!.params!;

    const [plan] = await db.select().from(careerPlans).where(eq(careerPlans.id, id)).limit(1);

    if (!plan) {
      return { error: "Plan not found", status: 404 };
    }

    // Check ownership - counselors and admins can view any plan
    if (user.type !== 'admin' && user.type !== 'counselor' && plan.userId !== user.id) {
      return { error: "Forbidden", status: 403 };
    }

    return { plan };
  },
  ['student', 'counselor', 'admin']
);

// PUT /api/plans/[id] - Update career plan
export const PUT = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user } = auth;

    const { id } = await context!.params!;
    const body = await request.json();
    const { targetCareer, currentPhase, shortTermGoals, longTermGoals, actionSteps, milestones, status } = body;

    const [existingPlan] = await db.select().from(careerPlans).where(eq(careerPlans.id, id)).limit(1);

    if (!existingPlan) {
      return { error: "Plan not found", status: 404 };
    }

    // Check ownership - counselors and admins can update any plan
    if (user.type !== 'admin' && user.type !== 'counselor' && existingPlan.userId !== user.id) {
      return { error: "Forbidden", status: 403 };
    }

    const [updatedPlan] = await db
      .update(careerPlans)
      .set({
        targetCareer: targetCareer ?? existingPlan.targetCareer,
        shortTermGoals: shortTermGoals ?? existingPlan.shortTermGoals,
        longTermGoals: longTermGoals ?? existingPlan.longTermGoals,
        actionSteps: actionSteps ?? existingPlan.actionSteps,
        milestones: milestones ?? existingPlan.milestones,
        status: status ?? existingPlan.status,
        updatedAt: new Date(),
      })
      .where(eq(careerPlans.id, id))
      .returning();

    return { plan: updatedPlan };
  },
  ['student', 'counselor', 'admin']
);

// DELETE /api/plans/[id] - Delete career plan
export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { user } = auth;

    const { id } = await context!.params!;

    const [existingPlan] = await db.select().from(careerPlans).where(eq(careerPlans.id, id)).limit(1);

    if (!existingPlan) {
      return { error: "Plan not found", status: 404 };
    }

    // Check ownership - counselors and admins can delete any plan
    if (user.type !== 'admin' && user.type !== 'counselor' && existingPlan.userId !== user.id) {
      return { error: "Forbidden", status: 403 };
    }

    await db.delete(careerPlans).where(eq(careerPlans.id, id));

    return { success: true };
  },
  ['student', 'counselor', 'admin']
);
