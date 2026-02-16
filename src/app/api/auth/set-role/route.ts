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
      console.log("[Set Role] User not found in database, needs setup");
      return NextResponse.json({ userType: null, needsSetup: true });
    }

    console.log("[Set Role] User found:", {
      id: user.id,
      type: user.type,
      onboardingComplete: user.onboardingComplete,
    });

    // If user has a type, let them in (they were either created by admin or completed setup)
    // The onboardingComplete field caused timing issues, so we rely on type presence instead
    if (user.type) {
      console.log("[Set Role] User has type, allowing access:", user.type);
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
    console.log("[Set Role] User has no type, needs setup");
    return NextResponse.json({
      userType: null,
      needsSetup: true
    });
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
