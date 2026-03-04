/**
 * TEACHER HOMEWORK API
 *
 * GET /api/teacher/homework - List all homework for teacher's classes
 * POST /api/teacher/homework - Create new homework
 * PATCH /api/teacher/homework - Update existing homework
 * DELETE /api/teacher/homework - Soft delete homework
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { homework, users, classes, subjects } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse, forbiddenResponse, createdResponse, deletedResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac";
import type { SQL } from "drizzle-orm";
import type { AuthContext } from "@/lib/api/route-handler";
import { broadcastHomeworkCreated } from "@/lib/notifications-broadcast";

// ============================================================================
// TYPES
// ============================================================================

type WhereCondition = SQL | undefined;

/**
 * Validation schema for creating homework
 * Matches the homework table structure in schema.ts
 */
const createHomeworkSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  subjectId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  assignedDate: z.string().min(1, "Assigned date is required"),
  totalPoints: z.number().int().min(0).optional(),
  passingScore: z.number().int().min(0).optional(),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(["multiple_choice", "true_false", "short_answer", "essay", "fill_blank", "numeric", "math_expression", "match_following", "match", "graph_plot", "handwriting"]),
    text: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
    points: z.number().int().min(0),
  })).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
  })).optional(),
  isPublished: z.boolean().optional().default(false),
});

/**
 * Validation schema for updating homework
 */
const updateHomeworkSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().optional(),
  assignedDate: z.string().optional(),
  totalPoints: z.number().int().min(0).optional(),
  passingScore: z.number().int().min(0).optional(),
  questions: z.array(z.object({
    id: z.string(),
    type: z.string(),
    text: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.any().optional(),
    points: z.number().int().min(0),
  })).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
  })).optional(),
  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// GET /api/teacher/homework - List all homework for teacher's classes
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth: AuthContext | null) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser, userId } = auth;

    // Check homework.read permission
    const permCheck = await requirePermission(userId, "homework.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    try {
      // Get classes taught by this teacher (classTeacherId field in classes table)
      const teacherClasses = await db
        .select({ id: classes.id })
        .from(classes)
        .where(eq(classes.classTeacherId, currentUser.id));

      const classIds = teacherClasses.map(c => c.id);

      // If teacher has no classes, return empty result
      if (classIds.length === 0) {
        return successResponse({
          homework: [],
          total: 0,
        });
      }

      // Build query conditions
      const conditions: WhereCondition[] = [];

      // Only get homework for teacher's classes
      for (const cid of classIds) {
        conditions.push(eq(homework.classId, cid));
      }

      // Additional filters
      if (classId) {
        // Verify teacher owns this class
        if (!classIds.includes(classId)) {
          return forbiddenResponse("You don't have access to this class");
        }
        conditions.length = 0; // Clear previous conditions
        conditions.push(eq(homework.classId, classId));
      }

      if (subjectId) {
        conditions.push(eq(homework.subjectId, subjectId));
      }

      // Status filtering
      if (status === "draft") {
        conditions.push(sql`${homework.isPublished} = false`);
      } else if (status === "published") {
        conditions.push(sql`${homework.isPublished} = true`);
      }

      // Only active homework (not deleted)
      conditions.push(sql`${homework.isActive} = true`);

      const homeworkList = await db
        .select({
          id: homework.id,
          classId: homework.classId,
          subjectId: homework.subjectId,
          title: homework.title,
          description: homework.description,
          dueDate: homework.dueDate,
          assignedDate: homework.assignedDate,
          totalPoints: homework.totalPoints,
          passingScore: homework.passingScore,
          questions: homework.questions,
          attachments: homework.attachments,
          isPublished: homework.isPublished,
          isActive: homework.isActive,
          createdAt: homework.createdAt,
          updatedAt: homework.updatedAt,
          // Include related data
          className: classes.name,
          classGrade: classes.grade,
          classSection: classes.section,
          subjectName: subjects.name,
          subjectCode: subjects.code,
        })
        .from(homework)
        .innerJoin(classes, eq(homework.classId, classes.id))
        .leftJoin(subjects, eq(homework.subjectId, subjects.id))
        .where(and(...conditions))
        .orderBy(desc(homework.createdAt));

      return successResponse({
        homework: homeworkList,
        total: homeworkList.length,
      });
    } catch (error) {
      logger.error("Homework fetch error:", error);
      return errorResponse("Failed to fetch homework", 500);
    }
  },
  ['teacher', 'admin']
);

// ============================================================================
// POST /api/teacher/homework - Create new homework
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth: AuthContext | null) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser, userId } = auth;

    // Check homework.create permission
    const permCheck = await requirePermission(userId, "homework.create");
    if (permCheck) return permCheck;

    try {
      const body = await request.json();
      const validatedData = createHomeworkSchema.parse(body);

      // Verify the class belongs to this teacher
      const classInfoResult = await db
        .select()
        .from(classes)
        .where(eq(classes.id, validatedData.classId))
        .limit(1);

      const classInfo = classInfoResult[0] || null;

      if (!classInfo) {
        return notFoundResponse("Class");
      }

      // Verify teacher owns this class (unless admin)
      if (currentUser.type !== 'admin' && classInfo.teacherId !== currentUser.id) {
        return forbiddenResponse("You don't have permission to create homework for this class");
      }

      // Verify subject if provided
      let subjectInfo: typeof subjects.$inferSelect | null = null;
      if (validatedData.subjectId) {
        const subjectInfoResult = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, validatedData.subjectId))
          .limit(1);

        subjectInfo = subjectInfoResult[0] || null;

        if (!subjectInfo) {
          return notFoundResponse("Subject");
        }
      }

      // Calculate total points from questions if not provided
      let totalPoints = validatedData.totalPoints;
      if (!totalPoints && validatedData.questions) {
        totalPoints = validatedData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      }

      // Default passing score to 60% if not provided
      const passingScore = validatedData.passingScore ?? Math.floor((totalPoints || 100) * 0.6);

      // Generate unique ID
      const homeworkId = `hw_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const [newHomework] = await db.insert(homework).values({
        id: homeworkId,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate,
        assignedDate: validatedData.assignedDate,
        totalPoints: totalPoints || 100,
        passingScore,
        questions: validatedData.questions as typeof homework.$inferInsert.questions,
        attachments: validatedData.attachments as typeof homework.$inferInsert.attachments,
        isPublished: validatedData.isPublished ?? false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      logger.info("Homework created", {
        homeworkId,
        teacherId: currentUser.id,
        classId: validatedData.classId,
      });

      // Broadcast to students in the class
      await broadcastHomeworkCreated(validatedData.classId, {
        id: newHomework.id,
        title: newHomework.title,
        description: newHomework.description || "",
        dueDate: newHomework.dueDate,
        classId: validatedData.classId,
        teacherName: (currentUser as { name?: string }).name || "Your teacher",
        subjectName: subjectInfo?.name,
      }).catch((err) => {
        // Don't fail the request if broadcast fails
        logger.error("Failed to broadcast homework creation", { error: err });
      });

      return createdResponse(newHomework);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.error("Homework creation error:", error);
      return errorResponse("Failed to create homework", 500);
    }
  },
  ['teacher', 'admin']
);

// ============================================================================
// PATCH /api/teacher/homework - Update existing homework
// ============================================================================

export const PATCH = createApiRoute(
  async (request: NextRequest, auth: AuthContext | null) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser, userId } = auth;

    // Check homework.update permission
    const permCheck = await requirePermission(userId, "homework.update");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get("id");

    if (!homeworkId) {
      return badRequestResponse("Homework ID is required");
    }

    try {
      const body = await request.json();
      const validatedData = updateHomeworkSchema.parse(body);

      // Get existing homework
      const existingHomeworkResult = await db
        .select()
        .from(homework)
        .where(eq(homework.id, homeworkId))
        .limit(1);

      const existingHomework = existingHomeworkResult[0] || null;

      if (!existingHomework) {
        return notFoundResponse("Homework");
      }

      // Verify teacher owns this class (unless admin)
      if (currentUser.type !== 'admin') {
        const classInfoResult = await db
          .select()
          .from(classes)
          .where(eq(classes.id, existingHomework.classId))
          .limit(1);

        const classInfo = classInfoResult[0] || null;

        if (!classInfo || classInfo.teacherId !== currentUser.id) {
          return forbiddenResponse("You don't have permission to update this homework");
        }
      }

      // Prepare update data
      const updateData: {
        [key: string]: unknown;
        updatedAt: Date;
        totalPoints?: number;
      } = {
        ...validatedData,
        updatedAt: new Date(),
      };

      // Calculate total points from questions if questions are being updated
      if (validatedData.questions && !validatedData.totalPoints) {
        updateData.totalPoints = validatedData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      }

      const [updatedHomework] = await db.update(homework)
        .set(updateData)
        .where(eq(homework.id, homeworkId))
        .returning();

      logger.info("Homework updated", {
        homeworkId,
        teacherId: currentUser.id,
      });

      return successResponse(updatedHomework);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.error("Homework update error:", error);
      return errorResponse("Failed to update homework", 500);
    }
  },
  ['teacher', 'admin']
);

// ============================================================================
// DELETE /api/teacher/homework - Soft delete homework (set isActive = false)
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth: AuthContext | null) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user: currentUser, userId } = auth;

    // Check homework.delete permission
    const permCheck = await requirePermission(userId, "homework.delete");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get("id");

    if (!homeworkId) {
      return badRequestResponse("Homework ID is required");
    }

    try {
      // Get existing homework
      const existingHomeworkResult = await db
        .select()
        .from(homework)
        .where(eq(homework.id, homeworkId))
        .limit(1);

      const existingHomework = existingHomeworkResult[0] || null;

      if (!existingHomework) {
        return notFoundResponse("Homework");
      }

      // Verify teacher owns this class (unless admin)
      if (currentUser.type !== 'admin') {
        const classInfoResult = await db
          .select()
          .from(classes)
          .where(eq(classes.id, existingHomework.classId))
          .limit(1);

        const classInfo = classInfoResult[0] || null;

        if (!classInfo || classInfo.teacherId !== currentUser.id) {
          return forbiddenResponse("You don't have permission to delete this homework");
        }
      }

      // Soft delete by setting isActive to false
      await db.update(homework)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(homework.id, homeworkId));

      logger.info("Homework deleted", {
        homeworkId,
        teacherId: currentUser.id,
      });

      return successResponse({ id: homeworkId, deleted: true });
    } catch (error) {
      logger.error("Homework deletion error:", error);
      return errorResponse("Failed to delete homework", 500);
    }
  },
  ['teacher', 'admin']
);
