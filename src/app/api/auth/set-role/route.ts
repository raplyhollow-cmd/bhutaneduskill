import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const userRecords = await db
      .select({
        id: users.id,
        type: users.type,
        onboardingComplete: users.onboardingComplete,
        schoolId: users.schoolId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      // User not in database yet - needs setup
      logger.debug("User not found in database, needs setup", { clerkUserId: userId });
      return NextResponse.json({ userType: null, needsSetup: true });
    }

    logger.debug("User found in database", {
      userId: user.id,
      type: user.type,
      onboardingComplete: user.onboardingComplete,
    });

    // If user has a type, let them in (they were either created by admin or completed setup)
    // The onboardingComplete field caused timing issues, so we rely on type presence instead
    if (user.type) {
      logger.debug("User has type, allowing access", { type: user.type, userId: user.id });
      const response = NextResponse.json({
        userType: user.type,
        needsSetup: false,
        firstName: user.firstName,
        lastName: user.lastName
      });
      response.cookies.set("userType", user.type, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // If no type, they need setup
    logger.debug("User has no type, needs setup", { userId: user.id });
    return NextResponse.json({
      userType: null,
      needsSetup: true
    });
  } catch (error) {
    logger.error(error, { route: "/api/auth/set-role", method: "GET" });
    return NextResponse.json({ error: "Failed to get user role" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let userType: string | undefined;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    userType = body.userType;

    if (!userType || !["student", "teacher", "parent", "counselor", "admin"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    // Create response
    const response = NextResponse.json({ success: true, userType });

    // Set cookie
    response.cookies.set("userType", userType, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    logger.error(error, { route: "/api/auth/set-role", method: "POST", userType });
    return NextResponse.json({ error: "Failed to set user role" }, { status: 500 });
  }
}
