/**
 * USERS API
 *
 * GET /api/users - Get users with filtering
 * PUT /api/users - Update user
 * POST /api/users - Create user
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 * FIXED: No longer uses disabled db.query API
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, like, or, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/rbac";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, createdResponse, badRequestResponse } from "@/lib/api/response-helpers";
import type { SQL } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

type UserRole = "student" | "teacher" | "parent" | "admin" | "counselor";
type WhereCondition = SQL | undefined;

// ============================================================================
// GET /api/users - Get users with filters
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user: currentUser } = auth;

    // Check RBAC permission for reading users
    const permCheck = await requirePermission(userId, "users.read");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where conditions using db.select() instead of db.query()
    const conditions: WhereCondition[] = [];

    if (role) {
      const validRoles: UserRole[] = ["student", "teacher", "parent", "admin", "counselor"];
      if (validRoles.includes(role as UserRole)) {
        conditions.push(eq(users.type, role as UserRole));
      }
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

    // For teachers, only show students from their school
    if (currentUser.type === "teacher" && currentUser.schoolId) {
      conditions.push(eq(users.schoolId, currentUser.schoolId));
    }

    const whereClause = conditions.length > 0
      ? conditions.length === 1 ? conditions[0] : and(...conditions)
      : undefined;

    const userList = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(limit)
      .orderBy(desc(users.createdAt));

    return successResponse({ users: userList });
  },
  ["admin", "school-admin", "counselor", "teacher"]
);

// ============================================================================
// PUT /api/users - Update user
// ============================================================================

export const PUT = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    // Check RBAC permission for updating users
    const permCheck = await requirePermission(userId, "users.update");
    if (permCheck) return permCheck;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return badRequestResponse("User ID required");
    }

    const result = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    const updatedUser = Array.isArray(result) ? result[0] : result;
    return successResponse({ user: updatedUser });
  },
  ["admin", "school-admin"]
);

// ============================================================================
// POST /api/users - Create user
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

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

    return createdResponse({ user: newUser });
  },
  ["admin", "school-admin"]
);
