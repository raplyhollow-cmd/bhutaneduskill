// @ts-nocheck
/**
 * SYNC CLERK USER IDs API
 *
 * POST /api/sync-clerk-ids
 *
 * Fixes clerkUserId mismatches by syncing from Clerk to database.
 * This will match your database users to your Clerk account by email.
 *
 * NOTE: This is a DEBUG endpoint - remove or protect in production!
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Syncing Clerk User IDs...\n");

    // Import Clerk dynamically
    const { createClerkClient } = await import("@clerk/backend");
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

    // Get all users from Clerk
    const response = await clerkClient.users.getUserList();
    const clerkUsers = response.data;
    console.log(`📋 Found ${clerkUsers.data.length} users in Clerk\n`);

    let updated = 0;
    let notFound = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const clerkUser of clerkUsers.data) {
      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      if (!email) {
        console.log(`⚠️  Skipping user ${clerkUser.id} - no email`);
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
        console.log(`❌ No DB record for: ${email}`);
        notFound++;
        results.push({ email, status: "not_found_in_db" });
        continue;
      }

      const dbUser = dbUsers[0];

      // Check if clerkUserId matches
      if (dbUser.clerkUserId === clerkUser.id) {
        console.log(`✅ Already synced: ${email}`);
        skipped++;
        results.push({ email, status: "already_synced", clerkUserId: clerkUser.id });
        continue;
      }

      // Update clerkUserId
      await db
        .update(users)
        .set({
          clerkUserId: clerkUser.id,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));

      console.log(`🔄 Updated: ${email} (${dbUser.type})`);
      console.log(`   Old: ${dbUser.clerkUserId || 'null'}`);
      console.log(`   New: ${clerkUser.id}\n`);
      updated++;
      results.push({
        email,
        status: "updated",
        old: dbUser.clerkUserId || null,
        new: clerkUser.id,
        userType: dbUser.type
      });
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY:");
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Not found in DB: ${notFound}`);
    console.log("=".repeat(50));

    return NextResponse.json({
      success: true,
      message: `Sync complete: ${updated} updated, ${skipped} skipped, ${notFound} not found`,
      summary: { updated, skipped, notFound },
      results
    });

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
