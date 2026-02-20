import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, riasecResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { calculateCareerMatches } from "@/lib/services/career-matching.service";

/**
 * GET /api/assessments/riasec - Get RIASEC assessment results
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
    const conditions = targetUserId ? eq(riasecResults.userId, targetUserId) : undefined;

    let results;
    if (conditions) {
      results = await db.query.riasecResults.findMany({
        where: conditions,
        orderBy: [desc(riasecResults.createdAt)],
        limit,
      });
    } else {
      results = await db.query.riasecResults.findMany({
        orderBy: [desc(riasecResults.createdAt)],
        limit,
      });
    }

    // Format results to match expected schema
    const formattedResults = results.map((result) => {
      const scores = result.scores || {
        realistic: 0,
        investigative: 0,
        artistic: 0,
        social: 0,
        enterprising: 0,
        conventional: 0,
      };

      return {
        ...result,
        scores,
        hollandCode: result.hollandCode || result.primaryHollandCode || null,
        primaryHollandCode: result.primaryHollandCode || result.hollandCode?.[0] || "R",
        secondaryHollandCode: result.secondaryHollandCode || result.hollandCode?.[1] || "I",
        recommendedCareers: Array.isArray(result.recommendedCareers) ? result.recommendedCareers : [],
      };
    });

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch RIASEC results", results: [] }, { status: 500 });
  }
}

/**
 * POST /api/assessments/riasec - Save RIASEC assessment results
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
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
    const { answers, results, scores, hollandCode } = body;

    // Create assessment record
    // Note: assessments table has required fields for academic assessments,
    // but personality assessments use dedicated result tables.
    // We provide minimal values for required fields.
    const assessmentId = `riasec_${Date.now()}`;
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "RIASEC Career Assessment",
        description: hollandCode ? `Holland Code: ${hollandCode.join("")}` : "RIASEC career interest assessment",
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "riasec",
        status: "completed",
        // Store answers and results in the results JSON field
        results: { answers, results, scores, hollandCode } as any,
        startedAt: new Date(),
        completedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create RIASEC result record
    const riasecData = {
      id: `riasec_res_${Date.now()}`,
      assessmentId: assessmentId,
      userId: userId,
      scores: scores || results?.scores || {} as any,
      hollandCode: Array.isArray(hollandCode) ? hollandCode.join("") : (hollandCode || results?.hollandCode || ""),
      primaryHollandCode: (Array.isArray(hollandCode) ? hollandCode[0] : hollandCode?.[0]) || results?.primaryHollandCode || "R",
      secondaryHollandCode: (Array.isArray(hollandCode) ? hollandCode[1] : hollandCode?.[1]) || results?.secondaryHollandCode || "I",
      recommendedCareers: results?.recommendedCareers || [],
      traits: results?.traits || [],
      completedAt: new Date(),
      createdAt: new Date(),
    };

    await db.insert(riasecResults).values(riasecData);

    // Trigger career matching
    try {
      await calculateCareerMatches(userId, "riasec", { saveToDatabase: true });
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
