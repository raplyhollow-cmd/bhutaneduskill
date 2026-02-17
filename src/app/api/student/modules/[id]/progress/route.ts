/**
 * STUDENT MODULE PROGRESS API
 * Track and update student progress through lessons
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { moduleProgress, learningModules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const body = await request.json();
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
    const { id } = await params;

    // Get existing progress
    const progress = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, id),
        eq(moduleProgress.studentId, userId)
      ),
    });

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

    // Get module to calculate progress percentage
    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    const content = module.content as ModuleContentData | null;
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

    return NextResponse.json({ progress: updated });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules/[id]/progress", method: "POST" });
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// GET /api/student/modules/[id]/progress - Get current progress
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

    const { id } = await params;

    const progress = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, id),
        eq(moduleProgress.studentId, userId)
      ),
    });

    if (!progress) {
      return NextResponse.json(
        { error: "Not enrolled in this module" },
        { status: 404 }
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules/[id]/progress", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
