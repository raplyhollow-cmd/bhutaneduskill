import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { assessments, mbtiResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { MBTIResult } from "@/lib/db/schema";
import { calculateCareerMatches } from "@/lib/services/career-matching.service";
import { createApiRoute } from "@/lib/api/route-handler";

export const POST = createApiRoute(
  async (request, auth) => {
    // Debug logging
    console.log("[MBTI POST] Auth check:", { hasAuth: !!auth, auth });

    // auth is provided by createApiRoute wrapper
    if (!auth) {
      console.error("[MBTI POST] No auth provided");
      return { error: "Unauthorized", status: 401 };
    }

    const { userId, user } = auth;
    console.log("[MBTI POST] Destructured:", { userId, userType: user?.type });

    // Check RBAC permission for creating assessments
    // Students can create assessments for themselves without special permission
    if (user.type !== "student") {
      console.log("[MBTI POST] Non-student user, checking permissions");
      const permCheck = await requirePermission(userId, "assessments.create");
      if (permCheck) return permCheck;
    }

    let body;
    try {
      body = await request.json();
      console.log("[MBTI POST] Request body parsed:", { hasAnswers: !!body.answers, hasResults: !!body.results });
    } catch (parseError) {
      console.error("[MBTI POST] Failed to parse request body:", parseError);
      return { error: "Invalid request body", status: 400 };
    }

    const { answers, results } = body;

    if (!results) {
      console.error("[MBTI POST] Missing results in request body");
      return { error: "Results are required", status: 400 };
    }

    console.log("[MBTI POST] Creating assessment for user:", userId, "type:", results.type);

    // Create assessment record
    // Note: assessments table has required fields for academic assessments,
    // but personality assessments use dedicated result tables.
    // We provide minimal values for required fields.
    const assessmentId = `mbti_${Date.now()}`;

    try {
      console.log("[MBTI POST] Attempting to insert assessment:", assessmentId);
      const [assessment] = await db
        .insert(assessments)
        .values({
          id: assessmentId,
          title: "MBTI Personality Assessment",
          description: `MBTI personality type: ${results.type}`,
          dueDate: new Date().toISOString(), // Current date since it's already completed
          totalPoints: 100,
          passingScore: 0,
          userId: userId,
          type: "mbti",
          status: "completed",
          // Store results - casting to any because the schema expects a specific array type
          // but personality assessments store structured objects
          results: [{ questionId: "personality_type", answer: results.type, score: 0, correct: true }] as any,
          startedAt: new Date(),
          completedAt: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      console.log("[MBTI POST] Assessment created:", assessment?.id);
    } catch (dbError) {
      console.error("[MBTI POST] Failed to insert assessment:", dbError);
      return { error: `Failed to create assessment: ${dbError instanceof Error ? dbError.message : String(dbError)}`, status: 500 };
    }

    // Create MBTI result record
    try {
      console.log("[MBTI POST] Attempting to insert MBTI result");

      // The MBTI calculation returns 'careerSuggestions' but we store as 'recommendedCareers'
      const recommendedCareers = (results as any).careerSuggestions || [];

      await db.insert(mbtiResults).values({
        id: `mbti_res_${Date.now()}`,
        assessmentId: assessmentId,
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
        recommendedCareers: recommendedCareers,
        completedAt: new Date(),
        createdAt: new Date(),
      } as any);
      console.log("[MBTI POST] MBTI result created successfully");
    } catch (dbError) {
      console.error("[MBTI POST] Failed to insert MBTI result:", dbError);
      return { error: `Failed to save MBTI result: ${dbError instanceof Error ? dbError.message : String(dbError)}`, status: 500 };
    }

    // Trigger career matching
    try {
      await calculateCareerMatches(userId, "mbti", { saveToDatabase: true });
    } catch (error) {
      logger.error("Career matching failed", { userId, assessmentId, error });
      // Don't fail the assessment
    }

    return { success: true, assessmentId };
  },
  ['student', 'parent', 'teacher', 'admin', 'school-admin', 'counselor'] // Require authentication
);

/**
 * GET /api/assessments/mbti - Get MBTI assessment results
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
    const whereClause = targetUserId ? eq(mbtiResults.userId, targetUserId) : undefined;

    const results = await db
      .select()
      .from(mbtiResults)
      .where(whereClause)
      .orderBy(desc(mbtiResults.createdAt))
      .limit(limit) as MBTIResult[];

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

    return { results: formattedResults };
  },
  ['parent', 'student', 'teacher', 'admin', 'school-admin', 'counselor']
);
