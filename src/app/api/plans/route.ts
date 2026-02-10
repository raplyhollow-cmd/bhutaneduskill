import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { careerPlans } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/db/tenant";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const plans = await db.query.careerPlans.findMany({
      where: eq(careerPlans.userId, user.id),
      orderBy: desc(careerPlans.createdAt),
      limit: 10,
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Career plans fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { targetCareer, currentPhase, shortTermGoals, longTermGoals, actionSteps, milestones } = body;

    const [plan] = await db
      .insert(careerPlans)
      .values({
        id: `plan_${Date.now()}`,
        userId: user.id,
        counselorId: user.type === "counselor" ? user.id : null,
        targetCareer,
        currentPhase: currentPhase || "self_assessment",
        shortTermGoals: shortTermGoals || [],
        longTermGoals: longTermGoals || [],
        actionSteps: actionSteps || [],
        milestones: milestones || [],
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Career plan creation error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
