import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, mbtiResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    // Check RBAC permission for creating assessments
    const permCheck = await requirePermission(userId, "assessments.create");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { answers, results } = body;

    // Create assessment record
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: `mbti_${Date.now()}`,
        tenantId: user.tenantId,
        userId: userId,
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
      userId: userId,
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
    // Authenticate user
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check RBAC permission for reading assessments
    const permCheck = await requirePermission(userId, "assessments.read");
    if (permCheck) return permCheck;

    const userResults = await db.query.mbtiResults.findMany({
      where: eq(mbtiResults.userId, userId),
      orderBy: desc(mbtiResults.createdAt),
      limit: 10,
    });

    return NextResponse.json({ results: userResults });
  } catch (error) {
    console.error("MBTI results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
