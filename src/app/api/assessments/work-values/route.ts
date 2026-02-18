import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, workValuesResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/assessments/work-values - Get Work Values assessment results
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
    const conditions = targetUserId ? eq(workValuesResults.userId, targetUserId) : undefined;

    let results;
    if (conditions) {
      results = await db.query.workValuesResults.findMany({
        where: conditions,
        orderBy: [desc(workValuesResults.createdAt)],
        limit,
      });
    } else {
      results = await db.query.workValuesResults.findMany({
        orderBy: [desc(workValuesResults.createdAt)],
        limit,
      });
    }

    // Format results to match expected schema
    const formattedResults = results.map((result) => ({
      ...result,
      topValues: result.topValues as Array<{ value: string; score: number }> || [],
      description: "Values that matter most in your career choice.",
      recommendedCareers: result.recommendedCareers as string[] || [],
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch work values results", results: [] }, { status: 500 });
  }
}

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

    const [assessment] = await db
      .insert(assessments)
      .values({
        id: `wv_${Date.now()}`,
        tenantId: user.tenantId,
        userId: userId,
        type: "work-values",
        status: "completed",
        answers,
        results,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
      } as any)
      .returning();

    await db.insert(workValuesResults).values({
      id: `wv_res_${Date.now()}`,
      userId: userId,
      topValues: results.topValues || [],
      description: results.description || "Your work values profile",
      recommendedCareers: results.recommendedCareers || [],
      completedAt: new Date(),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
