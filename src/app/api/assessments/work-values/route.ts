import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, workValuesResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { calculateCareerMatches } from "@/lib/services/career-matching.service";
import { createApiRoute } from "@/lib/api/route-handler";
import { calculateWorkValues, getWorkValuesQuestions } from "@/lib/assessments";
import { WORK_VALUES, type WorkValueKey } from "@/lib/assessments";

// Type for assessment results JSON field
type AssessmentResultsData = {
  answers: unknown;
  results: unknown;
};

// Type for top values with scores (matches database schema)
type TopValueWithScore = {
  value: string;
  score: number;
};

/**
 * GET /api/assessments/work-values - Get Work Values assessment results
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
        status: 400,
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
    // Ensure topValues is properly formatted and include all value scores
    const formattedResults = results.map((result) => {
      const topValues = result.topValues as Array<{ value: string; score: number }> || [];

      // Build full values object from topValues
      const values: Record<string, number> = {};
      topValues.forEach((item) => {
        values[item.value] = item.score;
      });

      // Extract simple value keys for backward compatibility
      const topValueKeys = topValues.map((v) => v.value as WorkValueKey);

      return {
        ...result,
        values,
        topValues: topValueKeys,
        // For display: include full objects with scores
        topValuesWithScores: topValues,
        description: result.description || "Values that matter most in your career choice.",
        recommendedCareers: result.recommendedCareers as string[] || [],
      };
    });

    return { results: formattedResults };
  },
  ['parent', 'student', 'teacher', 'admin', 'school-admin', 'counselor']
);

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
    const { answers, results: clientResults } = body;

    // Calculate results server-side if not provided by client
    let finalResults;
    if (clientResults && clientResults.values && clientResults.topValues) {
      // Use client-provided results
      finalResults = clientResults;
    } else {
      // Calculate server-side for security and consistency
      const questions = getWorkValuesQuestions();
      finalResults = calculateWorkValues(answers || {}, questions);
    }

    // Transform topValues to match database schema (Array<{ value: string; score: number }>)
    // The client may send topValues as simple string array ["achievement", "independence"]
    // or as the full array with scores
    let topValuesWithScores: TopValueWithScore[];
    if (Array.isArray(finalResults.topValues) && finalResults.topValues.length > 0) {
      if (typeof finalResults.topValues[0] === "string") {
        // Client sent simple string array, convert to { value, score } format
        const valueKeys = finalResults.topValues as WorkValueKey[];
        topValuesWithScores = valueKeys.map((key) => ({
          value: key,
          score: finalResults.values?.[key] || 0,
        }));
      } else {
        // Already in correct format
        topValuesWithScores = finalResults.topValues as TopValueWithScore[];
      }
    } else {
      // Fallback: compute top values from scores
      const values = finalResults.values || {};
      topValuesWithScores = (Object.entries(values) as [WorkValueKey, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([key, score]) => ({ value: key, score }));
    }

    // Generate description if not provided
    let description = finalResults.description;
    if (!description && topValuesWithScores.length > 0) {
      const topValueKeys = topValuesWithScores.map((v) => v.value as WorkValueKey);
      const descriptions: Record<WorkValueKey, string> = {
        achievement: "You seek opportunities to use your abilities and feel a sense of accomplishment",
        independence: "You value autonomy and prefer to work with minimal supervision",
        recognition: "You appreciate public acknowledgment and credit for your work",
        relationships: "You prioritize working with people you enjoy and respect",
        support: "You look for supportive management and a positive work environment",
        workingConditions: "You value good pay, job security, and comfortable surroundings",
      };
      description = topValueKeys.map((v) => descriptions[v]).join(". ");
    }

    // Get career recommendations if not provided
    let recommendedCareers = finalResults.careerSuggestions || finalResults.recommendedCareers || [];
    if (recommendedCareers.length === 0 && topValuesWithScores.length > 0) {
      // Generate career suggestions based on top values
      const topValueKeys = topValuesWithScores.map((v) => v.value as WorkValueKey);
      const careerMap: Record<WorkValueKey, string[]> = {
        achievement: ["Entrepreneur", "Sales Manager", "Surgeon", "Architect", "Software Developer", "Research Scientist", "CEO", "Consultant"],
        independence: ["Freelance Writer", "Consultant", "Real Estate Agent", "Financial Advisor", "Software Developer", "Artist", "Private Practice Professional"],
        recognition: ["Actor/Performer", "Politician", "Sales Representative", "Marketing Manager", "Influencer", "Broadcast Journalist", "Coach"],
        relationships: ["Teacher", "Counselor", "Social Worker", "Human Resources", "Nurse", "Team Leader", "Event Planner", "Therapist"],
        support: ["Teacher", "Non-profit Worker", "Government Employee", "Education Administrator", "Counselor", "Human Resources", "Social Worker"],
        workingConditions: ["Corporate Executive", "Government Official", "University Professor", "Doctor", "Lawyer", "IT Manager", "Engineer"],
      };
      const suggestions = new Set<string>();
      topValueKeys.forEach((value) => {
        careerMap[value]?.forEach((career) => suggestions.add(career));
      });
      recommendedCareers = Array.from(suggestions).slice(0, 8);
    }

    // Create assessment record
    // Note: assessments table has required fields for academic assessments,
    // but personality assessments use dedicated result tables.
    // We provide minimal values for required fields.
    const assessmentId = `wv_${Date.now()}`;
    const topValuesLabels = topValuesWithScores.map((v) => WORK_VALUES[v.value as WorkValueKey]?.name || v.value);
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: assessmentId,
        title: "Work Values Assessment",
        description: topValuesLabels.length > 0
          ? `Top values: ${topValuesLabels.slice(0, 3).join(", ")}`
          : "Understanding what matters most in your career",
        dueDate: new Date().toISOString(), // Current date since it's already completed
        totalPoints: 100,
        passingScore: 0,
        userId: userId,
        type: "work-values",
        status: "completed",
        // Store answers and results in the results JSON field
        results: {
          answers,
          results: {
            ...finalResults,
            topValues: topValuesWithScores,
          },
        } as unknown as typeof assessments.$inferInsert.results,
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
      topValues: topValuesWithScores,
      description: description || "Your work values profile",
      recommendedCareers: recommendedCareers as string[],
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

    return {
      success: true,
      assessmentId: assessment.id,
      topValues: topValuesWithScores,
      recommendedCareers,
    };
  },
  ['student', 'parent', 'teacher', 'admin', 'school-admin', 'counselor']
);
