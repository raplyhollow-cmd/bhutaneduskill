import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { roles, rolePermissions, permissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * RBAC ROLE PERMISSIONS API
 *
 * GET /api/admin/roles/[roleId]/permissions - Get permissions for a role
 * POST /api/admin/roles/[roleId]/permissions - Assign permission to role
 * DELETE /api/admin/roles/[roleId]/permissions - Remove permission from role
 */

// GET /api/admin/roles/[roleId]/permissions - Get permissions for a role
export const GET = createApiRoute<{ roleId: string }>(
  async (req, auth, context) => {
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

    // Get all permissions for this role
    const rolePermissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        slug: permissions.slug,
        resource: permissions.resource,
        action: permissions.action,
        module: permissions.module,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId))
      .orderBy(permissions.module, permissions.resource, permissions.action);

    return {
      success: true,
      data: {
        role: role[0],
        permissions: rolePermissionsList,
      },
    };
  },
  ["admin"]
);

// POST /api/admin/roles/[roleId]/permissions - Assign permission to role
export const POST = createApiRoute<{ roleId: string }>(
  async (req, auth, context) => {
    const params = await context?.params || Promise.resolve({ roleId: "" });
    const { roleId } = await params;
    const body = await req.json();
    const { permissionId } = body;

    if (!permissionId) {
      return { success: false, error: "Permission ID is required" };
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

    // Verify permission exists
    const permission = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (permission.length === 0) {
      return { success: false, error: "Permission not found" };
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Permission already assigned to role" };
    }

    await db.insert(rolePermissions).values({
      id: nanoid(),
      roleId,
      permissionId,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: "Permission assigned to role successfully",
    };
  },
  ["admin"]
);

// DELETE /api/admin/roles/[roleId]/permissions - Remove permission from role
export const DELETE = createApiRoute<{ roleId: string }>(
  async (req, auth, context) => {
    const params = await context?.params || Promise.resolve({ roleId: "" });
    const { roleId } = await params;
    const { searchParams } = new URL(req.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return { success: false, error: "Permission ID is required" };
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

    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );

    return {
      success: true,
      message: "Permission removed from role successfully",
    };
  },
  ["admin"]
);
