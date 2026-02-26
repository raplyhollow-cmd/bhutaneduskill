/**
 * SCHOOL ADMIN SUBJECTS API
 *
 * GET /api/school-admin/subjects - List subjects
 * POST /api/school-admin/subjects - Create subject
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subjects, users } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import type { SQL } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

type WhereCondition = SQL | undefined;

const subjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["core", "elective", "optional"]).default("core"),
  grade: z.number().optional(),
  description: z.string().optional(),
});

// ============================================================================
// GET /api/school-admin/subjects - List subjects
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Get user's schoolId
    const [userRecord] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const schoolId = userRecord?.schoolId;

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const isActive = searchParams.get("isActive");

    const conditions: WhereCondition[] = [];
    if (schoolId) {
      conditions.push(eq(subjects.schoolId, schoolId));
    }

    if (isActive === "true") {
      conditions.push(eq(subjects.isActive, true));
    } else if (isActive === "false") {
      conditions.push(eq(subjects.isActive, false));
    }

    if (grade) {
      conditions.push(eq(subjects.grade, parseInt(grade)));
    }

    const allSubjects = await db
      .select()
      .from(subjects)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(subjects.createdAt));

    return successResponse({ subjects: allSubjects });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// POST /api/school-admin/subjects - Create subject
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Get user's schoolId
    const [userRecord] = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const schoolId = userRecord?.schoolId;

    if (!schoolId) {
      return badRequestResponse("School not found");
    }

    try {
      const body = await request.json();
      const validatedData = subjectSchema.parse(body);

      // Check for duplicate code
      const [existing] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.code, validatedData.code))
        .limit(1);

      if (existing) {
        return badRequestResponse("Subject code already exists");
      }

      const [newSubject] = await db.insert(subjects).values({
        id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        schoolId,
        code: validatedData.code,
        name: validatedData.name,
        type: validatedData.type,
        subjectType: validatedData.type,
        grade: validatedData.grade || null,
        description: validatedData.description || null,
        applicableGrades: validatedData.grade ? JSON.stringify([validatedData.grade]) : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return createdResponse({ subject: newSubject });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.error("Subject creation error:", error);
      return errorResponse("Failed to create subject", 500);
    }
  },
  ['admin', 'school-admin']
);
