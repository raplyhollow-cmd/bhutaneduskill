/**
 * PLATFORM ADMIN - GLOBAL SUBJECT DETAILS API
 *
 * GET /api/admin/subjects/[id] - Get single global subject
 * PATCH /api/admin/subjects/[id] - Update global subject
 * DELETE /api/admin/subjects/[id] - Delete global subject
 *
 * Operations on individual global subject templates.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, updatedResponse, deletedResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES & SCHEMA
// ============================================================================

const updateSubjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  type: z.enum(["core", "elective", "language", "additional"]).optional(),
  description: z.string().min(1).optional(),
  grade: z.number().optional(),
  applicableGrades: z.array(z.number()).optional(),
  isActive: z.boolean().optional(),
});

type UpdateSubjectRequest = z.infer<typeof updateSubjectSchema>;

// ============================================================================
// GET /api/admin/subjects/[id] - Get single global subject
// ============================================================================

export const GET = createApiRoute(
  async (req, _auth, context) => {
    const { id } = await (context?.params || Promise.resolve({ id: '' })) as { id: string };

    const [subject] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), isNull(subjects.schoolId)))
      .limit(1);

    if (!subject) {
      return notFoundResponse("Global subject");
    }

    return successResponse({ subject });
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/admin/subjects/[id] - Update global subject
// ============================================================================

export const PATCH = createApiRoute(
  async (req, auth, context) => {
    const { userId } = auth;
    const { id } = await (context?.params || Promise.resolve({ id: '' })) as { id: string };

    try {
      const body = await req.json();
      const validatedData = updateSubjectSchema.parse(body);

      // Check if subject exists and is global
      const [existing] = await db
        .select()
        .from(subjects)
        .where(and(eq(subjects.id, id), isNull(subjects.schoolId)))
        .limit(1);

      if (!existing) {
        return notFoundResponse("Global subject");
      }

      // If updating code, check for duplicates
      if (validatedData.code && validatedData.code !== existing.code) {
        const [duplicate] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.code, validatedData.code))
          .limit(1);

        if (duplicate) {
          return badRequestResponse(`Subject code "${validatedData.code}" already exists`);
        }
      }

      // Build update data
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (validatedData.name !== undefined) updateData.name = validatedData.name;
      if (validatedData.code !== undefined) updateData.code = validatedData.code;
      if (validatedData.type !== undefined) {
        updateData.type = validatedData.type;
        updateData.subjectType = validatedData.type;
      }
      if (validatedData.description !== undefined) updateData.description = validatedData.description;
      if (validatedData.grade !== undefined) updateData.grade = validatedData.grade;
      if (validatedData.applicableGrades !== undefined) {
        updateData.applicableGrades = JSON.stringify(validatedData.applicableGrades);
      }
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      const [updatedSubject] = await db
        .update(subjects)
        .set(updateData)
        .where(and(eq(subjects.id, id), isNull(subjects.schoolId)))
        .returning();

      logger.info("Global subject updated", {
        subjectId: id,
        updatedBy: userId,
        changes: Object.keys(validatedData),
      });

      return updatedResponse({
        subject: updatedSubject,
        message: "Global subject updated successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map((i) => i.message).join(", "));
      }
      logger.error("Global subject update error:", error);
      return errorResponse("Failed to update global subject", 500);
    }
  },
  ["admin"]
);

// ============================================================================
// DELETE /api/admin/subjects/[id] - Delete global subject
// ============================================================================

export const DELETE = createApiRoute(
  async (req, auth, context) => {
    const { userId } = auth;
    const { id } = await (context?.params || Promise.resolve({ id: '' })) as { id: string };

    // Check if subject exists and is global
    const [existing] = await db
      .select({ name: subjects.name, code: subjects.code })
      .from(subjects)
      .where(and(eq(subjects.id, id), isNull(subjects.schoolId)))
      .limit(1);

    if (!existing) {
      return notFoundResponse("Global subject");
    }

    // Delete the subject
    await db
      .delete(subjects)
      .where(and(eq(subjects.id, id), isNull(subjects.schoolId)));

    logger.info("Global subject deleted", {
      subjectId: id,
      subjectCode: existing.code,
      subjectName: existing.name,
      deletedBy: userId,
    });

    return deletedResponse();
  },
  ["admin"]
);
