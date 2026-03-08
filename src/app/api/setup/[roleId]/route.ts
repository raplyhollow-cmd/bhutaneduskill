/**
 * UNIFIED SETUP API
 *
 * Creates user accounts during the unified setup wizard.
 * Uses the unified API pattern internally via the users feature.
 *
 * Routes:
 * - POST /api/setup/student - Create student account
 * - POST /api/setup/teacher - Create teacher account
 * - POST /api/setup/parent - Create parent account
 * - POST /api/setup/school-admin - Create school admin account
 * - POST /api/setup/counselor - Create counselor account
 * - POST /api/setup/admin - Create platform admin account
 * - POST /api/setup/ministry - Create ministry account
 *
 * MIGRATED to Pattern B (createApiRoute) for consistent auth handling.
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ roleId: string }>;
}

// Role to type mapping
const ROLE_TO_TYPE: Record<string, string> = {
  student: "student",
  teacher: "teacher",
  parent: "parent",
  "school-admin": "school-admin",
  counselor: "counselor",
  admin: "admin",
  ministry: "ministry",
};

export const POST = createApiRoute(
  async (request: NextRequest, auth, context: RouteContext) => {
    const { user } = auth;
    const { roleId } = await context.params;
    const body = await request.json();
    const { step, data } = body;

    // Validate role
    const userType = ROLE_TO_TYPE[roleId];
    if (!userType) {
      return { error: "Invalid role", status: 400 };
    }

    // Check if user already exists (by database id)
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const now = new Date();
    const userData: any = {
      type: userType,
      updatedAt: now,
    };

    // Merge step-specific data
    if (data) {
      if (data.schoolCode) userData.schoolCode = data.schoolCode;
      if (data.classId) userData.classId = data.classId;
      if (data.subjectIds) userData.subjectIds = data.subjectIds;
      if (data.name) userData.name = data.name;
      if (data.email) userData.email = data.email;
      if (data.phone) userData.phone = data.phone;
      if (data.position) userData.position = data.position;
    }

    if (existing.length > 0) {
      // Update existing user (query by database id)
      await db
        .update(users)
        .set(userData)
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Profile updated",
        user: { ...existing[0], ...userData },
      };
    }

    // Create new user (shouldn't normally happen with unified flow)
    // Use .returning() and handle both array and single result
    const insertResult = await db
      .insert(users)
      .values({
        id: `${userType}-${Date.now()}`,
        clerkUserId: user.clerkUserId,
        email: data.email || "",
        name: data.name || "",
        type: userType,
        schoolCode: data.schoolCode,
        classId: data.classId,
        subjectIds: data.subjectIds,
        onboardingStatus: null, // Use null for completed (unified pattern)
        onboardingComplete: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Handle both array and single result formats
    const newUser = Array.isArray(insertResult) 
      ? insertResult[0] 
      : insertResult;

    return {
      success: true,
      message: "Account created successfully",
      user: newUser,
    };
  },
  ["student", "teacher", "parent", "counselor", "school-admin", "admin", "ministry"]
);
