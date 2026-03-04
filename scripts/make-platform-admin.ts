/**
 * MAKE PLATFORM ADMIN
 *
 * Quick script to make a user a platform admin.
 * Run with: npx tsx scripts/make-platform-admin.ts <email>
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.error("Usage: npx tsx scripts/make-platform-admin.ts <email>");
  process.exit(1);
}

async function makePlatformAdmin(email: string) {
  console.log(`Making ${email} a platform admin...`);

  // Check if user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length === 0) {
    console.error(`User with email ${email} not found in database!`);
    console.log("\nNOTE: This script updates an EXISTING user record.");
    console.log("If the user doesn't exist in the database yet, they need to:");
    console.log("1. Sign in with Clerk first");
    console.log("2. Then run this script");
    process.exit(1);
  }

  const user = existing[0];
  console.log(`Found user: ${user.id} (${user.name || 'No name'})`);
  console.log(`Current type: ${user.type}, onboardingStatus: ${user.onboardingStatus}`);

  // Update to platform admin
  await db
    .update(users)
    .set({
      type: "admin",
      onboardingStatus: "completed",
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(users.email, email));

  console.log(`\n✅ Successfully made ${email} a platform admin!`);
  console.log("\nThe user can now access /admin");
}

makePlatformAdmin(EMAIL)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
