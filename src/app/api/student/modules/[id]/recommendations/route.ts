/**
 * STUDENT MODULE RECOMMENDATIONS API
 * Suggest next modules based on completed module's category and level
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { moduleProgress, learningModules } from "@/lib/db/schema";
import { eq, and, or, sql, desc, inArray } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/student/modules/[id]/recommendations
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const { id: completedModuleId } = await params;

    // Get the completed module's info
    const completedModule = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, completedModuleId),
      columns: {
        id: true,
        category: true,
        level: true,
        subjectId: true,
        teacherId: true,
      },
    });

    if (!completedModule) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    // Get student's enrolled modules to exclude
    const enrolledModules = await db.query.moduleProgress.findMany({
      where: eq(moduleProgress.studentId, userId),
      columns: {
        moduleId: true,
      },
    });

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

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules/[id]/recommendations", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
