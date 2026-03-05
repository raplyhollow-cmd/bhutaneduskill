/**
 * SYNC CLERK IDS API
 *
 * Fixes clerkUserId mismatches by syncing from Clerk to database.
 * GET /api/debug/sync-clerk-ids
 *
 * This will:
 * 1. Fetch all users from Clerk
 * 2. Match to database by email
 * 3. Update clerkUserId
 */

import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { invalidateAllRoleCache } from "@/lib/auth-utils";

export async function GET() {
  console.log("[SYNC-CLERK-IDS] Route called");
  try {
    // Get all users from Clerk
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    console.log("[SYNC-CLERK-IDS] Clerk client created");
    const clerkUsers = await clerkClient.users.getUserList();
    console.log("[SYNC-CLERK-IDS] Got users from Clerk:", clerkUsers.data?.length);

    let updated = 0;
    let notFound = 0;
    let skipped = 0;
    const details: string[] = [];

    for (const clerkUser of clerkUsers.data) {
      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      if (!email) {
        skipped++;
        continue;
      }

      // Find user in database by email
      const dbUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (dbUsers.length === 0) {
        notFound++;
        continue;
      }

      const dbUser = dbUsers[0];

      // Check if needs update (either clerkUserId mismatch or wrong onboardingStatus)
      const needsClerkIdUpdate = dbUser.clerkUserId !== clerkUser.id;
      const needsStatusFix = dbUser.onboardingStatus === "complete" || !dbUser.onboardingStatus;

      if (!needsClerkIdUpdate && !needsStatusFix) {
        skipped++;
        continue;
      }

      // Update clerkUserId and fix onboardingStatus
      await db
        .update(users)
        .set({
          clerkUserId: clerkUser.id,
          onboardingStatus: "completed",
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));

      const changes = [];
      if (needsClerkIdUpdate) changes.push(`clerkUserId: ${dbUser.clerkUserId || 'null'} → ${clerkUser.id}`);
      if (needsStatusFix) changes.push(`onboardingStatus: ${dbUser.onboardingStatus || 'null'} → completed`);

      details.push(`Updated ${email} (${dbUser.type}): ${changes.join(', ')}`);
      updated++;

      // Invalidate role cache for this user
      if (needsClerkIdUpdate) {
        invalidateAllRoleCache();
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: clerkUsers.data.length,
        updated,
        skipped,
        notFound,
      },
      details,
      message: `Synced ${updated} user(s). You can now login!`
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({
      error: error.message || "Failed to sync Clerk IDs",
      details: error.stack
    }, { status: 500 });
  }
}
