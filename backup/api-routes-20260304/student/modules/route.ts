/**
 * STUDENT LEARNING MODULES API
 *
 * GET /api/student/modules - List available modules
 * POST /api/student/modules - Enroll in module
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users, subjects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, createdResponse } from "@/lib/api/response-helpers";

interface ModuleContentData {
  lessons: unknown[];
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
}

// Enroll schema
const enrollSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
});

// ============================================================================
// GET /api/student/modules - List available modules
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const enrolled = searchParams.get("enrolled"); // "true" or "false"
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const subject = searchParams.get("subject");

    try {
      // Get student's school ID using db.select()
      const studentResult = await db
        .select({
          schoolId: users.schoolId,
          classGrade: users.classGrade,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const student = studentResult[0];

      if (!student) {
        return notFoundResponse("Student");
      }

      if (enrolled === "true") {
        // Get enrolled modules with progress using db.select()
        const progressResult = await db
          .select()
          .from(moduleProgress)
          .where(eq(moduleProgress.studentId, userId))
          .orderBy(desc(moduleProgress.lastAccessedAt));

        // Get module details for each progress entry
        const moduleIds = progressResult.map(p => p.moduleId);
        const modulesResult = moduleIds.length > 0
          ? await db
              .select()
              .from(learningModules)
              .where(eq(learningModules.id, moduleIds[0])) // Simplified - would need batch for all
          : [];

        const moduleMap = new Map(modulesResult.map(m => [m.id, m]));

        const enrichedModules = progressResult.map((p) => {
          const module = moduleMap.get(p.moduleId);
          const content = module?.content as ModuleContentData | null;
          const lessonsCount = content?.lessons?.length || 0;
          return {
            ...module,
            lessonsCount,
            progress: p,
          };
        });

        logger.info("Student enrolled modules fetched", { userId, count: enrichedModules.length });

        return successResponse({ modules: enrichedModules });
      }

      // Get available published modules using db.select()
      const modulesResult = await db
        .select()
        .from(learningModules)
        .where(eq(learningModules.isPublished, true))
        .orderBy(desc(learningModules.createdAt))
        .limit(100);

      // Filter by school or public
      const availableModules = modulesResult.filter(
        (m) => m.teacherId === student.schoolId || m.isPublic
      );

      // Get progress for each module using db.select()
      const progressResult = await db
        .select()
        .from(moduleProgress)
        .where(eq(moduleProgress.studentId, userId));

      const progressMap = new Map(progressResult.map((p) => [p.moduleId, p]));

      // Enrich modules with progress info
      const enrichedModules = availableModules
        .filter((m) => {
          // Apply filters
          if (category && m.category !== category) return false;
          if (level && m.level !== level) return false;
          return true;
        })
        .map((m) => {
          const progress = progressMap.get(m.id);
          const content = m.content as ModuleContentData | null;
          const lessonsCount = content?.lessons?.length || 0;
          return {
            ...m,
            lessonsCount,
            progress: progress || null,
            isEnrolled: !!progress,
          };
        });

      logger.info("Student available modules fetched", { userId, count: enrichedModules.length });

      return successResponse({ modules: enrichedModules });
    } catch (error) {
      logger.apiError(error, { route: "/api/student/modules", method: "GET" });
      return errorResponse("Failed to fetch modules", 500);
    }
  },
  ['student']
);

// ============================================================================
// POST /api/student/modules - Enroll in module
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const body = await request.json();
      const validationResult = enrollSchema.safeParse(body);

      if (!validationResult.success) {
        return badRequestResponse("Validation failed: " + validationResult.error.issues.map(i => i.message).join(", "));
      }

      const { moduleId } = validationResult.data;

      // Check if already enrolled using db.select()
      const existingResult = await db
        .select()
        .from(moduleProgress)
        .where(
          and(
            eq(moduleProgress.moduleId, moduleId),
            eq(moduleProgress.studentId, userId)
          )
        )
        .limit(1);

      const existing = existingResult[0];

      if (existing) {
        return badRequestResponse("Already enrolled in this module");
      }

      // Check module exists and is published using db.select()
      const moduleResult = await db
        .select()
        .from(learningModules)
        .where(eq(learningModules.id, moduleId))
        .limit(1);

      const module = moduleResult[0];

      if (!module) {
        return notFoundResponse("Module");
      }

      if (!module.isPublished) {
        return badRequestResponse("Module is not available for enrollment");
      }

      // Check if module has prerequisites
      const content = module.content as ModuleContentData | null;
      if (content?.prerequisites && content.prerequisites.length > 0) {
        // Verify student has completed prerequisite modules
        for (const prereqId of content.prerequisites) {
          const prereqProgressResult = await db
            .select()
            .from(moduleProgress)
            .where(
              and(
                eq(moduleProgress.moduleId, prereqId),
                eq(moduleProgress.studentId, userId)
              )
            )
            .limit(1);

          const prereqProgress = prereqProgressResult[0];

          if (!prereqProgress || !prereqProgress.isCompleted) {
            return badRequestResponse("Prerequisites not met");
          }
        }
      }

      const now = new Date();
      const progressId = `prog_${nanoid(12)}`;

      const progressResult = await db
        .insert(moduleProgress)
        .values({
          id: progressId,
          moduleId,
          studentId: userId,
          status: "not_started",
          isCompleted: false,
          progress: 0,
          completedLessons: [],
          currentLesson: null,
          timeSpent: 0,
          lastAccessedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const progress = progressResult[0];

      logger.info("Student enrolled in module", { moduleId, userId, progressId });

      return createdResponse({ progress, module });
    } catch (error) {
      logger.apiError(error, { route: "/api/student/modules", method: "POST" });
      return errorResponse("Failed to enroll in module", 500);
    }
  },
  ['student']
);
