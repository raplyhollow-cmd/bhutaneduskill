/**
 * Platform Admin Sync Script
 *
 * This script checks if a platform admin exists in the database
 * and creates one if needed.
 *
 * Usage: npx tsx scripts/fix-platform-admin.ts <email>
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const PLATFORM_ADMIN_EMAIL = process.argv[2] || "raplyhollow@gmail.com";

async function syncPlatformAdmin() {
  console.log("═════════════════════════════════════════════════════════");
  console.log("  Platform Admin Sync Script");
  console.log("═════════════════════════════════════════════════════════");
  console.log(`  Email: ${PLATFORM_ADMIN_EMAIL}`);
  console.log("═════════════════════════════════════════════════════════\n");

  // Check if user exists
  const existing = await sql`
    SELECT id, email, type, clerk_user_id, onboarding_status, onboarding_complete
    FROM users
    WHERE email = ${PLATFORM_ADMIN_EMAIL}
    LIMIT 1
  `;

  if (existing.length > 0) {
    console.log("✓ Platform admin found in database:");
    console.log(`  ID: ${existing[0].id}`);
    console.log(`  Email: ${existing[0].email}`);
    console.log(`  Type: ${existing[0].type}`);
    console.log(`  Status: ${existing[0].onboarding_status}`);
    console.log(`  Complete: ${existing[0].onboarding_complete}`);

    // If status is not approved, update it
    if (existing[0].onboarding_status !== "approved") {
      console.log("\n⚠️  User exists but status is not 'approved'. Updating...");
      await sql`
        UPDATE users
        SET onboarding_status = 'approved',
            onboarding_complete = true,
            updated_at = NOW()
        WHERE email = ${PLATFORM_ADMIN_EMAIL}
      `;
      console.log("✓ User status updated to 'approved'");
    }
    return;
  }

  // User doesn't exist - we need to create them
  console.log("\n⚠️  Platform admin NOT found in database.");
  console.log("\nTo create a platform admin account:");
  console.log("  1. Get your Clerk User ID from the Clerk Dashboard");
  console.log("  2. Run: npx tsx scripts/create-platform-admin.ts <clerk_user_id>");
  console.log("\nAlternatively, log out and log in again through the setup flow.");
  console.log("\nYour Clerk User ID is needed to create the database record.");
  console.log("\n═════════════════════════════════════════════════════════\n");
}

syncPlatformAdmin().catch(console.error);
