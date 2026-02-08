import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, assessments, discResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, results } = body;

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [assessment] = await db
      .insert(assessments)
      .values({
        id: `disc_${Date.now()}`,
        tenantId: user.tenantId,
        userId: user.id,
        type: "disc",
        status: "completed",
        answers,
        results,
        startedAt: new Date(),
        completedAt: new Date(),
      })
      .returning();

    await db.insert(discResults).values({
      id: `disc_res_${Date.now()}`,
      assessmentId: assessment.id,
      userId: user.id,
      dominance: results.dominance,
      influence: results.influence,
      steadiness: results.steadiness,
      conscientiousness: results.conscientiousness,
      discType: results.primaryType,
      traits: results.traits,
    });

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    console.error("DISC assessment error:", error);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
