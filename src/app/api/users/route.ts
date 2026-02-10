import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, like, or, desc } from "drizzle-orm";

// GET /api/users - Get users (with filters for role, school, etc.)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get current user to check permissions
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin, counselor, and teachers can list users
    if (!["admin", "counselor", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = db.query.users;

    // Build where conditions based on filters
    const conditions = [];
    if (role) {
      conditions.push(eq(users.type, role));
    }
    if (schoolId && currentUser.type !== "teacher") {
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check permissions
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin, or user updating themselves
    if (currentUser.type !== "admin" && currentUser.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check admin permissions
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [newUser] = await db
      .insert(users)
      .values({
        id: `user_${Date.now()}`,
        ...body,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
