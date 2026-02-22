import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { homework, users, classes, subjects } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { z } from "zod";

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

/**
 * GET /api/teacher/homework - List all homework for teacher's classes
 *
 * Query parameters:
 * - status: "draft" | "published" | "all" (default: "all")
 * - classId: Filter by specific class
 * - subjectId: Filter by specific subject
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser, userId } = authResult;

  // Check homework.read permission
  const permCheck = await requirePermission(userId, "homework.read");
  if (permCheck) return permCheck;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  try {
    // Get classes taught by this teacher (teacherId field in classes table)
    const teacherClasses = await db.query.classes.findMany({
      where: eq(classes.teacherId, currentUser.id),
    });

    const classIds = teacherClasses.map(c => c.id);

    // If teacher has no classes, return empty result
    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          homework: [],
          total: 0,
        },
      });
    }

    // Build query conditions
    const conditions: any[] = [];

    // Only get homework for teacher's classes
    for (const cid of classIds) {
      conditions.push(eq(homework.classId, cid));
    }

    // Additional filters
    if (classId) {
      // Verify teacher owns this class
      if (!classIds.includes(classId)) {
        return NextResponse.json({
          success: false,
          error: "You don't have access to this class",
        }, { status: 403 });
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

    return NextResponse.json({
      success: true,
      data: {
        homework: homeworkList,
        total: homeworkList.length,
      },
    });
  } catch (error) {
    logger.error("Homework fetch error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch homework",
    }, { status: 500 });
  }
}

/**
 * POST /api/teacher/homework - Create new homework
 *
 * Body: JSON object matching createHomeworkSchema
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser, userId } = authResult;

  // Check homework.create permission
  const permCheck = await requirePermission(userId, "homework.create");
  if (permCheck) return permCheck;

  try {
    const body = await request.json();
    const validatedData = createHomeworkSchema.parse(body);

    // Verify the class belongs to this teacher
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, validatedData.classId),
    });

    if (!classInfo) {
      return NextResponse.json({
        success: false,
        error: "Class not found",
      }, { status: 404 });
    }

    // Verify teacher owns this class (unless admin)
    if (currentUser.type !== 'admin' && classInfo.teacherId !== currentUser.id) {
      return NextResponse.json({
        success: false,
        error: "You don't have permission to create homework for this class",
      }, { status: 403 });
    }

    // Verify subject if provided
    if (validatedData.subjectId) {
      const subjectInfo = await db.query.subjects.findFirst({
        where: eq(subjects.id, validatedData.subjectId),
      });

      if (!subjectInfo) {
        return NextResponse.json({
          success: false,
          error: "Subject not found",
        }, { status: 404 });
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
      questions: validatedData.questions as any,
      attachments: validatedData.attachments as any,
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

    return NextResponse.json({
      success: true,
      data: newHomework,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: error.issues,
      }, { status: 400 });
    }
    logger.error("Homework creation error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create homework",
    }, { status: 500 });
  }
}

/**
 * PATCH /api/teacher/homework - Update existing homework
 *
 * Body: JSON object with fields to update
 * Query parameters:
 * - id: Homework ID (required)
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser, userId } = authResult;

  // Check homework.update permission
  const permCheck = await requirePermission(userId, "homework.update");
  if (permCheck) return permCheck;

  const { searchParams } = new URL(request.url);
  const homeworkId = searchParams.get("id");

  if (!homeworkId) {
    return NextResponse.json({
      success: false,
      error: "Homework ID is required",
    }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = updateHomeworkSchema.parse(body);

    // Get existing homework
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, homeworkId),
    });

    if (!existingHomework) {
      return NextResponse.json({
        success: false,
        error: "Homework not found",
      }, { status: 404 });
    }

    // Verify teacher owns this class (unless admin)
    if (currentUser.type !== 'admin') {
      const classInfo = await db.query.classes.findFirst({
        where: eq(classes.id, existingHomework.classId),
      });

      if (!classInfo || classInfo.teacherId !== currentUser.id) {
        return NextResponse.json({
          success: false,
          error: "You don't have permission to update this homework",
        }, { status: 403 });
      }
    }

    // Prepare update data
    const updateData: any = {
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

    return NextResponse.json({
      success: true,
      data: updatedHomework,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: error.issues,
      }, { status: 400 });
    }
    logger.error("Homework update error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update homework",
    }, { status: 500 });
  }
}

/**
 * DELETE /api/teacher/homework - Soft delete homework (set isActive = false)
 *
 * Query parameters:
 * - id: Homework ID (required)
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser, userId } = authResult;

  // Check homework.delete permission
  const permCheck = await requirePermission(userId, "homework.delete");
  if (permCheck) return permCheck;

  const { searchParams } = new URL(request.url);
  const homeworkId = searchParams.get("id");

  if (!homeworkId) {
    return NextResponse.json({
      success: false,
      error: "Homework ID is required",
    }, { status: 400 });
  }

  try {
    // Get existing homework
    const existingHomework = await db.query.homework.findFirst({
      where: eq(homework.id, homeworkId),
    });

    if (!existingHomework) {
      return NextResponse.json({
        success: false,
        error: "Homework not found",
      }, { status: 404 });
    }

    // Verify teacher owns this class (unless admin)
    if (currentUser.type !== 'admin') {
      const classInfo = await db.query.classes.findFirst({
        where: eq(classes.id, existingHomework.classId),
      });

      if (!classInfo || classInfo.teacherId !== currentUser.id) {
        return NextResponse.json({
          success: false,
          error: "You don't have permission to delete this homework",
        }, { status: 403 });
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

    return NextResponse.json({
      success: true,
      data: { id: homeworkId, deleted: true },
    });
  } catch (error) {
    logger.error("Homework deletion error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete homework",
    }, { status: 500 });
  }
}
