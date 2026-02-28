/**
 * RBAC ROLES API
 *
 * GET /api/admin/roles - List all roles
 * POST /api/admin/roles - Create new role
 * PATCH /api/admin/roles - Update role
 * DELETE /api/admin/roles - Delete role
 */

import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { roles, rolePermissions, permissions, userRoles, users } from "@/lib/db/schema";
import { eq, desc, like, or, count, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

// GET /api/admin/roles - List all roles
export const GET = createApiRoute(
  async (req, auth) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let whereCondition = undefined;
    if (search) {
      whereCondition = or(
        like(roles.name, `%${search}%`),
        like(roles.slug, `%${search}%`)
      );
    }

    const rolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        slug: roles.slug,
        description: roles.description,
        isSystemRole: roles.isSystemRole,
        isActive: roles.isActive,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
        permissionCount: sql<number>`(
          SELECT COUNT(*)
          FROM role_permissions
          WHERE role_permissions.role_id = roles.id
        )`.mapWith(Number),
        userCount: sql<number>`(
          SELECT COUNT(*)
          FROM user_roles
          WHERE user_roles.role_id = roles.id
        )`.mapWith(Number),
      })
      .from(roles)
      .where(whereCondition)
      .orderBy(desc(roles.createdAt));

    return {
      success: true,
      data: rolesList,
    };
  },
  ["admin"]
);

// POST /api/admin/roles - Create new role
export const POST = createApiRoute(
  async (req, auth) => {
    const body = await req.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return { success: false, error: "Name and slug are required" };
    }

    // Check if slug already exists
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Role with this slug already exists" };
    }

    const [newRole] = await db
      .insert(roles)
      .values({
        id: `role_${nanoid()}`,
        name,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        description,
        isSystemRole: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      data: newRole,
    };
  },
  ["admin"]
);

// PATCH /api/admin/roles - Update role
export const PATCH = createApiRoute(
  async (req, auth) => {
    const body = await req.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return { success: false, error: "Role ID is required" };
    }

    // Check if role exists and is not a system role
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "Role not found" };
    }

    if (existing[0].isSystemRole) {
      return { success: false, error: "Cannot modify system roles" };
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(roles)
      .set(updateData)
      .where(eq(roles.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  },
  ["admin"]
);

// DELETE /api/admin/roles - Delete role
export const DELETE = createApiRoute(
  async (req, auth) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return { success: false, error: "Role ID is required" };
    }

    // Check if role exists and is not a system role
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "Role not found" };
    }

    if (existing[0].isSystemRole) {
      return { success: false, error: "Cannot delete system roles" };
    }

    await db.delete(roles).where(eq(roles.id, id));

    return {
      success: true,
      message: "Role deleted successfully",
    };
  },
  ["admin"]
);