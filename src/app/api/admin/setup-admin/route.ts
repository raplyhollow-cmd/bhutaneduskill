import { NextRequest, NextResponse } from "next/server";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

/**
 * ONE-TIME ADMIN SETUP
 *
 * Call this endpoint to manually create your admin database record.
 * This bypasses the need for Clerk metadata.
 *
 * GET /api/admin/setup-admin
 *
 * After calling this, refresh the page and everything should work.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        message: "Admin record already exists",
        type: existing[0].type,
        email: existing[0].email,
      });
    }

    // Get user from Clerk
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerkClient.users.getUser(userId);

    // Create admin record
    const now = new Date().toISOString();
    const newUserId = `user-${nanoid()}`;

    await db.insert(users).values({
      id: newUserId,
      clerkUserId: userId,
      type: 'admin',
      role: 'admin',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      phone: '',
      country: 'Bhutan',
      grade: 0,
      enrollmentDate: now.split('T')[0],
      isActive: true,
      emailVerified: false,
      onboardingComplete: true,
      onboardingStatus: 'complete',
    });

    logger.info("Admin record created via setup-admin endpoint", {
      userId: newUserId,
      clerkUserId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Admin record created successfully! Refresh the page to continue.",
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

  } catch (error) {
    logger.error(error, { route: "/api/admin/setup-admin" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create admin record" },
      { status: 500 }
    );
  }
}
