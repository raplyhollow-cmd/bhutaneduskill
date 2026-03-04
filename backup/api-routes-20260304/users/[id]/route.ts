/**
 * USERS [id] API
 *
 * Handles individual user operations (get, update, delete)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { requirePermission, requireAnyPermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/users/[id] - Get single user
// ============================================================================

export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const { userId, user: currentUser } = auth;

    // Check RBAC permission for reading users OR allow students to read their own profile
    const permCheck = await requireAnyPermission(userId, ["users.read", "users.read.own"]);
    if (permCheck) {
      // If no general permission, check if accessing own profile
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (!user[0] || user[0].id !== id) {
        return permCheck;
      }
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      return notFoundResponse("User");
    }

    return successResponse({ user: targetUser });
  },
  ['admin', 'school-admin', 'counselor', 'teacher', 'student']
);

// ============================================================================
// DELETE /api/users/[id] - Delete user (admin only)
// ============================================================================

export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const { userId } = auth;

    // Check RBAC permission for deleting users
    const permCheck = await requirePermission(userId, "users.delete");
    if (permCheck) return permCheck;

    await db.delete(users).where(eq(users.id, id));

    logger.info("User deleted successfully", { userId: id, deletedBy: userId });

    return successResponse({ success: true });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// PATCH /api/users/[id] - Update user (admin/school-admin)
// ============================================================================

export const PATCH = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const { userId, user: currentUser } = auth;

    // Check RBAC permission for updating users
    const permCheck = await requirePermission(userId, "users.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { name, firstName, lastName } = body;

    // Build update object
    const updateData: { name?: string; firstName?: string; lastName?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }
    if (firstName !== undefined) {
      updateData.firstName = firstName;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName;
    }

    // If both first and last name provided, update full name
    if (firstName !== undefined && lastName !== undefined) {
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    // Update user
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    logger.info("User updated successfully", { userId: id, updatedBy: userId });

    return successResponse({ user: updated });
  },
  ['admin', 'school-admin']
);
