/**
 * FIX ADMIN ONBOARDING STATUS
 *
 * Updates the admin user's onboarding status to bypass setup wizard.
 * Usage: npx tsx scripts/fix-admin-onboarding.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Preload .env before any other imports
config({
  path: resolve(__dirname, "../.env"),
  override: true
});

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

// Now use require for dynamic imports after env is loaded
const { db } = require("../src/lib/db");
const { users } = require("../src/lib/db/schema");
const { eq } = require("drizzle-orm");

const ADMIN_EMAIL = "raplyhollow@gmail.com";

async function fixAdminOnboarding() {
  console.log("\n🔧 FIXING ADMIN ONBOARDING STATUS...\n");

  // Find admin user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (!user) {
    console.error(`❌ User not found: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  console.log("✅ Found user:");
  console.log("   ID:", user.id);
  console.log("   Email:", user.email);
  console.log("   Type:", user.type);
  console.log("   OnboardingStatus:", user.onboardingStatus);
  console.log("   OnboardingComplete:", user.onboardingComplete);

  // Update admin user to have complete onboarding
  await db
    .update(users)
    .set({
      onboardingStatus: null, // No status needed for platform admin
      onboardingComplete: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  console.log("\n✅ Updated successfully!");
  console.log("   onboardingStatus: null");
  console.log("   onboardingComplete: true");

  // Verify the update
  const [updated] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  console.log("\n📋 Final state:");
  console.log("   OnboardingStatus:", updated.onboardingStatus);
  console.log("   OnboardingComplete:", updated.onboardingComplete);
}

fixAdminOnboarding()
  .then(() => {
    console.log("\n✨ Fix complete!");
    console.log("\n💡 Refresh your browser to access the admin dashboard.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
