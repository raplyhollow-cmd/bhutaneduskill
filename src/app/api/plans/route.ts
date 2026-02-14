import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { careerPlans } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user } = authResult;

  const plans = await db.query.careerPlans.findMany({
    where: eq(careerPlans.userId, user.id),
    orderBy: desc(careerPlans.createdAt),
    limit: 10,
  });

  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user } = authResult;

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

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Career plan creation error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
