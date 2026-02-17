import { logger } from "@/lib/logger";
/**
 * RBAC ROLE PERMISSIONS API
 *
 * GET /api/admin/roles/[roleId]/permissions - Get permissions for a role
 * POST /api/admin/roles/[roleId]/permissions - Assign permission to role
 * DELETE /api/admin/roles/[roleId]/permissions - Remove permission from role
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { roles, rolePermissions, permissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/admin/roles/[roleId]/permissions - Get permissions for a role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { roleId } = await params;

    // Verify role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        role: role[0],
        permissions: rolePermissionsList,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to fetch role permissions" },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles/[roleId]/permissions - Assign permission to role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { roleId } = await params;
    const body = await request.json();
    const { permissionId } = body;

    if (!permissionId) {
      return NextResponse.json(
        { success: false, error: "Permission ID is required" },
        { status: 400 }
      );
    }

    // Verify role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Verify permission exists
    const permission = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (permission.length === 0) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { success: false, error: "Permission already assigned to role" },
        { status: 409 }
      );
    }

    await db.insert(rolePermissions).values({
      id: nanoid(),
      roleId,
      permissionId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Permission assigned to role successfully",
    }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to assign permission to role" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[roleId]/permissions - Remove permission from role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { roleId } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return NextResponse.json(
        { success: false, error: "Permission ID is required" },
        { status: 400 }
      );
    }

    // Verify role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Permission removed from role successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to remove permission from role" },
      { status: 500 }
    );
  }
}
