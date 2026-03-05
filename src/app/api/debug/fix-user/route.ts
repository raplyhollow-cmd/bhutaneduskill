/**
 * DEBUG: FIX USER CLERK ID
 *
 * Link a database user to their Clerk account
 * POST /api/debug/fix-user
 * Body: { email: string }
 *
 * This updates the user's clerkUserId to match the current authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: `User with email ${email} not found in database`,
        hint: "The user must exist in the database first"
      }, { status: 404 });
    }

    const user = existing[0];

    // Check if already linked
    if (user.clerkUserId === userId) {
      return NextResponse.json({
        alreadyLinked: true,
        message: "User already has correct clerkUserId",
        user: {
          id: user.id,
          email: user.email,
          type: user.type,
          onboardingStatus: user.onboardingStatus,
        }
      });
    }

    // Update clerkUserId
    await db
      .update(users)
      .set({
        clerkUserId: userId,
        onboardingStatus: "completed", // Also ensure onboarding is complete
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    return NextResponse.json({
      success: true,
      message: "User linked to Clerk account successfully",
      previousClerkUserId: user.clerkUserId,
      newClerkUserId: userId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        onboardingStatus: "completed",
        redirectTo: getRedirectPath(user.type),
      }
    });

  } catch (error: any) {
    console.error("Fix user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fix user" },
      { status: 500 }
    );
  }
}

function getRedirectPath(type: string): string {
  const paths: Record<string, string> = {
    student: "/student",
    teacher: "/teacher",
    parent: "/parent",
    counselor: "/counselor",
    "school-admin": "/school-admin",
    admin: "/admin",
    ministry: "/ministry",
  };
  return paths[type] || "/dashboard";
}
