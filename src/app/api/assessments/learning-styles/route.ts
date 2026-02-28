import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, learningStylesResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/assessments/learning-styles - Get Learning Styles assessment results
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
    const whereClause = targetUserId ? eq(learningStylesResults.userId, targetUserId) : undefined;

    const results = await db
      .select()
      .from(learningStylesResults)
      .where(whereClause)
      .orderBy(desc(learningStylesResults.createdAt))
      .limit(limit);

    // Format results to match expected schema
    const formattedResults = results.map((result) => ({
      ...result,
      // Map database schema to expected format
      visual: result.visualScore || 0,
      auditory: result.auditoryScore || 0,
      kinesthetic: result.kinestheticScore || 0,
      readWrite: 0, // Not stored in database, default value
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
        // TODO: Schema mismatch - personality assessments store different result structure
        results: { answers, results } as unknown as typeof assessments.$inferInsert.results,
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

    return { success: true, assessmentId: assessment.id };
  },
  [] // Any authenticated user
);
