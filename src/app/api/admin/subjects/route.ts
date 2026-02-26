/**
 * PLATFORM ADMIN - GLOBAL SUBJECTS API
 *
 * GET /api/admin/subjects - List all global subjects (schoolId IS NULL)
 * POST /api/admin/subjects - Create new global subject
 *
 * Global subjects are templates that schools can copy to their own catalog.
 * They are identified by having schoolId = NULL.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse, conflictResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES & SCHEMA
// ============================================================================

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  type: z.enum(["core", "elective", "language", "additional"]).default("core"),
  description: z.string().min(1, "Description is required"),
  grade: z.number().optional(),
  applicableGrades: z.array(z.number()).optional(),
});

type CreateSubjectRequest = z.infer<typeof subjectSchema>;

// ============================================================================
// GET /api/admin/subjects - List all global subjects
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");
    const grade = searchParams.get("grade");

    // Build conditions for global subjects only
    type QueryCondition = ReturnType<typeof eq> | ReturnType<typeof isNull>;
    const conditions: QueryCondition[] = [isNull(subjects.schoolId)];

    if (isActive === "true") {
      conditions.push(eq(subjects.isActive, true));
    } else if (isActive === "false") {
      conditions.push(eq(subjects.isActive, false));
    }

    if (type) {
      conditions.push(eq(subjects.type, type));
    }

    if (grade) {
      conditions.push(eq(subjects.grade, parseInt(grade)));
    }

    const allSubjects = await db
      .select()
      .from(subjects)
      .where(and(...conditions))
      .orderBy(desc(subjects.createdAt));

    logger.info("Global subjects listed", {
      count: allSubjects.length,
      filters: { isActive, type, grade },
    });

    return successResponse({ subjects: allSubjects });
  },
  ["admin"]
);

// ============================================================================
// POST /api/admin/subjects - Create new global subject
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
      const validatedData = subjectSchema.parse(body);

      // Check for duplicate code (including school-specific subjects)
      const [existing] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.code, validatedData.code))
        .limit(1);

      if (existing) {
        return conflictResponse(`Subject code "${validatedData.code}" already exists`);
      }

      // Generate unique ID
      const subjectId = `subj_${nanoid()}`;

      // Create global subject with schoolId = NULL
      const [newSubject] = await db.insert(subjects).values({
        id: subjectId,
        schoolId: null, // NULL makes this a global subject
        departmentId: null,
        code: validatedData.code,
        name: validatedData.name,
        type: validatedData.type,
        subjectType: validatedData.type,
        description: validatedData.description,
        grade: validatedData.grade || null,
        applicableGrades: validatedData.applicableGrades
          ? JSON.stringify(validatedData.applicableGrades)
          : validatedData.grade
          ? JSON.stringify([validatedData.grade])
          : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      logger.info("Global subject created", {
        subjectId,
        code: newSubject.code,
        name: newSubject.name,
        createdBy: userId,
      });

      return createdResponse({
        subject: newSubject,
        message: `Global subject "${newSubject.name}" created successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map((i) => i.message).join(", "));
      }
      logger.error("Global subject creation error:", error);
      return errorResponse("Failed to create global subject", 500);
    }
  },
  ["admin"]
);
