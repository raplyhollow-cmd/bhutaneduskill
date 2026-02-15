import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json({
        error: "User not found in database",
        clerkUserId: userId,
      }, { status: 404 });
    }

    // Test requireAuth logic
    const allowedRoles = ['admin'];
    const hasRole = allowedRoles.includes(user.type);

    return NextResponse.json({
      clerkUserId: userId,
      user: {
        id: user.id,
        email: user.email,
        type: user.type,
        role: user.role,
      },
      authCheck: {
        allowedRoles,
        userHasRole: hasRole,
        wouldPass: hasRole,
      },
      message: hasRole ? "✓ User would PASS requireAuth(['admin'])" : "❌ User would FAIL requireAuth(['admin'])",
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
