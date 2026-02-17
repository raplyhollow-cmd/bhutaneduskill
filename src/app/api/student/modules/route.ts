/**
 * STUDENT LEARNING MODULES API
 * Browse and enroll in learning modules
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users } from "@/lib/db/schema";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import { z } from "zod";

interface ModuleContentData {
  lessons: unknown[];
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
}

// GET /api/student/modules - List available modules
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const enrolled = searchParams.get("enrolled"); // "true" or "false"
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const subject = searchParams.get("subject");

    // Get student's school ID
    const student = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        schoolId: true,
        classGrade: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (enrolled === "true") {
      // Get enrolled modules with progress
      const myProgress = await db.query.moduleProgress.findMany({
        where: eq(moduleProgress.studentId, userId),
        with: {
          module: {
            with: {
              subject: {
                columns: {
                  id: true,
                  name: true,
                },
              },
              teacher: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: [desc(moduleProgress.lastAccessedAt)],
      });

      const enrichedModules = myProgress.map((p) => {
        const content = (p.module as any)?.content as ModuleContentData | null;
        const lessonsCount = content?.lessons?.length || 0;
        return {
          ...(p.module as any),
          lessonsCount,
          progress: p,
        };
      });

      logger.info("Student enrolled modules fetched", { userId, count: enrichedModules.length });

      return NextResponse.json({ modules: enrichedModules });
    }

    // Get available published modules from student's school and public modules
    const modules = await db.query.learningModules.findMany({
      where: eq(learningModules.isPublished, true),
      with: {
        subject: {
          columns: {
            id: true,
            name: true,
          },
        },
        teacher: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [desc(learningModules.createdAt)],
    });

    // Filter by school or public
    const availableModules = modules.filter(
      (m) => m.teacherId === student.schoolId || m.isPublic
    );

    // Get progress for each module
    const moduleIds = availableModules.map((m) => m.id);
    const progressList = moduleIds.length > 0
      ? await db.query.moduleProgress.findMany({
          where: and(
            eq(moduleProgress.studentId, userId),
          ),
        })
      : [];

    const progressMap = new Map(progressList.map((p) => [p.moduleId, p]));

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

    return NextResponse.json({ modules: enrichedModules });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}

// POST /api/student/modules - Enroll in module
const enrollSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
});

export async function POST(request: NextRequest) {
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
    const validationResult = enrollSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { moduleId } = validationResult.data;

    // Check if already enrolled
    const existing = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, moduleId),
        eq(moduleProgress.studentId, userId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already enrolled in this module" },
        { status: 400 }
      );
    }

    // Check module exists and is published
    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, moduleId),
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    if (!module.isPublished) {
      return NextResponse.json(
        { error: "Module is not available for enrollment" },
        { status: 400 }
      );
    }

    // Check if module has prerequisites
    const content = module.content as ModuleContentData | null;
    if (content?.prerequisites && content.prerequisites.length > 0) {
      // Verify student has completed prerequisite modules
      for (const prereqId of content.prerequisites) {
        const prereqProgress = await db.query.moduleProgress.findFirst({
          where: and(
            eq(moduleProgress.moduleId, prereqId),
            eq(moduleProgress.studentId, userId)
          ),
        });

        if (!prereqProgress || !prereqProgress.isCompleted) {
          return NextResponse.json(
            {
              error: "Prerequisites not met",
              details: { prerequisites: content.prerequisites },
            },
            { status: 400 }
          );
        }
      }
    }

    const now = new Date();
    const progressId = `prog_${nanoid(12)}`;

    const [progress] = await db
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

    logger.info("Student enrolled in module", { moduleId, userId, progressId });

    return NextResponse.json(
      { progress, module },
      { status: 201 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules", method: "POST" });
    return NextResponse.json(
      { error: "Failed to enroll in module" },
      { status: 500 }
    );
  }
}
