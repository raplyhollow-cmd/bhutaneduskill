/**
 * SYNC ALL USERS FROM CLERK
 *
 * Fetches all users from Clerk and syncs them to the database.
 * Creates new users if they don't exist, updates clerkUserId if they do.
 *
 * Usage: npx tsx scripts/sync-all-users-clerk.ts
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
const { eq, sql } = require("drizzle-orm");
const { nanoid } = require("nanoid");

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

async function syncAllUsers() {
  console.log("\n🔄 Starting Clerk to Database sync...\n");

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
      // No pagination if array returned directly
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

  // 2. Sync each user to database
  console.log("\n💾 Syncing users to database...");

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const clerkUser of allClerkUsers) {
    try {
      // Get primary email
      const primaryEmail = clerkUser.email_addresses.find(
        (e: any) => e.verification.status === "verified" || e.verification.status === "valid"
      ) || clerkUser.email_addresses[0];

      if (!primaryEmail) {
        console.log(`   ⚠️  Skipping user ${clerkUser.id} - no email address`);
        skipped++;
        continue;
      }

      const email = primaryEmail.email_address;

      // Check if user exists by email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const userType = clerkUser.public_metadata?.type || clerkUser.unsafe_metadata?.type;
      const schoolId = clerkUser.public_metadata?.schoolId || clerkUser.unsafe_metadata?.schoolId;
      const onboardingStatus = clerkUser.public_metadata?.onboardingStatus || clerkUser.unsafe_metadata?.onboardingStatus;

      if (existingUser) {
        // Update existing user with Clerk ID
        if (existingUser.clerkUserId !== clerkUser.id) {
          await db
            .update(users)
            .set({
              clerkUserId: clerkUser.id,
              ...(userType && existingUser.type !== userType ? { type: userType } : {}),
              ...(schoolId && existingUser.schoolId !== schoolId ? { schoolId } : {}),
              ...(onboardingStatus ? { onboardingStatus } : {}),
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));

          console.log(`   ✅ Updated: ${email} (ID: ${existingUser.id}, Type: ${userType || "unchanged"})`);
          updated++;
        } else {
          console.log(`   ⊙ Already in sync: ${email}`);
          skipped++;
        }
      } else {
        // Create new user
        const newUserId = `user-${nanoid()}`;
        const name = [clerkUser.first_name, clerkUser.last_name]
          .filter(Boolean)
          .join(" ") || email.split("@")[0];

        await db.insert(users).values({
          id: newUserId,
          clerkUserId: clerkUser.id,
          email,
          name,
          type: userType || "student",
          schoolId,
          onboardingStatus: onboardingStatus || "restricted",
          isActive: true,
          createdAt: new Date(clerkUser.created_at),
          updatedAt: new Date(clerkUser.updated_at),
        });

        console.log(`   ➕ Created: ${email} (${userType || "student"})`);
        created++;
      }
    } catch (error) {
      console.error(`   ❌ Error syncing user ${clerkUser.id}:`, error instanceof Error ? error.message : error);
      errors++;
    }
  }

  // 3. Summary
  console.log("\n📊 Sync Summary:");
  console.log(`   ✅ Created: ${created}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⊙ Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📋 Total processed: ${allClerkUsers.length}`);

  // 4. Verify database count
  const [{ count: dbCount }] = await db
    .select({ count: sql`count(*)::int` })
    .from(users);

  console.log(`\n📊 Total users in database: ${dbCount}`);
}

syncAllUsers()
  .then(() => {
    console.log("\n✨ Sync complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
