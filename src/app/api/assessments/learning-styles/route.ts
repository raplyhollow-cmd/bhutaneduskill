import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, assessments, learningStylesResults } from "@/lib/db/schema";
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
        id: `ls_${Date.now()}`,
        tenantId: user.tenantId,
        userId: user.id,
        type: "learning-styles",
        status: "completed",
        answers,
        results,
        startedAt: new Date(),
        completedAt: new Date(),
      })
      .returning();

    await db.insert(learningStylesResults).values({
      id: `ls_res_${Date.now()}`,
      assessmentId: assessment.id,
      userId: user.id,
      visual: results.visual,
      auditory: results.auditory,
      readWrite: results.readWrite,
      kinesthetic: results.kinesthetic,
      dominantStyle: results.dominantStyle,
      recommendations: results.recommendations,
    });

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    console.error("Learning Styles assessment error:", error);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
