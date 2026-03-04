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
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await context.params;
    const body = await request.json();
    const { step, data } = body;

    // Validate role
    const userType = ROLE_TO_TYPE[roleId];
    if (!userType) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
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
      // Update existing user
      await db
        .update(users)
        .set(userData)
        .where(eq(users.clerkUserId, userId));

      return NextResponse.json({
        success: true,
        message: "Profile updated",
        user: { ...existing[0], ...userData },
      });
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        id: `${userType}-${Date.now()}`,
        clerkUserId: userId,
        email: data.email || "",
        name: data.name || "",
        type: userType,
        schoolCode: data.schoolCode,
        classId: data.classId,
        subjectIds: data.subjectIds,
        onboardingStatus: "completed",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: newUser,
    });

  } catch (error: any) {
    console.error("Setup API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process setup" },
      { status: 500 }
    );
  }
}
