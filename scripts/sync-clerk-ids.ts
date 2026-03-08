/**
 * SYNC CLERK USER IDs
 *
 * Fixes clerkUserId mismatches by syncing from Clerk to database.
 * Run with: npx tsx scripts/sync-clerk-ids.ts
 *
 * This script:
 * 1. Fetches all users from Clerk
 * 2. Matches them to database records by email
 * 3. Updates clerkUserId in database
 */

import { createClerkClient } from "@clerk/backend";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from project root
config({ path: resolve(process.cwd(), ".env") });

const db = require("../src/lib/db").db;
const { users } = require("../src/lib/db/schema");
const { eq } = require("drizzle-orm");

async function syncClerkIds() {
  console.log("🔄 Syncing Clerk User IDs...\n");

  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  try {
    // Get all users from Clerk (paginated)
    let allClerkUsers: any[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await clerkClient.users.getUserList({
        limit,
        offset,
      });
      allClerkUsers.push(...response.data);
      console.log(`📋 Fetched ${response.data.length} users from Clerk (total: ${allClerkUsers.length})`);
      if (response.data.length < limit) break;
      offset += limit;
    }

    console.log(`\n📋 Total users in Clerk: ${allClerkUsers.length}\n`);

    let updated = 0;
    let notFound = 0;
    let skipped = 0;

    for (const clerkUser of allClerkUsers) {
      const email = clerkUser.emailAddresses.find(
        (e: any) => e.id === clerkUser.primaryEmailAddressId
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
        continue;
      }

      const dbUser = dbUsers[0];

      // Check if clerkUserId matches
      if (dbUser.clerkUserId === clerkUser.id) {
        console.log(`✅ Already synced: ${email}`);
        skipped++;
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
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY:");
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Not found in DB: ${notFound}`);
    console.log("=".repeat(50));

    if (updated > 0) {
      console.log("\n✅ Sync complete! You can now login with your accounts.");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

syncClerkIds()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
