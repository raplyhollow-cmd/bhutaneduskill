import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      // User not in database yet - might be first time login
      // Return null and let frontend handle onboarding
      return NextResponse.json({ userType: null, needsSetup: true });
    }

    // Check if user has completed onboarding
    if (!user.onboardingComplete) {
      return NextResponse.json({
        userType: user.type,
        userId: user.id,
        schoolId: user.schoolId,
        needsSetup: true
      });
    }

    // Create response with user type cookie
    const response = NextResponse.json({
      userType: user.type,
      userId: user.id,
      schoolId: user.schoolId,
      needsSetup: false
    });

    // Set cookie for middleware to use
    response.cookies.set("userType", user.type, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error("Error getting user role:", error);
    return NextResponse.json({ error: "Failed to get user role" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userType } = body;

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
    console.error("Error setting user role:", error);
    return NextResponse.json({ error: "Failed to set user role" }, { status: 500 });
  }
}
