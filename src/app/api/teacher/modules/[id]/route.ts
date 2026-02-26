/**
 * TEACHER LEARNING MODULE [id] API
 * Individual module operations: GET, PUT, DELETE, and POST (for actions)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

interface ModuleContent {
  id: string;
  type: "text" | "video" | "image" | "document" | "quiz" | "assignment" | "link";
  title: string;
  content?: string;
  url?: string;
  fileUrl?: string;
  duration?: number;
  order: number;
}

interface ModuleLesson {
  id: string;
  title: string;
  description?: string;
  contents: ModuleContent[];
  order: number;
}

interface ModuleContentData {
  lessons: ModuleLesson[];
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
}

interface Params {
  params: Promise<{ id: string }>;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const moduleContentSchema: z.ZodType<ModuleContent> = z.object({
  id: z.string(),
  type: z.enum(["text", "video", "image", "document", "quiz", "assignment", "link"]),
  title: z.string().min(1),
  content: z.string().optional(),
  url: z.string().optional(),
  fileUrl: z.string().optional(),
  duration: z.number().optional(),
  order: z.number(),
});

const moduleLessonSchema: z.ZodType<ModuleLesson> = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  contents: z.array(moduleContentSchema),
  order: z.number(),
});

const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  category: z.enum(["subject", "skill", "exam_prep", "career"]).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.number().min(1).optional(),
  thumbnail: z.string().optional(),
  isPublic: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  price: z.number().min(0).optional(),
  content: z.object({
    lessons: z.array(moduleLessonSchema).optional(),
    objectives: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

// ============================================================================
// GET /api/teacher/modules/[id] - Get module details with stats
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;

    const { id } = await params;

    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
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
            email: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (module.teacherId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Not your module" },
        { status: 403 }
      );
    }

    // Get enrollment stats
    const enrollments = await db.query.moduleProgress.findMany({
      where: eq(moduleProgress.moduleId, id),
    });

    const completedCount = enrollments.filter((e) => e.isCompleted).length;
    const inProgressCount = enrollments.filter((e) => !e.isCompleted && e.progress > 0).length;
    const notStartedCount = enrollments.filter((e) => e.progress === 0).length;

    const averageProgress =
      enrollments.length > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
        : 0;

    const stats = {
      totalEnrollments: enrollments.length,
      completed: completedCount,
      inProgress: inProgressCount,
      notStarted: notStartedCount,
      averageProgress,
    };

    // Get lessons count from content
    const content = module.content as ModuleContentData | null;
    const lessonsCount = content?.lessons?.length || 0;

    const enrichedModule = {
      ...module,
      lessonsCount,
      stats,
    };

    logger.info("Teacher module fetched", { moduleId: id, userId });

    return successResponse({
      module: enrichedModule,
      stats,
    });
  },
  ["teacher"]
);

// ============================================================================
// PUT /api/teacher/modules/[id] - Update module
// ============================================================================

export const PUT = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;

    const body = await request.json();
    const validationResult = updateModuleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const { id } = await params;

    // Verify ownership
    const existing = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    if (existing.teacherId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Not your module" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
    if (data.classId !== undefined) updateData.classId = data.classId;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.isPremium !== undefined) updateData.isPremium = data.isPremium;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.content !== undefined) {
      updateData.content = data.content;
      // Also update tags, objectives, prerequisites from content
      if (data.content.tags !== undefined) updateData.tags = data.content.tags;
      if (data.content.objectives !== undefined) updateData.objectives = data.content.objectives;
      if (data.content.prerequisites !== undefined) updateData.prerequisites = data.content.prerequisites;
    }

    const [updated] = await db
      .update(learningModules)
      .set(updateData)
      .where(eq(learningModules.id, id))
      .returning();

    logger.info("Learning module updated", { moduleId: id, userId });

    return successResponse({ module: updated });
  },
  ["teacher"]
);

// ============================================================================
// DELETE /api/teacher/modules/[id] - Delete module
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;

    const { id } = await params;

    // Verify ownership
    const existing = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    if (existing.teacherId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Not your module" },
        { status: 403 }
      );
    }

    // Check for enrollments
    const enrollments = await db.query.moduleProgress.findMany({
      where: eq(moduleProgress.moduleId, id),
    });

    if (enrollments.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete module with active enrollments",
          details: { enrollmentCount: enrollments.length },
        },
        { status: 400 }
      );
    }

    await db.delete(learningModules).where(eq(learningModules.id, id));

    logger.info("Learning module deleted", { moduleId: id, userId });

    return successResponse({ message: "Module deleted successfully" });
  },
  ["teacher"]
);

// ============================================================================
// POST /api/teacher/modules/[id] - Module actions (publish, duplicate)
// ============================================================================

const actionSchema = z.object({
  action: z.enum(["publish", "unpublish", "duplicate"]),
});

export const POST = createApiRoute(
  async (request: NextRequest, auth, context?: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;

    const body = await request.json();
    const actionResult = actionSchema.safeParse(body);

    if (!actionResult.success) {
      return NextResponse.json(
        {
          error: "Invalid action",
          details: actionResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { action } = actionResult.data;
    const { id } = await params;

    // Verify ownership
    const existing = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    if (existing.teacherId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Not your module" },
        { status: 403 }
      );
    }

    if (action === "publish") {
      const [updated] = await db
        .update(learningModules)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(eq(learningModules.id, id))
        .returning();

      logger.info("Learning module published", { moduleId: id, userId });

      return NextResponse.json({ module: updated });
    }

    if (action === "unpublish") {
      const [updated] = await db
        .update(learningModules)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(eq(learningModules.id, id))
        .returning();

      logger.info("Learning module unpublished", { moduleId: id, userId });

      return NextResponse.json({ module: updated });
    }

    if (action === "duplicate") {
      const { nanoid } = await import("nanoid");
      const newId = `mod_${nanoid(12)}`;
      const now = new Date();

      const [duplicated] = await db
        .insert(learningModules)
        .values({
          id: newId,
          title: `${existing.title} (Copy)`,
          description: existing.description,
          subjectId: existing.subjectId,
          classId: existing.classId,
          teacherId: userId,
          category: existing.category,
          level: existing.level,
          duration: existing.duration,
          content: existing.content,
          thumbnail: existing.thumbnail,
          isPublic: false, // Duplicate starts as draft
          isPremium: existing.isPremium,
          isPublished: false, // Duplicate starts as draft
          price: existing.price,
          tags: existing.tags,
          objectives: existing.objectives,
          prerequisites: existing.prerequisites,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      logger.info("Learning module duplicated", { moduleId: id, newId, userId });

      return NextResponse.json(
        { module: duplicated },
        { status: 201 }
      );
    }

    return errorResponse("Invalid action", 400);
  },
  ["teacher"]
);
