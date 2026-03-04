/**
 * STUDENT SKILLS API
 *
 * GET /api/student/skills/inferred - Get student's inferred skills
 * POST /api/student/skills/inferred/refresh - Trigger skills recalculation
 * POST /api/student/skills/self-report - Add self-reported skill
 *
 * Skills are inferred from:
 * - Homework submissions
 * - Attendance patterns
 * - Journal entries (AI-analyzed)
 * - Student portfolios
 * - Assessment results
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { careerMatches, studentSkills, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import {
  getStudentSkills,
  inferSkillsForStudent,
  addSelfReportedSkill,
  type InferredSkill,
} from "@/lib/intelligence/skills-inference-engine";

// ============================================================================
// GET /api/student/skills/inferred - Get student's skills with career gap analysis
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const includeCareerGaps = searchParams.get("includeCareerGaps") === "true";

    try {
      // Get student's skills
      const skills = await getStudentSkills(userId);

      // Get career matches for gap analysis
      let careerGaps: unknown[] = [];

      if (includeCareerGaps) {
        const matches = await db
          .select()
          .from(careerMatches)
          .where(eq(careerMatches.studentId, userId))
          .orderBy(desc(careerMatches.matchScore))
          .limit(5);

        // Get career details for gap analysis
        const { careers } = await import("@/lib/db/schema");

        for (const match of matches) {
          const [careerDetail] = await db
            .select()
            .from(careers)
            .where(eq(careers.id, match.careerId))
            .limit(1);

          if (careerDetail) {
            const careerSkills = (careerDetail.skills as string[]) || [];
            const studentSkillNames = skills.map(s => s.name.toLowerCase());

            const matchingSkills = careerSkills.filter(cs =>
              studentSkillNames.some(ss => ss.includes(cs.toLowerCase()) || cs.toLowerCase().includes(ss))
            );

            const missingSkills = careerSkills.filter(cs =>
              !studentSkillNames.some(ss => ss.includes(cs.toLowerCase()) || cs.toLowerCase().includes(ss))
            );

            careerGaps.push({
              careerId: careerDetail.id,
              careerTitle: careerDetail.title,
              matchScore: match.matchScore,
              isTopMatch: match.isTopMatch,
              skills: {
                total: careerSkills.length,
                matching: matchingSkills.length,
                missing: missingSkills.length,
                matchingSkills,
                missingSkills,
                readiness: Math.round((matchingSkills.length / careerSkills.length) * 100),
              },
            });
          }
        }
      }

      // Get last update time
      const [user] = await db
        .select({ updatedAt: users.updatedAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return successResponse({
        skills,
        careerGaps,
        summary: {
          totalSkills: skills.length,
          byCategory: groupSkillsByCategory(skills),
          averageConfidence: skills.length > 0
            ? Math.round(skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length)
            : 0,
        },
        lastUpdated: user?.updatedAt || null,
      });
    } catch (error) {
      logger.error("Failed to get student skills", { userId, error });
      return errorResponse("Failed to retrieve skills", 500);
    }
  },
  ["student"]
);

// ============================================================================
// POST /api/student/skills/inferred/refresh - Trigger skills recalculation
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    try {
      const body = await req.json();
      const { force } = body || {};

      // Check if we should refresh (rate limit unless forced)
      if (!force) {
        const [lastSkill] = await db
          .select({ createdAt: studentSkills.createdAt })
          .from(studentSkills)
          .where(eq(studentSkills.userId, userId))
          .orderBy(desc(studentSkills.createdAt))
          .limit(1);

        if (lastSkill) {
          const hoursSinceLastUpdate = (Date.now() - lastSkill.createdAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastUpdate < 1) {
            return successResponse({
              message: "Skills were recently updated",
              skills: await getStudentSkills(userId),
              skipped: true,
            });
          }
        }
      }

      // Run skills inference
      const result = await inferSkillsForStudent(userId);

      return successResponse({
        message: "Skills recalculated successfully",
        skills: result.skills,
        summary: result.summary,
        lastAnalyzed: result.lastAnalyzed,
      });
    } catch (error) {
      logger.error("Failed to refresh skills", { userId, error });
      return errorResponse("Failed to refresh skills", 500);
    }
  },
  ["student"]
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function groupSkillsByCategory(skills: InferredSkill[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const skill of skills) {
    counts[skill.category] = (counts[skill.category] || 0) + 1;
  }
  return counts;
}
