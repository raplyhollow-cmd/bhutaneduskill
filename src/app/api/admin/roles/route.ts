/**
 * RBAC ROLES API
 *
 * GET /api/admin/roles - List all roles
 * POST /api/admin/roles - Create new role
 * PATCH /api/admin/roles - Update role
 * DELETE /api/admin/roles - Delete role
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { roles, rolePermissions, permissions, userRoles, users } from "@/lib/db/schema";
import { eq, desc, like, or, count, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/admin/roles - List all roles
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
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

    return NextResponse.json({
      success: true,
      data: rolesList,
    });
  } catch (error) {
    console.error("Roles fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Role with this slug already exists" },
        { status: 409 }
      );
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

    return NextResponse.json({
      success: true,
      data: newRole,
    }, { status: 201 });
  } catch (error) {
    console.error("Role creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create role" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/roles - Update role
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body = await request.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Check if role exists and is not a system role
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    if (existing[0].isSystemRole) {
      return NextResponse.json(
        { success: false, error: "Cannot modify system roles" },
        { status: 403 }
      );
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

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles - Delete role
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Role ID is required" },
        { status: 400 }
      );
    }

    // Check if role exists and is not a system role
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    if (existing[0].isSystemRole) {
      return NextResponse.json(
        { success: false, error: "Cannot delete system roles" },
        { status: 403 }
      );
    }

    await db.delete(roles).where(eq(roles.id, id));

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Role deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
