/**
 * ONE-TIME ADMIN SETUP
 *
 * Call this endpoint to manually create your admin database record.
 * This bypasses the need for Clerk metadata.
 *
 * GET /api/admin/setup-admin
 *
 * After calling this, refresh the page and everything should work.
 *
 * MIGRATED to Pattern B (createApiRoute) for consistent auth handling.
 */

import { NextRequest } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId: dbUserId } = auth;

    // If user already exists in DB, return early
    if (dbUserId) {
      return {
        message: "Admin record already exists",
        type: user.type,
        email: user.email,
      };
    }

    // Get user from Clerk using clerkUserId
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerkClient.users.getUser(user.clerkUserId);

    // Create admin record
    const now = new Date().toISOString();
    const newUserId = `user-${nanoid()}`;

    await db.insert(users).values({
      id: newUserId,
      clerkUserId: user.clerkUserId,
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
      onboardingStatus: null, // Use null for completed (unified pattern)
    });

    logger.info("Admin record created via setup-admin endpoint", {
      userId: newUserId,
      clerkUserId: user.clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    return {
      success: true,
      message: "Admin record created successfully! Refresh the page to continue.",
      email: clerkUser.emailAddresses[0]?.emailAddress,
    };
  },
  [] // No auth required - this creates the first admin
);
