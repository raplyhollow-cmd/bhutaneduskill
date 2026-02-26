/**
 * ASSESSMENTS API
 *
 * GET /api/assessments - Get user's assessments
 * POST /api/assessments - Save assessment results
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 * FIXED: Removed db.query usage (disabled in neon-http driver)
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { assessments, careerMatches, riasecResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CAREERS_DATABASE } from "@/lib/tenant";
import { applyRateLimitAuth, RateLimitPresets } from "@/lib/rate-limit";
import { logAssessmentResult } from "@/lib/audit-log";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse } from "@/lib/api/response-helpers";

// ============================================================================
// POST /api/assessments - Save assessment results
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    // Apply rate limiting for assessment endpoint
    const rateLimitResult = await applyRateLimitAuth(req, undefined, RateLimitPresets.assessment);
    if (rateLimitResult) return rateLimitResult;

    // Check RBAC permission for creating assessments
    // Students can create assessments for themselves without special permission
    if (user.type !== "student") {
      const permCheck = await requirePermission(userId, "assessments.create");
      if (permCheck) return permCheck;
    }

    try {
      const body = await req.json();
      const { type = "riasec", answers, results } = body;

      if (!answers || !results) {
        return badRequestResponse("Missing required fields");
      }

      // Create assessment record
      // For career assessments (riasec, mbti, etc.), provide defaults for required academic fields
      const assessmentId = `assessment-${Date.now()}`;
      const [assessment] = await db
        .insert(assessments)
        .values({
          id: assessmentId,
          userId: userId,
          type,
          status: "completed",
          answers,
          results,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          // Required fields for academic assessments - use defaults for career assessments
          title: `${type.toUpperCase()} Career Assessment`,
          description: `Career assessment to identify interests and match with suitable careers`,
          dueDate: new Date().toISOString().split('T')[0], // Today's date as due date
          totalPoints: 100,
          passingScore: 60,
          // Optional fields
          classId: null,
          assessmentTypeId: null,
        } as any)
        .returning();

      // For RIASEC assessments, save to specialized table
      if (type === "riasec" && results.scores) {
        const scores = results.scores;
        // Handle both short (R, I, A) and long (realistic, investigative) key formats
        const getScore = (key: string) => {
          if (scores[key] !== undefined) return scores[key] as number;
          const shortKeys: Record<string, string> = {
            realistic: 'r', investigative: 'i', artistic: 'a',
            social: 's', enterprising: 'e', conventional: 'c'
          };
          const shortKey = shortKeys[key];
          return shortKey && scores[shortKey] !== undefined ? scores[shortKey] as number : 0;
        };

        const sortedTraits = Object.entries(scores)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([trait]) => trait);
        const hollandCode = sortedTraits.slice(0, 3).join("").toUpperCase();

        await db.insert(riasecResults).values({
          id: `riasec_res_${Date.now()}`,
          userId: userId,
          scores: {
            realistic: getScore('realistic'),
            investigative: getScore('investigative'),
            artistic: getScore('artistic'),
            social: getScore('social'),
            enterprising: getScore('enterprising'),
            conventional: getScore('conventional'),
          },
          primaryHollandCode: sortedTraits[0]?.toUpperCase() || '',
          secondaryHollandCode: sortedTraits[1]?.toUpperCase() || '',
          hollandCode,
          recommendedCareers: results.careerSuggestions || [],
          completedAt: new Date(),
          createdAt: new Date(),
        } as any);
      }

      // Calculate career matches based on RIASEC results
      const userScores = results.scores || {};
      // Client sends lowercase single-letter keys (r, i, a, s, e, c)
      const hollandCode = results.scores ? Object.entries(results.scores as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([trait]) => trait.charAt(0).toUpperCase())
        .join("") : "";

      const matches = CAREERS_DATABASE.map((career) => {
        const careerScores = career.riasecScores || {};
        let totalMatch = 0;
        let count = 0;

        // Calculate match based on overlapping RIASEC traits
        // Both userScores and careerScores use lowercase single-letter keys
        Object.entries(userScores).forEach(([trait, userScore]) => {
          const lowerTrait = trait.toLowerCase();
          if (careerScores[lowerTrait as keyof typeof careerScores]) {
            const careerScore = careerScores[lowerTrait as keyof typeof careerScores];
            // Simple match algorithm
            const diff = Math.abs(
              (userScore as number) - (careerScore as number)
            );
            const matchPercent = Math.max(0, 100 - diff);
            totalMatch += matchPercent;
            count++;
          }
        });

        const avgMatch = count > 0 ? totalMatch / count : 50;
        return {
          careerId: career.id,
          careerTitle: career.name,
          matchScore: Math.round(avgMatch),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

      // Save career matches with all required fields
      for (const match of matches) {
        await db.insert(careerMatches).values({
          id: `match-${Date.now()}-${match.careerId}`,
          assessmentId: assessmentId,
          studentId: userId,
          careerId: match.careerId,
          careerTitle: match.careerTitle,
          matchScore: match.matchScore,
          matchReason: `Based on your RIASEC code: ${hollandCode}`,
          assessmentType: type,
          isTopMatch: match.matchScore > 75 ? true : false,
          createdAt: new Date(),
        } as any);
      }

      // Log audit event for assessment completion (don't await - non-blocking)
      logAssessmentResult(
        assessmentId,
        userId,
        type,
        {
          hollandCode,
          careerMatches: matches.length,
          topMatchScore: matches[0]?.matchScore,
        },
        req
      ).catch((err) => logger.error("Failed to log assessment", err));

      return createdResponse({
        assessment,
        careerMatches: matches,
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/assessments", method: "POST" });
      return errorResponse("Failed to save assessment", 500);
    }
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

// ============================================================================
// GET /api/assessments - Get user's assessments
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest) => {
    const auth = getAuth(req);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    // Check RBAC permission for reading assessments
    // Students can read their own assessments without special permission
    if (user.type !== "student") {
      const permCheck = await requirePermission(userId, "assessments.read");
      if (permCheck) return permCheck;
    }

    // Using db.select() instead of db.query (neon-http driver)
    const userAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt))
      .limit(10);

    return successResponse({ assessments: userAssessments });
  },
  ['student', 'teacher', 'admin', 'school-admin']
);
