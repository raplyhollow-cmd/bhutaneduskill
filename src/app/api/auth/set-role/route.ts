import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, schools, schoolAdminApplications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { applyRateLimit, applyRateLimitAuth, addRateLimitHeaders, checkRateLimitWithConfig, RateLimitPresets } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for auth endpoint
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.auth);
    if (rateLimitResult) return rateLimitResult;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const userRecords = await db
      .select({
        id: users.id,
        type: users.type,
        schoolId: users.schoolId,
        firstName: users.firstName,
        lastName: users.lastName,
        onboardingStatus: users.onboardingStatus,
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
    });

    // Platform admins skip all onboarding checks
    if (user.type === "admin") {
      logger.debug("Platform admin bypassing setup", { userId: user.id });
      const response = NextResponse.json({
        userType: "admin",
        needsSetup: false,
        firstName: user.firstName,
        lastName: user.lastName
      });
      response.cookies.set("userType", "admin", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // School admins: check if their application is approved
    // First check onboardingStatus directly (more efficient)
    // Handle both pending_approval and pending_enrollment statuses
    if (user.type === "school-admin" &&
        (user.onboardingStatus === "pending_approval" || user.onboardingStatus === "pending_enrollment")) {
      logger.debug("School admin awaiting approval", { userId: user.id, onboardingStatus: user.onboardingStatus });
      return NextResponse.json({
        userType: null,
        needsSetup: true,
        awaitingApproval: true,
      });
    }

    // Fallback: check application status table if onboardingStatus not set
    if (user.type === "school-admin" && user.schoolId && !user.onboardingStatus) {
      try {
        const application = await db
          .select()
          .from(schoolAdminApplications)
          .where(eq(schoolAdminApplications.userId, user.id))
          .limit(1);

        if (application.length > 0 && application[0].status === "pending_approval") {
          logger.debug("School admin awaiting approval (from table)", { userId: user.id });
          return NextResponse.json({
            userType: null,
            needsSetup: true,
            awaitingApproval: true,
          });
        }
      } catch {
        // school_admin_applications table doesn't exist - continue
        logger.debug("school_admin_applications table not found, skipping check");
      }
    }

    // If user has a type, let them in
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
    // Apply rate limiting for auth endpoint
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.auth);
    if (rateLimitResult) return rateLimitResult;
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
