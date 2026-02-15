import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission, requireAnyPermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, like, or, desc } from "drizzle-orm";

// GET /api/users - Get users (with filters for role, school, etc.)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin", "counselor", "teacher"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user: currentUser } = authResult;

    // Check RBAC permission for reading users
    const permCheck = await requirePermission(userId, "users.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = db.query.users;

    // Build where conditions based on filters
    const conditions = [];
    if (role) {
      // Type guard to ensure role is valid
      const validRoles = ["student", "teacher", "parent", "admin", "counselor"] as const;
      if (validRoles.includes(role as any)) {
        conditions.push(eq(users.type, role as any));
      }
    }
    if (schoolId && (currentUser as any).type !== "teacher") {
      conditions.push(eq(users.schoolId, schoolId));
    }
    if (search) {
      conditions.push(
        or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    // For teachers, only show students from their classes
    if (currentUser.type === "teacher" && currentUser.schoolId) {
      conditions.push(eq(users.schoolId, currentUser.schoolId));
    }

    let userList: any[];
    if (conditions.length > 0) {
      userList = await query.findMany({
        where: conditions.length === 1 ? conditions[0] : and(...conditions),
        limit,
        orderBy: desc(users.createdAt),
      });
    } else {
      userList = await query.findMany({
        limit,
        orderBy: desc(users.createdAt),
      });
    }

    return NextResponse.json({ users: userList });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    // Check RBAC permission for updating users
    const permCheck = await requirePermission(userId, "users.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const result = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    const updatedUser = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    // Check RBAC permission for creating users
    const permCheck = await requirePermission(userId, "users.create");
    if (permCheck) return permCheck;

    const body = await request.json();

    const result = await db
      .insert(users)
      .values({
        id: `user_${Date.now()}`,
        ...body,
        createdAt: new Date(),
      })
      .returning();

    const newUser = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
