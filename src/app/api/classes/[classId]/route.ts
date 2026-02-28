/**
 * Single Class API
 *
 * GET /api/classes/[classId] - Get single class
 * PUT /api/classes/[classId] - Update class
 * DELETE /api/classes/[classId] - Delete class
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/classes/[classId] - Get single class
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ classId: string }> }) => {
    const { classId } = await params;
    const { userId } = auth;

    // Check classes.read permission
    const permCheck = await requirePermission(userId, "classes.read");
    if (permCheck) return permCheck;

    const [classData] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classData) {
      return notFoundResponse("Class");
    }

    return successResponse({ class: classData });
  },
  ['admin', 'school-admin', 'teacher', 'counselor', 'student']
);

// ============================================================================
// PUT /api/classes/[classId] - Update class
// ============================================================================

export const PUT = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ classId: string }> }) => {
    const { classId } = await params;
    const { user: currentUser, userId } = auth;
    const body = await req.json();

    // Check classes.update permission
    const permCheck = await requirePermission(userId, "classes.update");
    if (permCheck) return permCheck;

    // Check permissions - must be admin or class teacher
    const [classData] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classData) {
      return notFoundResponse("Class");
    }

    if (currentUser.type !== "admin" && currentUser.type !== "school-admin" && classData.teacherId !== currentUser.id) {
      return forbiddenResponse("You don't have permission to update this class");
    }

    const [updatedClass] = await db
      .update(classes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(classes.id, classId))
      .returning();

    logger.info("Class updated", { classId, userId });

    return successResponse({
      class: updatedClass,
      message: "Class updated successfully",
    });
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// DELETE /api/classes/[classId] - Delete class
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth, { params }: { params: Promise<{ classId: string }> }) => {
    const { classId } = await params;
    const { userId } = auth;

    // Check classes.delete permission
    const permCheck = await requirePermission(userId, "classes.delete");
    if (permCheck) return permCheck;

    await db.delete(classes).where(eq(classes.id, classId));

    logger.info("Class deleted", { classId, userId });

    return successResponse({
      success: true,
      message: "Class deleted successfully",
    });
  },
  ['admin']
);
