import { logger } from "@/lib/logger";
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
    // Students can create assessments for themselves without special permission
    if (user.type !== "student") {
      const permCheck = await requirePermission(userId, "assessments.create");
      if (permCheck) return permCheck;
    }

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
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}

/**
 * GET /api/assessments/mbti - Get MBTI assessment results
 *
 * Query params:
 * - userId: Filter by user ID (for parents viewing children's results)
 * - limit: Maximum results to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['parent', 'student', 'teacher', 'admin', 'school-admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Parents can view their children's results
    // Students can only view their own results
    let targetUserId = userIdParam;

    if (user.type === "student") {
      // Students can only see their own results
      targetUserId = userId;
    } else if (user.type === "parent" && !userIdParam) {
      // Parent must specify which child
      return NextResponse.json(
        { error: "userId parameter is required for parents", results: [] },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = targetUserId ? eq(mbtiResults.userId, targetUserId) : undefined;

    let results;
    if (conditions) {
      results = await db.query.mbtiResults.findMany({
        where: conditions,
        orderBy: [desc(mbtiResults.createdAt)],
        limit,
      });
    } else {
      results = await db.query.mbtiResults.findMany({
        orderBy: [desc(mbtiResults.createdAt)],
        limit,
      });
    }

    // Format results to match expected schema
    const formattedResults = results.map((result) => ({
      ...result,
      personalityType: result.personalityType || "INTJ",
      scores: {
        e: result.eiScore ? Math.round((100 + result.eiScore) / 2) : 50,
        i: result.eiScore ? Math.round((100 - result.eiScore) / 2) : 50,
        s: result.snScore ? Math.round((100 + result.snScore) / 2) : 50,
        n: result.snScore ? Math.round((100 - result.snScore) / 2) : 50,
        t: result.tfScore ? Math.round((100 + result.tfScore) / 2) : 50,
        f: result.tfScore ? Math.round((100 - result.tfScore) / 2) : 50,
        j: result.jpScore ? Math.round((100 + result.jpScore) / 2) : 50,
        p: result.jpScore ? Math.round((100 - result.jpScore) / 2) : 50,
      },
      strengths: result.traits as string[] || [],
      weaknesses: [],
      recommendedCareers: result.recommendedCareers as string[] || [],
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch results", results: [] }, { status: 500 });
  }
}
