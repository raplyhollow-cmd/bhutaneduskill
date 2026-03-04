import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { roles, userRoles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/rbac";

/**
 * RBAC ROLE USERS API
 *
 * GET /api/admin/roles/[roleId]/users - Get users with this role
 * POST /api/admin/roles/[roleId]/users - Assign role to user
 * DELETE /api/admin/roles/[roleId]/users - Remove role from user
 */

// GET /api/admin/roles/[roleId]/users - Get users with this role
export const GET = createApiRoute<{ roleId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    // Check RBAC permission for reading users
    const permCheck = await requirePermission(userId, "users.read");
    if (permCheck) return permCheck;

    const params = await context?.params || Promise.resolve({ roleId: "" });
    const { roleId } = await params;

    // Verify role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return { success: false, error: "Role not found" };
    }

    // Get all users with this role
    const usersWithRole = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        type: users.type,
        clerkUserId: users.clerkUserId,
        assignedAt: userRoles.createdAt,
        expiresAt: userRoles.expiresAt,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, roleId))
      .orderBy(userRoles.createdAt);

    return {
      success: true,
      data: {
        role: role[0],
        users: usersWithRole,
      },
    };
  },
  ["admin"]
);

// POST /api/admin/roles/[roleId]/users - Assign role to user
export const POST = createApiRoute<{ roleId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    // Check RBAC permission for assigning roles
    const permCheck = await requirePermission(userId, "users.assign-roles");
    if (permCheck) return permCheck;

    const params = await context?.params || Promise.resolve({ roleId: "" });
    const { roleId } = await params;
    const body = await req.json();
    const { targetUserId, expiresAt } = body;

    if (!targetUserId) {
      return { success: false, error: "User ID is required" };
    }

    // Verify role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return { success: false, error: "Role not found" };
    }

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (user.length === 0) {
      return { success: false, error: "User not found" };
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "User already has this role" };
    }

    await db.insert(userRoles).values({
      id: nanoid(),
      userId: targetUserId,
      roleId,
      assignedBy: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: "Role assigned to user successfully",
    };
  },
  ["admin"]
);

// DELETE /api/admin/roles/[roleId]/users - Remove role from user
export const DELETE = createApiRoute<{ roleId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    // Check RBAC permission for assigning roles (includes removal)
    const permCheck = await requirePermission(userId, "users.assign-roles");
    if (permCheck) return permCheck;

    const params = await context?.params || Promise.resolve({ roleId: "" });
    const { roleId } = await params;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return { success: false, error: "User ID is required" };
    }

    // Verify role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return { success: false, error: "Role not found" };
    }

    // Check if system role
    if (role[0].isSystemRole) {
      return { success: false, error: "Cannot remove system roles from users" };
    }

    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId)
        )
      );

    return {
      success: true,
      message: "Role removed from user successfully",
    };
  },
  ["admin"]
);
