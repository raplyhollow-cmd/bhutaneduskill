/**
 * SYNC ADMIN CLERK ID
 *
 * Fetches Clerk user ID via API and updates it in the database.
 * Usage: npx tsx scripts/sync-admin-clerk-id.ts <email>
 *
 * Example: npx tsx scripts/sync-admin-clerk-id.ts raplyhollow@gmail.com
 */

import { config } from "dotenv";
import { resolve } from "path";
// Load .env from project root
config({ path: resolve(__dirname, "../.env") });

import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.argv[2] || "raplyhollow@gmail.com";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function syncClerkId() {
  console.log(`🔍 Looking for user: ${ADMIN_EMAIL}`);

  if (!CLERK_SECRET_KEY) {
    console.error("❌ CLERK_SECRET_KEY not found in environment");
    process.exit(1);
  }

  // 1. Find user in database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (!user) {
    console.error(`❌ User not found in database: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  console.log(`✅ Found user in database:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Type: ${user.type}`);
  console.log(`   ClerkUserId (current): ${user.clerkUserId || "not set"}`);

  // 2. Fetch Clerk user ID via API
  console.log(`\n🔍 Fetching Clerk user ID...`);

  try {
    // List users to find by email
    const listResponse = await fetch("https://api.clerk.com/v1/users", {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error(`❌ Clerk API error: ${listResponse.status} ${error}`);
      process.exit(1);
    }

    const clerkData = await listResponse.json();
    const clerkUser = clerkData.find((u: any) => u.email_addresses?.some((e: any) => e.email_address === ADMIN_EMAIL));

    if (!clerkUser) {
      console.error(`❌ User not found in Clerk: ${ADMIN_EMAIL}`);
      console.log(`   Found ${clerkData.total_count} users in Clerk`);
      process.exit(1);
    }

    const clerkUserId = clerkUser.id;
    console.log(`✅ Found Clerk user: ${clerkUserId}`);

    // 3. Update database with Clerk user ID
    console.log(`\n💾 Updating database...`);

    const [updated] = await db
      .update(users)
      .set({ clerkUserId, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    console.log(`✅ Updated successfully!`);
    console.log(`   ID: ${updated.id}`);
    console.log(`   ClerkUserId: ${updated.clerkUserId}`);

  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

syncClerkId()
  .then(() => {
    console.log("\n✨ Sync complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
