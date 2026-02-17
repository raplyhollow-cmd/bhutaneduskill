import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, careerPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/plans/[id] - Get single career plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(['student', 'counselor', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    const plan = await db.query.careerPlans.findFirst({
      where: eq(careerPlans.id, id),
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check ownership - counselors and admins can view any plan
    if (user.type !== 'admin' && user.type !== 'counselor' && plan.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Career plan fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

// PUT /api/plans/[id] - Update career plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(['student', 'counselor', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    const body = await request.json();
    const { targetCareer, currentPhase, shortTermGoals, longTermGoals, actionSteps, milestones, status } = body;

    const existingPlan = await db.query.careerPlans.findFirst({
      where: eq(careerPlans.id, id),
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check ownership - counselors and admins can update any plan
    if (user.type !== 'admin' && user.type !== 'counselor' && existingPlan.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error("Career plan update error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

// DELETE /api/plans/[id] - Delete career plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(['student', 'counselor', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    const existingPlan = await db.query.careerPlans.findFirst({
      where: eq(careerPlans.id, id),
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check ownership - counselors and admins can delete any plan
    if (user.type !== 'admin' && user.type !== 'counselor' && existingPlan.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(careerPlans).where(eq(careerPlans.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Career plan delete error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
