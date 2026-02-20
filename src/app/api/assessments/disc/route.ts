import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, discResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { calculateCareerMatches } from "@/lib/services/career-matching.service";

/**
 * GET /api/assessments/disc - Get DISC assessment results
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
    const conditions = targetUserId ? eq(discResults.userId, targetUserId) : undefined;

    let results;
    if (conditions) {
      results = await db.query.discResults.findMany({
        where: conditions,
        orderBy: [desc(discResults.createdAt)],
        limit,
      });
    } else {
      results = await db.query.discResults.findMany({
        orderBy: [desc(discResults.createdAt)],
        limit,
      });
    }

    // Format results to match expected schema
    const formattedResults = results.map((result) => ({
      ...result,
      // Map database schema to expected format
      dominance: result.scores?.d || 0,
      influence: result.scores?.i || 0,
      steadiness: result.scores?.s || 0,
      conscientiousness: result.scores?.c || 0,
      primaryType: result.dominantStyle || "D",
      traits: {
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
      },
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch DISC results", results: [] }, { status: 500 });
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
    const assessmentId = `disc_${Date.now()}`;
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "DISC Personality Assessment",
        description: results.primaryType ? `DISC Type: ${results.primaryType}` : "DISC personality assessment",
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "disc",
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

    await db.insert(discResults).values({
      id: `disc_res_${Date.now()}`,
      assessmentId: assessmentId,
      userId: userId,
      dominantStyle: results.primaryType || "D",
      scores: {
        d: results.dominance || 0,
        i: results.influence || 0,
        s: results.steadiness || 0,
        c: results.conscientiousness || 0,
      } as any, // scores is json field
      description: results.description || "DISC personality assessment result",
      strengths: results.strengths || [],
      weaknesses: results.weaknesses || [],
      recommendedCareers: results.recommendedCareers || [],
      completedAt: new Date(),
      createdAt: new Date(),
    });

    // Trigger career matching
    try {
      await calculateCareerMatches(userId, "disc", { saveToDatabase: true });
    } catch (error) {
      logger.error("Career matching failed", { userId, assessmentId, error });
      // Don't fail the assessment
    }

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }
}
