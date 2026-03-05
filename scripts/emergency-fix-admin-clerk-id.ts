/**
 * EMERGENCY FIX - ADMIN CLERK USER ID
 *
 * Direct database update to fix the persistent clerkUserId sync issue.
 * This bypasses all abstraction layers to ensure the update persists.
 *
 * Usage: npx tsx scripts/emergency-fix-admin-clerk-id.ts
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Preload .env before any other imports
dotenv.config({
  path: resolve(__dirname, "../.env"),
  override: true
});

const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const ADMIN_EMAIL = "raplyhollow@gmail.com";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found in environment");
  process.exit(1);
}

// Direct database connection (no middleware)
const neonClient = neon(DATABASE_URL, {
  fetchOptions: {
    cache: "no-store",
  },
});
const db = drizzle(neonClient, { schema: require("../src/lib/db/schema") });
const { users } = require("../src/lib/db/schema");
const { eq } = require("drizzle-orm");

async function emergencyFix() {
  console.log("\n🚨 EMERGENCY FIX - ADMIN CLERK USER ID\n");
  console.log("=====================================\n");

  // Step 1: Get the correct Clerk user ID from Clerk API
  console.log("📡 Step 1: Fetching correct Clerk ID from Clerk API...");

  const clerkResponse = await fetch("https://api.clerk.com/v1/users", {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
    },
  });

  if (!clerkResponse.ok) {
    const error = await clerkResponse.text();
    console.error(`❌ Clerk API error: ${clerkResponse.status} ${error}`);
    process.exit(1);
  }

  const clerkData = await clerkResponse.json();
  const clerkUsers = Array.isArray(clerkData) ? clerkData : (clerkData.data || []);

  const clerkUser = clerkUsers.find((u: any) =>
    u.email_addresses?.some((e: any) => e.email_address === ADMIN_EMAIL)
  );

  if (!clerkUser) {
    console.error(`❌ User not found in Clerk: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  const correctClerkId = clerkUser.id;
  console.log(`✅ Clerk ID: ${correctClerkId}`);

  // Step 2: Check current database state
  console.log("\n📊 Step 2: Checking current database state...");

  const [userBefore] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (!userBefore) {
    console.error(`❌ User not found in database: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  console.log("   Current state:");
  console.log(`     DB id: ${userBefore.id}`);
  console.log(`     DB clerkUserId: ${userBefore.clerkUserId}`);
  console.log(`     Correct Clerk ID: ${correctClerkId}`);
  console.log(`     Match: ${userBefore.clerkUserId === correctClerkId ? "YES ✅" : "NO ❌"}`);

  // Step 3: DIRECT UPDATE to database
  if (userBefore.clerkUserId !== correctClerkId) {
    console.log("\n🔧 Step 3: Performing DIRECT database update...");

    await db
      .update(users)
      .set({
        clerkUserId: correctClerkId,
        updatedAt: new Date(),
      })
      .where(eq(users.email, ADMIN_EMAIL));

    console.log(`✅ Updated clerkUserId to: ${correctClerkId}`);
  } else {
    console.log("\n✅ Database already has correct value!");
  }

  // Step 4: Verify the update persisted
  console.log("\n🔍 Step 4: Verifying update persisted...");

  // Small delay to ensure consistency
  await new Promise(resolve => setTimeout(resolve, 500));

  const [userAfter] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  console.log("   Final state:");
  console.log(`     DB clerkUserId: ${userAfter.clerkUserId}`);
  console.log(`     Expected: ${correctClerkId}`);
  console.log(`     Match: ${userAfter.clerkUserId === correctClerkId ? "YES ✅" : "NO ❌"}`);

  // Step 5: Also set onboardingStatus to null to prevent setup redirect
  console.log("\n🔧 Step 5: Setting onboardingStatus to null...");

  await db
    .update(users)
    .set({
      onboardingStatus: null,
      onboardingComplete: true,
    })
    .where(eq(users.email, ADMIN_EMAIL));

  console.log("✅ onboardingStatus set to null");

  // Step 6: Final verification
  const [finalUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  console.log("\n📋 FINAL STATE:");
  console.log(`   clerkUserId: ${finalUser.clerkUserId}`);
  console.log(`   onboardingStatus: ${finalUser.onboardingStatus}`);
  console.log(`   onboardingComplete: ${finalUser.onboardingComplete}`);
  console.log(`   type: ${finalUser.type}`);

  // Check for potential issues
  console.log("\n🔍 DIAGNOSTICS:");

  // Check if clerkUserId equals database id (this would be wrong)
  if (finalUser.id === finalUser.clerkUserId) {
    console.error("   ⚠️  WARNING: clerkUserId equals database id!");
    console.error("       This indicates a bug where DB id was copied to clerkUserId field");
  } else {
    console.log("   ✅ clerkUserId is different from database id (correct)");
  }

  // Check if clerkUserId follows Clerk's pattern
  if (finalUser.clerkUserId.startsWith("user_")) {
    console.log("   ✅ clerkUserId follows Clerk pattern (user_xxx)");
  } else {
    console.error("   ⚠️  WARNING: clerkUserId doesn't follow Clerk pattern!");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✨ EMERGENCY FIX COMPLETE!");
  console.log("=".repeat(50));
  console.log("\n💡 Next steps:");
  console.log("   1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)");
  console.log("   2. Navigate to http://localhost:3002/admin");
  console.log("   3. Should work now!");
}

emergencyFix()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
