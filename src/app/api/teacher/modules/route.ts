/**
 * TEACHER LEARNING MODULES API
 * CRUD operations for learning modules created by teachers
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { learningModules, users, moduleProgress } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { LearningModuleContent } from "@/types";

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
  duration?: number;
  contents: ModuleContent[];
  order: number;
}

interface ModuleContentData {
  lessons: ModuleLesson[];
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
}

// Type that matches the database schema's LearningModuleContent
interface DbLearningModuleContent {
  lessons: Array<{
    id: string;
    title: string;
    duration: number;
    videoUrl?: string;
    content?: string;
    resources?: Array<{ name: string; url: string }>;
  }>;
  objectives?: string[];
  prerequisites?: string[];
}

// Type for learning module insert values
interface LearningModuleInsertValues {
  id: string;
  title: string;
  description: string;
  subjectId?: string;
  classId?: string;
  teacherId: string;
  category: string;
  level: string;
  duration: number;
  content: ModuleContentData;
  thumbnail: string;
  isPublic: boolean;
  isPremium: boolean;
  isPublished: boolean;
  price: number;
  tags?: string[];
  objectives?: string[];
  prerequisites?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  duration: z.number().default(0),
  contents: z.array(moduleContentSchema),
  order: z.number(),
});

const createModuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  category: z.enum(["subject", "skill", "exam_prep", "career"]).default("subject"),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  duration: z.number().min(1).optional(),
  thumbnail: z.string().optional(),
  isPublic: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  price: z.number().min(0).default(0),
  content: z.object({
    lessons: z.array(moduleLessonSchema).default([]),
    objectives: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

const updateModuleSchema = createModuleSchema.partial();

// ============================================================================
// GET /api/teacher/modules - List all modules created by teacher
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // draft, published, all
    const category = searchParams.get("category");

    // Get modules with stats
    const modules = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.teacherId, userId))
      .orderBy(desc(learningModules.createdAt));

    // Get enrollment stats for each module individually
    const enrichedModules = await Promise.all(
      modules.map(async (m) => {
        const enrollments = await db
          .select()
          .from(moduleProgress)
          .where(eq(moduleProgress.moduleId, m.id));

        const completedCount = enrollments.filter((e) => e.isCompleted).length;
        const content = m.content as unknown as ModuleContentData | null;
        const lessonsCount = content?.lessons?.length || 0;

        return {
          ...m,
          lessonsCount,
          enrollmentCount: enrollments.length,
          completedCount,
        };
      })
    );

    // Filter by status if specified
    let filteredModules = enrichedModules;
    if (status === "draft") {
      filteredModules = enrichedModules.filter((m) => !m.isPublished);
    } else if (status === "published") {
      filteredModules = enrichedModules.filter((m) => m.isPublished);
    }

    // Filter by category if specified
    if (category) {
      filteredModules = filteredModules.filter((m) => m.category === category);
    }

    logger.info("Teacher modules fetched", { userId, count: filteredModules.length });

    return successResponse({ modules: filteredModules });
  },
  ["teacher"]
);

// ============================================================================
// POST /api/teacher/modules - Create new learning module
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const body = await request.json();
    const validationResult = createModuleSchema.safeParse(body);

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
    const now = new Date();
    const moduleId = `mod_${nanoid(12)}`;

    // Calculate duration from lessons if not provided
    let duration = data.duration;
    if (!duration && data.content?.lessons) {
      const lessonDurations = data.content.lessons.reduce((sum, lesson) => {
        const contentDurations = lesson.contents.reduce((cSum, content) => cSum + (content.duration || 0), 0);
        return sum + contentDurations;
      }, 0);
      duration = lessonDurations || 60; // Default 1 hour if no duration set
    }
    if (!duration) {
      duration = 60; // Default 1 hour
    }

    const [newModule] = await db
      .insert(learningModules)
      .values({
        id: moduleId,
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: userId,
        category: data.category,
        level: data.level,
        duration,
        content: {
          lessons: data.content?.lessons?.map(l => ({
            id: l.id,
            title: l.title,
            duration: l.duration || 0,
            videoUrl: l.contents?.find(c => c.type === "video")?.url,
            content: l.contents?.find(c => c.type === "text")?.content,
            resources: l.contents?.filter(c => c.type === "document" || c.type === "link").map(c => ({
              name: c.title || c.url || "",
              url: c.url || c.fileUrl || "",
            })),
          })) || [],
          objectives: data.content?.objectives,
          prerequisites: data.content?.prerequisites,
          tags: data.content?.tags,
        } as LearningModuleContent & { [key: string]: unknown },
        thumbnail: data.thumbnail || "/images/default-module-thumbnail.png",
        isPublic: data.isPublic,
        isPremium: data.isPremium,
        isPublished: data.isPublished,
        price: data.price,
        tags: data.content?.tags,
        objectives: data.content?.objectives,
        prerequisites: data.content?.prerequisites,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info("Learning module created", { moduleId, userId, title: data.title });

    return successResponse(
      { module: newModule },
      201
    );
  },
  ["teacher"]
);
