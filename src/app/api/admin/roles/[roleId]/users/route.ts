import { logger } from "@/lib/logger";
/**
 * RBAC ROLE USERS API
 *
 * GET /api/admin/roles/[roleId]/users - Get users with this role
 * POST /api/admin/roles/[roleId]/users - Assign role to user
 * DELETE /api/admin/roles/[roleId]/users - Remove role from user
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { roles, userRoles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";

// GET /api/admin/roles/[roleId]/users - Get users with this role
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

  const { userId } = authResult;

  // Check RBAC permission for reading users
  const permCheck = await requirePermission(userId, "users.read");
  if (permCheck) return permCheck;

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

    return NextResponse.json({
      success: true,
      data: {
        role: role[0],
        users: usersWithRole,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to fetch role users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles/[roleId]/users - Assign role to user
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

  const { userId } = authResult;

  // Check RBAC permission for assigning roles
  const permCheck = await requirePermission(userId, "users.assign-roles");
  if (permCheck) return permCheck;

  try {
    const { roleId } = await params;
    const { userId } = await authResult;
    const body = await request.json();
    const { targetUserId, expiresAt } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
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

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { success: false, error: "User already has this role" },
        { status: 409 }
      );
    }

    await db.insert(userRoles).values({
      id: nanoid(),
      userId: targetUserId,
      roleId,
      assignedBy: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Role assigned to user successfully",
    }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to assign role to user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[roleId]/users - Remove role from user
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

  const { userId } = authResult;

  // Check RBAC permission for assigning roles (includes removal)
  const permCheck = await requirePermission(userId, "users.assign-roles");
  if (permCheck) return permCheck;

  try {
    const { roleId } = await params;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
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

    // Check if system role
    if (role[0].isSystemRole) {
      return NextResponse.json(
        { success: false, error: "Cannot remove system roles from users" },
        { status: 403 }
      );
    }

    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Role removed from user successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to remove role from user" },
      { status: 500 }
    );
  }
}
