/**
 * STUDENT MODULE RECOMMENDATIONS API
 * Suggest next modules based on completed module's category and level
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { moduleProgress, learningModules } from "@/lib/db/schema";
import { eq, and, or, sql, desc, inArray } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

interface ModuleRecommendationsParams extends Record<string, unknown> {
  id: string;
}

// GET /api/student/modules/[id]/recommendations
export const GET = createApiRoute<ModuleRecommendationsParams>(
  async (request: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id: completedModuleId } = await context!.params!;

    // Get the completed module's info using db.select (neon-http compatible)
    const completedModuleResult = await db
      .select({
        id: learningModules.id,
        category: learningModules.category,
        level: learningModules.level,
        subjectId: learningModules.subjectId,
        teacherId: learningModules.teacherId,
      })
      .from(learningModules)
      .where(eq(learningModules.id, completedModuleId))
      .limit(1);

    const completedModule = completedModuleResult[0];

    if (!completedModule) {
      return { error: "Module not found", status: 404 };
    }

    // Get student's enrolled modules to exclude using db.select (neon-http compatible)
    const enrolledModules = await db
      .select({
        moduleId: moduleProgress.moduleId,
      })
      .from(moduleProgress)
      .where(eq(moduleProgress.studentId, userId));

    const enrolledModuleIds = enrolledModules.map((m) => m.moduleId);

    // Define next level progression
    const levelProgression: Record<string, string[]> = {
      beginner: ["intermediate", "advanced"],
      intermediate: ["advanced"],
      advanced: [], // No higher level
    };

    const nextLevels = levelProgression[completedModule.level] || [];

    // Build conditions array
    const conditions = [];

    // Not already enrolled condition
    if (enrolledModuleIds.length > 0) {
      conditions.push(sql`NOT (${learningModules.id} = ANY(${enrolledModuleIds}))`);
    }

    // Published and active
    conditions.push(eq(learningModules.isPublished, true));
    conditions.push(eq(learningModules.isActive, true));

    // Category or subject matching
    const matchConditions = [];

    // Same category, higher level
    if (nextLevels.length > 0) {
      matchConditions.push(
        and(
          eq(learningModules.category, completedModule.category),
          sql`${learningModules.level} = ANY(${nextLevels})`
        )
      );
    }

    // Same subject, complementary skill
    if (completedModule.subjectId) {
      matchConditions.push(eq(learningModules.subjectId, completedModule.subjectId));
    }

    if (matchConditions.length > 0) {
      conditions.push(or(...matchConditions));
    }

    // Build recommendations query
    const recommendations = await db
      .select({
        id: learningModules.id,
        title: learningModules.title,
        description: learningModules.description,
        category: learningModules.category,
        level: learningModules.level,
        duration: learningModules.duration,
        thumbnail: learningModules.thumbnail,
        teacherId: learningModules.teacherId,
        isPremium: learningModules.isPremium,
        price: learningModules.price,
      })
      .from(learningModules)
      .where(and(...conditions))
      .orderBy(desc(learningModules.level))
      .limit(4);

    logger.info("Recommendations fetched", {
      completedModuleId,
      userId,
      count: recommendations.length,
    });

    return {
      success: true,
      data: recommendations,
    };
  },
  ["student"]
);
