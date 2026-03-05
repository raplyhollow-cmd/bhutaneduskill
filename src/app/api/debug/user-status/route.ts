/**
 * DEBUG: USER STATUS CHECK
 *
 * Check why a user can't login
 * GET /api/debug/user-status?email=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json({
        error: "Either authentication or email parameter required",
        usage: "GET /api/debug/user-status?email=user@example.com (or just visit while signed in)"
      }, { status: 400 });
    }

    // Check by email first
    let userRecords;

    if (email) {
      userRecords = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(10);
    } else if (userId) {
      userRecords = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(10);
    }

    if (!userRecords || userRecords.length === 0) {
      return NextResponse.json({
        found: false,
        message: "No user found in database",
        query: email ? `email = ${email}` : `clerkUserId = ${userId}`,
        clerkUserId: userId,
        recommendation: "User exists in Clerk but not in database. They need to complete setup at /setup/unified"
      });
    }

    // Check for clerkUserId mismatch
    const hasClerkIdMatch = userRecords.some(u => u.clerkUserId === userId);

    return NextResponse.json({
      found: true,
      count: userRecords.length,
      clerkUserIdFromAuth: userId,
      hasClerkIdMatch,
      users: userRecords.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        type: u.type,
        onboardingStatus: u.onboardingStatus,
        isActive: u.isActive,
        clerkUserId: u.clerkUserId,
        clerkUserIdMatch: u.clerkUserId === userId,
        schoolCode: u.schoolCode,
        classId: u.classId,
        canLogin: u.clerkUserId === userId && u.onboardingStatus === "completed",
        redirectTo: getRedirectPath(u.type),
      }))
    });

  } catch (error: any) {
    console.error("User status check error:", error);
    return NextResponse.json({
      error: error.message || "Failed to check user status",
      details: error.stack
    }, { status: 500 });
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
  return paths[type] || "/setup/unified";
}
