import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission, requireAnyPermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth(["admin", "school-admin", "counselor", "teacher", "student"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user: currentUser } = authResult;

    // Check RBAC permission for reading users OR allow students to read their own profile
    const permCheck = await requireAnyPermission(userId, ["users.read", "users.read.own"]);
    if (permCheck) {
      // If no general permission, check if accessing own profile
      const user = await db.query.users.findFirst({
        where: eq(users.clerkUserId, userId),
      });

      if (!user || user.id !== id) {
        return permCheck;
      }
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: targetUser });
  } catch (error) {
    logger.error("User fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    // Check RBAC permission for deleting users
    const permCheck = await requirePermission(userId, "users.delete");
    if (permCheck) return permCheck;

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("User delete error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update user (admin/school-admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user: currentUser } = authResult;

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

    return NextResponse.json({ user: updated });
  } catch (error) {
    logger.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
