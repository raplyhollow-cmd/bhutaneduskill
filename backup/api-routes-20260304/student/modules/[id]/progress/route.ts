/**
 * STUDENT MODULE PROGRESS API
 * Track and update student progress through lessons
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moduleProgress, learningModules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { z } from "zod";

interface Params {
  params: Promise<{ id: string }>;
}

interface ModuleContentData {
  lessons: Array<{
    id: string;
    contents: Array<{
      id: string;
    }>;
  }>;
}

const updateProgressSchema = z.object({
  lessonId: z.string().optional(),
  contentId: z.string().optional(),
  completed: z.boolean().optional(),
  timeSpent: z.number().min(0).optional(), // Time spent in seconds
});

// POST /api/student/modules/[id]/progress - Update progress
export const POST = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;

    const body = await request.json();
    const { id } = await context!.params;
    const validationResult = updateProgressSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { lessonId, contentId, completed, timeSpent } = validationResult.data;

    // Get existing progress using db.select (neon-http compatible)
    const progressResult = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.moduleId, id),
          eq(moduleProgress.studentId, userId)
        )
      )
      .limit(1);

    const progress = progressResult[0];

    if (!progress) {
      return NextResponse.json(
        { error: "Not enrolled in this module" },
        { status: 400 }
      );
    }

    const now = new Date();
    let completedLessons = (progress.completedLessons as string[]) || [];
    let updatedProgress = progress.progress;
    let updatedStatus = progress.status;
    let isCompleted = progress.isCompleted || false;
    let totalTimeSpent = progress.timeSpent;

    // Update completed lessons if tracking by lesson
    if (lessonId && completed !== undefined) {
      if (completed && !completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      } else if (!completed && completedLessons.includes(lessonId)) {
        completedLessons = completedLessons.filter((l) => l !== lessonId);
      }
    }

    // Update time spent
    if (timeSpent !== undefined) {
      totalTimeSpent += timeSpent;
    }

    // Get module to calculate progress percentage using db.select (neon-http compatible)
    const moduleResult = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, id))
      .limit(1);

    const module = moduleResult[0];

    if (!module) {
      return errorResponse("Module not found", 404);
    }

    const content = module.content as unknown as ModuleContentData | null;
    const totalLessons = content?.lessons?.length || 1;

    // Calculate progress percentage
    if (totalLessons > 0) {
      updatedProgress = Math.round((completedLessons.length / totalLessons) * 100);
    }

    // Update status based on progress
    if (updatedProgress === 0) {
      updatedStatus = "not_started";
    } else if (updatedProgress < 100) {
      updatedStatus = "in_progress";
    } else {
      updatedStatus = "completed";
      isCompleted = true;
    }

    // Update progress record
    const [updated] = await db
      .update(moduleProgress)
      .set({
        completedLessons,
        currentLesson: lessonId || progress.currentLesson,
        progress: updatedProgress,
        status: updatedStatus,
        isCompleted,
        timeSpent: totalTimeSpent,
        lastAccessedAt: now,
        updatedAt: now,
      })
      .where(eq(moduleProgress.id, progress.id))
      .returning();

    logger.info("Student progress updated", {
      moduleId: id,
      userId,
      progress: updatedProgress,
      completedLessons: completedLessons.length,
    });

    return successResponse({ progress: updated });
  },
  ["student"]
);

// GET /api/student/modules/[id]/progress - Get current progress
export const GET = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    try {
      const { userId } = auth;
      const { id } = await context!.params;

      // Use db.select instead of db.query (neon-http compatible)
      const progressResult = await db
        .select()
        .from(moduleProgress)
        .where(
          and(
            eq(moduleProgress.moduleId, id),
            eq(moduleProgress.studentId, userId)
          )
        )
        .limit(1);

      const progress = progressResult[0];

      if (!progress) {
        return errorResponse("Not enrolled in this module", 404);
      }

      return successResponse({ progress });
    } catch (error) {
      logger.apiError(error, { route: "/api/student/modules/[id]/progress", method: "GET" });
      return errorResponse("Failed to fetch progress", 500);
    }
  },
  ["student"]
);
