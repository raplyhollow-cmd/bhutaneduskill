import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * DEBUG: Check current auth state
 * GET /api/debug/auth-check
 *
 * Returns detailed info about current authentication state
 */
export async function GET(req: NextRequest) {
  try {
    // Get Clerk auth
    const { userId: clerkUserIdFromAuth } = await auth();

    if (!clerkUserIdFromAuth) {
      return NextResponse.json({
        error: "Not authenticated with Clerk",
        clerkUserId: null,
      });
    }

    // Try to find user by clerkUserId
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserIdFromAuth))
      .limit(1);

    // Also search by email in case clerkUserId is wrong
    const clerkUserResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserIdFromAuth}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    let clerkUserEmail = null;
    if (clerkUserResponse.ok) {
      const clerkUser = await clerkUserResponse.json();
      clerkUserEmail = clerkUser.email_addresses?.[0]?.email_address;
    }

    // Try finding by email
    let userByEmail = null;
    if (clerkUserEmail) {
      const emailResult = await db
        .select()
        .from(users)
        .where(eq(users.email, clerkUserEmail))
        .limit(1);
      if (emailResult.length > 0) {
        userByEmail = emailResult[0];
      }
    }

    return NextResponse.json({
      clerkAuth: {
        userId: clerkUserIdFromAuth,
      },
      clerkApi: {
        email: clerkUserEmail,
      },
      database: {
        foundByClerkUserId: userRecords.length > 0,
        user: userRecords[0] || null,
        foundByEmail: userByEmail !== null,
        userByEmail: userByEmail,
      },
      diagnosis: userRecords.length === 0
        ? userByEmail
          ? "❌ clerkUserId mismatch! DB has wrong clerkUserId"
          : "❌ User not found in database at all"
        : "✅ All good",
    });
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint failed",
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
