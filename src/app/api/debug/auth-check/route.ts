import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * DEBUG ENDPOINT - Shows exactly what's happening with authentication
 * GET /api/debug/auth-check
 *
 * This will show:
 * 1. What Clerk userId the app sees
 * 2. What's in the database for that userId
 * 3. Any mismatches
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Get Clerk userId
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        error: "Not authenticated in Clerk",
        fix: "Sign in first",
      });
    }

    // Step 2: Check what's in database for this userId
    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    // Step 3: Also check for any admin users
    const allAdmins = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        type: users.type,
        email: users.email,
      })
      .from(users)
      .where(eq(users.type, "admin"));

    return NextResponse.json({
      clerkUserId: userId,
      databaseUserFound: dbUsers.length > 0,
      databaseUser: dbUsers[0] || null,
      allAdminUsers: allAdmins,
      recommendation: dbUsers.length === 0
        ? "No user found in database for this Clerk userId. Insert a record with clerk_user_id = '" + userId + "'"
        : "User found! Should work.",
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}