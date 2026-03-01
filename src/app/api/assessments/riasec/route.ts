import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, riasecResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { calculateCareerMatches } from "@/lib/services/career-matching.service";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/assessments/riasec - Get RIASEC assessment results
 *
 * Query params:
 * - userId: Filter by user ID (for parents viewing children's results)
 * - limit: Maximum results to return (default: 10)
 */
export const GET = createApiRoute(
  async (request, auth) => {
    if (!auth) {
      return { error: "Unauthorized", results: [], status: 401 };
    }

    const { userId, user } = auth;
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
      return {
        error: "userId parameter is required for parents",
        results: [],
        status: 400
      };
    }

    // Build query conditions
    const whereClause = targetUserId ? eq(riasecResults.userId, targetUserId) : undefined;

    const results = await db
      .select()
      .from(riasecResults)
      .where(whereClause)
      .orderBy(desc(riasecResults.createdAt))
      .limit(limit);

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

    return { results: formattedResults };
  },
  ['parent', 'student', 'teacher', 'admin', 'school-admin', 'counselor']
);

/**
 * POST /api/assessments/riasec - Save RIASEC assessment results
 */
export const POST = createApiRoute(
  async (request, auth) => {
    if (!auth) {
      return { error: "Unauthorized", status: 401 };
    }

    const { userId, user } = auth;

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
    const hollandCodeStr = Array.isArray(hollandCode) ? hollandCode.join("") : (hollandCode || results?.hollandCode || "");
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "RIASEC Career Assessment",
        description: hollandCodeStr ? `Holland Code: ${hollandCodeStr}` : "RIASEC career interest assessment",
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "riasec",
        status: "completed",
        // Store results - casting to any because the schema expects a specific array type
        // but personality assessments store structured objects
        results: [{ questionId: "holland_code", answer: hollandCodeStr, score: 0, correct: true }] as any,
        startedAt: new Date(),
        completedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create RIASEC result record
    // Map single-letter score keys to full schema names
    const scoreMapping: Record<string, string> = {
      R: "realistic",
      I: "investigative",
      A: "artistic",
      S: "social",
      E: "enterprising",
      C: "conventional",
    };

    const rawScores = (scores || results?.scores || {}) as Record<string, number>;
    const mappedScores: Record<string, number> = {};

    for (const [key, value] of Object.entries(rawScores)) {
      const fullKey = scoreMapping[key];
      if (fullKey) {
        mappedScores[fullKey] = value;
      } else {
        mappedScores[key] = value; // Pass through if no mapping
      }
    }

    const riasecData = {
      id: `riasec_res_${Date.now()}`,
      assessmentId: assessmentId,
      userId: userId,
      scores: mappedScores,
      hollandCode: hollandCodeStr,
      primaryHollandCode: (Array.isArray(hollandCode) ? hollandCode[0] : hollandCode?.[0]) || results?.primaryHollandCode || "R",
      secondaryHollandCode: (Array.isArray(hollandCode) ? hollandCode[1] : hollandCode?.[1]) || results?.secondaryHollandCode || "I",
      recommendedCareers: results?.careerSuggestions || results?.recommendedCareers || [],
      completedAt: new Date(),
      createdAt: new Date(),
    };

    await db.insert(riasecResults).values(riasecData as any);

    // Trigger career matching
    try {
      await calculateCareerMatches(userId, "riasec", { saveToDatabase: true });
    } catch (error) {
      logger.error("Career matching failed", { userId, assessmentId, error });
      // Don't fail the assessment
    }

    return { success: true, assessmentId: assessment.id };
  },
  ['student', 'teacher', 'admin', 'school-admin']
);
