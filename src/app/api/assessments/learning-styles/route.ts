import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, learningStylesResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/assessments/learning-styles - Get Learning Styles assessment results
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
    const conditions = targetUserId ? eq(learningStylesResults.userId, targetUserId) : undefined;

    let results;
    if (conditions) {
      results = await db.query.learningStylesResults.findMany({
        where: conditions,
        orderBy: [desc(learningStylesResults.createdAt)],
        limit,
      });
    } else {
      results = await db.query.learningStylesResults.findMany({
        orderBy: [desc(learningStylesResults.createdAt)],
        limit,
      });
    }

    // Format results to match expected schema
    const formattedResults = results.map((result) => ({
      ...result,
      // Map database schema to expected format
      visual: result.visualScore || 0,
      auditory: result.auditoryScore || 0,
      kinesthetic: result.kinestheticScore || 0,
      readWrite: 0, // Not stored in database, default value
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch learning styles results", results: [] }, { status: 500 });
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

    // Create assessment record
    // Note: assessments table has required fields for academic assessments,
    // but personality assessments use dedicated result tables.
    // We provide minimal values for required fields.
    const assessmentId = `ls_${Date.now()}`;
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "Learning Styles Assessment",
        description: results.dominantStyle ? `Dominant style: ${results.dominantStyle}` : "Learning styles assessment",
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "learning-styles",
        status: "completed",
        // Store answers and results in the results JSON field
        results: { answers, results } as any,
        startedAt: new Date(),
        completedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(learningStylesResults).values({
      id: `ls_res_${Date.now()}`,
      assessmentId: assessmentId,
      userId: userId,
      visualScore: results.visual || 0,
      auditoryScore: results.auditory || 0,
      kinestheticScore: results.kinesthetic || 0,
      dominantStyle: results.dominantStyle || "visual",
      recommendations: results.recommendations || [],
      completedAt: new Date(),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
