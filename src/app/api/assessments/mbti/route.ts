import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, assessments, mbtiResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, results } = body;

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create assessment record
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: `mbti_${Date.now()}`,
        tenantId: user.tenantId,
        userId: user.id,
        type: "mbti",
        status: "completed",
        answers,
        results,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
      } as any)
      .returning();

    // Create MBTI result record
    await db.insert(mbtiResults).values({
      id: `mbti_res_${Date.now()}`,
      assessmentId: assessment.id,
      userId: user.id,
      eiScore: results.eiScore,
      snScore: results.snScore,
      tfScore: results.tfScore,
      jpScore: results.jpScore,
      personalityType: results.type,
      traits: results.traits,
      createdAt: new Date(),
    } as any);

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    console.error("MBTI assessment error:", error);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    const userResults = await db.query.mbtiResults.findMany({
      where: eq(mbtiResults.userId, user.id),
      orderBy: desc(mbtiResults.createdAt),
      limit: 10,
    });

    return NextResponse.json({ results: userResults });
  } catch (error) {
    console.error("MBTI results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
