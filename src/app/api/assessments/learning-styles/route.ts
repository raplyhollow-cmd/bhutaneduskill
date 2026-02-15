import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, learningStylesResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    const [assessment] = await db
      .insert(assessments)
      .values({
        id: `ls_${Date.now()}`,
        tenantId: user.tenantId,
        userId: userId,
        type: "learning-styles",
        status: "completed",
        answers,
        results,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
      } as any)
      .returning();

    await db.insert(learningStylesResults).values({
      id: `ls_res_${Date.now()}`,
      assessmentId: assessment.id,
      userId: userId,
      visual: results.visual,
      auditory: results.auditory,
      readWrite: results.readWrite,
      kinesthetic: results.kinesthetic,
      dominantStyle: results.dominantStyle,
      recommendations: results.recommendations,
      createdAt: new Date(),
    } as any);

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    console.error("Learning Styles assessment error:", error);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
