import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, workValuesResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { calculateCareerMatches } from "@/lib/services/career-matching.service";
import { createApiRoute } from "@/lib/api/route-handler";

// Type for assessment results JSON field
type AssessmentResultsData = {
  answers: unknown;
  results: unknown;
};

/**
 * GET /api/assessments/work-values - Get Work Values assessment results
 *
 * Query params:
 * - userId: Filter by user ID (for parents viewing children's results)
 * - limit: Maximum results to return (default: 10)
 */
export const GET = createApiRoute(
  async (request, { userId, user }) => {
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
    const conditions = targetUserId ? eq(workValuesResults.userId, targetUserId) : undefined;

    let results;
    if (conditions) {
      results = await db
        .select()
        .from(workValuesResults)
        .where(conditions)
        .orderBy(desc(workValuesResults.createdAt))
        .limit(limit);
    } else {
      results = await db
        .select()
        .from(workValuesResults)
        .orderBy(desc(workValuesResults.createdAt))
        .limit(limit);
    }

    // Format results to match expected schema
    const formattedResults = results.map((result) => ({
      ...result,
      topValues: result.topValues as Array<{ value: string; score: number }> || [],
      description: "Values that matter most in your career choice.",
      recommendedCareers: result.recommendedCareers as string[] || [],
    }));

    return { results: formattedResults };
  },
  ['parent', 'student', 'teacher', 'admin', 'school-admin', 'counselor']
);

export const POST = createApiRoute(
  async (request, { userId, user }) => {
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
    const assessmentId = `wv_${Date.now()}`;
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "Work Values Assessment",
        description: "Understanding what matters most in your career",
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "work-values",
        status: "completed",
        // Store answers and results in the results JSON field
        // TODO: Schema mismatch - personality assessments store different result structure
        // than the academic assessment type expected by the schema
        results: { answers, results } as unknown as typeof assessments.$inferInsert.results,
        startedAt: new Date(),
        completedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(workValuesResults).values({
      id: `wv_res_${Date.now()}`,
      assessmentId: assessmentId,
      userId: userId,
      topValues: results.topValues || [],
      description: results.description || "Your work values profile",
      recommendedCareers: results.recommendedCareers || [],
      completedAt: new Date(),
      createdAt: new Date(),
    });

    // Trigger career matching
    try {
      await calculateCareerMatches(userId, "work_values", { saveToDatabase: true });
    } catch (error) {
      logger.error("Career matching failed", { userId, assessmentId, error });
      // Don't fail the assessment
    }

    return { success: true, assessmentId: assessment.id };
  },
  [] // Any authenticated user
);
