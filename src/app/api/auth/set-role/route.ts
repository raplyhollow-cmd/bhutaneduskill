import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, schools, schoolAdminApplications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { applyRateLimit, applyRateLimitAuth, addRateLimitHeaders, checkRateLimitWithConfig, RateLimitPresets } from "@/lib/rate-limit";
import { nanoid } from "nanoid";

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

    // ========================================================================
    // CRITICAL FIX: Auto-create database record if not exists
    // This fixes the 403 errors caused by Clerk auth working but no DB record
    // ========================================================================
    if (!user) {
      logger.debug("User not found in database, checking Clerk metadata", { clerkUserId: userId });

      // Get full Clerk user with metadata to determine user type
      let userType: string | undefined;
      let firstName = '';
      let lastName = '';
      let email = '';

      try {
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const clerkUser = await clerkClient.users.getUser(userId);

        // Get userType from Clerk public metadata
        userType = clerkUser.publicMetadata?.userType as string;
        firstName = clerkUser.firstName || '';
        lastName = clerkUser.lastName || '';
        email = clerkUser.emailAddresses[0]?.emailAddress || '';

        logger.debug("Clerk user metadata retrieved", {
          clerkUserId: userId,
          userType,
          firstName,
          lastName,
          email,
        });
      } catch (clerkError) {
        logger.error("Failed to get Clerk user metadata", clerkError);
      }

      // If we have a userType from Clerk metadata, create the database record
      if (userType && ['admin', 'school-admin', 'teacher', 'student', 'parent', 'counselor'].includes(userType)) {
        const now = new Date().toISOString();
        const newUserId = `user-${nanoid()}`;

        await db.insert(users).values({
          id: newUserId,
          clerkUserId: userId,
          type: userType,
          role: userType, // Role matches type initially
          name: `${firstName} ${lastName}`.trim() || 'User',
          firstName,
          lastName,
          email,
          phone: '',
          country: 'Bhutan',
          grade: 0,
          enrollmentDate: now.split('T')[0],
          isActive: true,
          emailVerified: false,
          onboardingComplete: userType === 'admin', // Admins skip onboarding
          onboardingStatus: userType === 'admin' ? 'complete' : 'restricted',
        });

        logger.info("Auto-created database user record from Clerk auth", {
          userId: newUserId,
          clerkUserId: userId,
          userType,
        });

        // Set cookie and return success
        const response = NextResponse.json({
          userType,
          needsSetup: false,
          firstName,
          lastName,
          autoCreated: true,
        });

        response.cookies.set("userType", userType, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }

      // FALLBACK: Try to determine userType from database or create default
      // If user already exists in DB, use their type
      let existingDbUser: Array<{ type: string }> = [];
      try {
        existingDbUser = await db
          .select({ type: users.type })
          .from(users)
          .where(eq(users.clerkUserId, userId))
          .limit(1);
      } catch (e) {
        // DB query failed, continue
      }

      if (existingDbUser.length > 0) {
        // User exists in DB, use their type
        const dbType = existingDbUser[0].type;
        logger.info("Found user in database, using their type", { clerkUserId: userId, type: dbType });

        const response = NextResponse.json({
          userType: dbType,
          needsSetup: false,
        });
        response.cookies.set("userType", dbType, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }

      // Still no type found - check if we should create a default admin
      // For development: if accessing via admin portal, create admin record
      const referer = request.headers.get('referer') || '';
      const isAdminAccess = referer.includes('/admin') || request.url.includes('/admin');

      if (isAdminAccess) {
        logger.info("Admin access without userType, creating default admin record", { clerkUserId: userId });
        const now = new Date().toISOString();
        const newUserId = `user-${nanoid()}`;

        await db.insert(users).values({
          id: newUserId,
          clerkUserId: userId,
          type: 'admin',
          role: 'admin',
          name: `${firstName} ${lastName}`.trim() || 'Admin',
          firstName,
          lastName,
          email,
          phone: '',
          country: 'Bhutan',
          grade: 0,
          enrollmentDate: now.split('T')[0],
          isActive: true,
          emailVerified: false,
          onboardingComplete: true,
          onboardingStatus: 'complete',
        });

        const response = NextResponse.json({
          userType: 'admin',
          needsSetup: false,
          firstName,
          lastName,
          autoCreated: true,
        });
        response.cookies.set("userType", "admin", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }

      // No userType in metadata - user needs to complete setup
      logger.debug("No userType in Clerk metadata, user needs setup", { clerkUserId: userId });
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

    // Check if user is awaiting approval (pending_enrollment or pending_approval)
    // This applies to students, teachers, and school-admins
    const pendingStatuses = ["pending_approval", "pending_enrollment", "pending"];
    if (pendingStatuses.includes(user.onboardingStatus || "")) {
      logger.debug("User awaiting approval", {
        userId: user.id,
        type: user.type,
        onboardingStatus: user.onboardingStatus
      });
      return NextResponse.json({
        userType: null,
        needsSetup: true,
        awaitingApproval: true,
        onboardingStatus: user.onboardingStatus,
      });
    }

    // DEPRECATED: Fallback check for school-admin application status table
    // This is kept for backward compatibility but should not be needed
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
