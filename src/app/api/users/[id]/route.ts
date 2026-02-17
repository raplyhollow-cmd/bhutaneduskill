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
