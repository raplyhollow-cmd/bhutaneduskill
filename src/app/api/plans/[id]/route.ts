import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, careerPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/plans/[id] - Get single career plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = await db.query.careerPlans.findFirst({
      where: eq(careerPlans.id, params.id),
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check ownership
    if (plan.userId !== user.id) {
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
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetCareer, currentPhase, shortTermGoals, longTermGoals, actionSteps, milestones, status } = body;

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingPlan = await db.query.careerPlans.findFirst({
      where: eq(careerPlans.id, params.id),
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check ownership
    if (existingPlan.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedPlan] = await db
      .update(careerPlans)
      .set({
        targetCareer: targetCareer ?? existingPlan.targetCareer,
        currentPhase: currentPhase ?? existingPlan.currentPhase,
        shortTermGoals: shortTermGoals ?? existingPlan.shortTermGoals,
        longTermGoals: longTermGoals ?? existingPlan.longTermGoals,
        actionSteps: actionSteps ?? existingPlan.actionSteps,
        milestones: milestones ?? existingPlan.milestones,
        status: status ?? existingPlan.status,
        updatedAt: new Date(),
        completedAt: status === "completed" ? new Date() : existingPlan.completedAt,
      })
      .where(eq(careerPlans.id, params.id))
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
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingPlan = await db.query.careerPlans.findFirst({
      where: eq(careerPlans.id, params.id),
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check ownership
    if (existingPlan.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(careerPlans).where(eq(careerPlans.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Career plan delete error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
