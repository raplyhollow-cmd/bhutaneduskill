/**
 * Fix existing school admin users:
 * 1. Update onboarding_status from 'pending_enrollment' to 'pending_approval'
 * 2. Create application record in school_admin_applications table
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";
import { nanoid } from "nanoid";

config({ path: resolve(process.cwd(), ".env") });

const sql = neon(process.env.DATABASE_URL);

async function fixExistingUsers() {
  console.log("Fixing existing school admin users...\n");

  // Get all school admins with pending_enrollment or no onboarding_status set
  const users = await sql`
    SELECT id, clerk_user_id, type, school_id, onboarding_status, email, name
    FROM users
    WHERE type = 'school-admin'
    AND (onboarding_status = 'pending_enrollment' OR onboarding_status IS NULL OR onboarding_status = 'restricted')
  `;

  console.log(`Found ${users.length} school admin(s) to fix:`);

  for (const user of users) {
    console.log(`\nProcessing: ${user.name} (${user.email})`);
    console.log(`  Current status: ${user.onboarding_status || 'NULL'}`);

    // Update user status to pending_approval
    await sql`
      UPDATE users
      SET onboarding_status = 'pending_approval'
      WHERE id = ${user.id}
    `;
    console.log(`  ✓ Updated onboarding_status to 'pending_approval'`);

    // Check if application already exists
    const existingApps = await sql`
      SELECT id FROM school_admin_applications
      WHERE user_id = ${user.id}
    `;

    if (existingApps.length === 0) {
      // Create application record
      const appId = `sa_app_${nanoid()}`;
      await sql`
        INSERT INTO school_admin_applications (id, user_id, school_id, status, payment_status, applied_at, created_at, updated_at)
        VALUES (${appId}, ${user.id}, ${user.school_id}, 'pending_approval', 'pending', NOW(), NOW(), NOW())
      `;
      console.log(`  ✓ Created application record: ${appId}`);
    } else {
      console.log(`  - Application already exists: ${existingApps[0].id}`);
    }
  }

  console.log("\n✓ Fix complete!\n");

  // Show updated status
  const updatedUsers = await sql`
    SELECT id, name, email, onboarding_status
    FROM users
    WHERE type = 'school-admin'
  `;

  console.log("Updated School Admin Users:");
  console.table(updatedUsers);

  process.exit(0);
}

fixExistingUsers().catch(console.error);
