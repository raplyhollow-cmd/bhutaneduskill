/**
 * FIX CLERK IDs - Force update all users with correct Clerk IDs
 *
 * Fetches all users from Clerk and updates their clerkUserId in the database.
 * This is a FORCE UPDATE - it will overwrite any existing clerkUserId values.
 *
 * Usage: npx tsx scripts/fix-clerk-ids.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import * as dotenv from "dotenv";

// Preload .env before any other imports
config({
  path: resolve(__dirname, "../.env"),
  override: true
});

const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found in environment");
  process.exit(1);
}

// Now use require for dynamic imports after env is loaded
const { db } = require("../src/lib/db");
const { users } = require("../src/lib/db/schema");
const { eq, sql, or } = require("drizzle-orm");

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    verification: { status: string };
  }>;
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
  public_metadata: {
    type?: string;
    schoolId?: string;
    onboardingStatus?: string;
    [key: string]: any;
  };
  unsafe_metadata: Record<string, any>;
}

async function fixClerkIds() {
  console.log("\n🔧 FIXING CLERK IDs IN DATABASE...\n");

  // 1. Fetch all users from Clerk
  console.log("📥 Fetching all users from Clerk...");

  let allClerkUsers: ClerkUser[] = [];
  let nextPage = "https://api.clerk.com/v1/users?limit=100";

  while (nextPage) {
    const response = await fetch(nextPage, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Clerk API error: ${response.status} ${error}`);
      process.exit(1);
    }

    const data = await response.json();

    // Handle both array and paginated response formats
    if (Array.isArray(data)) {
      allClerkUsers = [...allClerkUsers, ...data];
      console.log(`   Fetched ${data.length} users (total: ${allClerkUsers.length})`);
      nextPage = null;
    } else if (data.data && Array.isArray(data.data)) {
      allClerkUsers = [...allClerkUsers, ...data.data];
      console.log(`   Fetched ${data.data.length} users (total: ${allClerkUsers.length})`);

      nextPage = null;
      if (data.total_count && data.total_count - allClerkUsers.length > 0) {
        const url = new URL(nextPage);
        const offset = parseInt(url.searchParams.get("offset") || "0") + 100;
        nextPage = `https://api.clerk.com/v1/users?limit=100&offset=${offset}`;
      }
    } else {
      console.log(`   ⚠️  Unexpected response format:`, typeof data);
      nextPage = null;
    }
  }

  console.log(`\n✅ Total users in Clerk: ${allClerkUsers.length}`);

  // 2. Update each user in database with correct Clerk ID
  console.log("\n💾 Updating clerkUserIds in database...");

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const clerkUser of allClerkUsers) {
    try {
      // Get primary email
      const primaryEmail = clerkUser.email_addresses.find(
        (e: any) => e.verification.status === "verified" || e.verification.status === "valid"
      ) || clerkUser.email_addresses[0];

      if (!primaryEmail) {
        console.log(`   ⚠️  Skipping user ${clerkUser.id} - no email address`);
        notFound++;
        continue;
      }

      const email = primaryEmail.email_address;

      // Find user by email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!existingUser) {
        console.log(`   ⚠️  User not in database: ${email}`);
        notFound++;
        continue;
      }

      // Check if clerkUserId needs updating
      if (existingUser.clerkUserId === clerkUser.id) {
        console.log(`   ⊙ Already correct: ${email} (${clerkUser.id})`);
        continue;
      }

      // OLD clerkUserId -> NEW clerkUserId
      const oldClerkId = existingUser.clerkUserId || "NOT SET";

      // FORCE UPDATE with correct Clerk ID
      await db
        .update(users)
        .set({
          clerkUserId: clerkUser.id,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      console.log(`   ✅ Updated: ${email}`);
      console.log(`      OLD: ${oldClerkId}`);
      console.log(`      NEW: ${clerkUser.id}`);
      updated++;

    } catch (error) {
      console.error(`   ❌ Error updating user ${clerkUser.id}:`, error instanceof Error ? error.message : error);
      errors++;
    }
  }

  // 3. Summary
  console.log("\n📊 Update Summary:");
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⊙ Already correct: ${allClerkUsers.length - updated - notFound - errors}`);
  console.log(`   ⚠️  Not found in DB: ${notFound}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📋 Total processed: ${allClerkUsers.length}`);

  // 4. Verify final state
  console.log("\n📋 Final Database State:");
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      type: users.type,
      clerkUserId: users.clerkUserId,
    })
    .from(users)
    .orderBy(sql`LOWER(${users.email})`);

  for (const u of allUsers) {
    const clerkUser = allClerkUsers.find((cu: any) =>
      cu.email_addresses?.some((e: any) => e.email_address === u.email)
    );
    const isCorrect = clerkUser && u.clerkUserId === clerkUser.id;
    const status = isCorrect ? "✅" : "❌";

    console.log(`   ${status} ${u.email} (${u.type})`);
    console.log(`      clerkUserId: ${u.clerkUserId || "NOT SET"}`);
    if (clerkUser) {
      console.log(`      Expected: ${clerkUser.id}`);
    }
  }
}

fixClerkIds()
  .then(() => {
    console.log("\n✨ Fix complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
