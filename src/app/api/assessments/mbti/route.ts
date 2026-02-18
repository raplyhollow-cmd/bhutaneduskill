import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { assessments, mbtiResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { MBTIResult } from "@/lib/db/schema";

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
      userId: userId,
      personalityType: results.type,
      scores: {
        e: results.eiScore ? Math.round((100 + results.eiScore) / 2) : 50,
        i: results.eiScore ? Math.round((100 - results.eiScore) / 2) : 50,
        s: results.snScore ? Math.round((100 + results.snScore) / 2) : 50,
        n: results.snScore ? Math.round((100 - results.snScore) / 2) : 50,
        t: results.tfScore ? Math.round((100 + results.tfScore) / 2) : 50,
        f: results.tfScore ? Math.round((100 - results.tfScore) / 2) : 50,
        j: results.jpScore ? Math.round((100 + results.jpScore) / 2) : 50,
        p: results.jpScore ? Math.round((100 - results.jpScore) / 2) : 50,
      },
      description: results.description || `Your MBTI personality type is ${results.type}`,
      strengths: results.strengths || results.traits || [],
      weaknesses: results.weaknesses || [],
      recommendedCareers: results.careerSuggestions || [],
      completedAt: new Date(),
      createdAt: new Date(),
    } as any);

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    logger.apiError(error, { route: "/api/assessments/mbti", method: "POST" });
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

    let results: MBTIResult[];
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
    const formattedResults = results.map((result: MBTIResult) => ({
      ...result,
      personalityType: result.personalityType || "INTJ",
      scores: {
        e: result.scores?.e ?? 50,
        i: result.scores?.i ?? 50,
        s: result.scores?.s ?? 50,
        n: result.scores?.n ?? 50,
        t: result.scores?.t ?? 50,
        f: result.scores?.f ?? 50,
        j: result.scores?.j ?? 50,
        p: result.scores?.p ?? 50,
      },
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      recommendedCareers: Array.isArray(result.recommendedCareers) ? result.recommendedCareers : [],
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    logger.apiError(error, { route: "/api/assessments/mbti", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch results", results: [] }, { status: 500 });
  }
}
