/**
 * Create Ministry User Script
 *
 * This script creates a ministry-level user via Clerk API and sets up
 * the corresponding database record with RBAC permissions.
 *
 * Usage: node scripts/create-ministry-user.js
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Ministry user credentials
const MINISTRY_EMAIL = "ministry@bhutaneduskill.bt";
const MINISTRY_PASSWORD = "Tiger@2026!";
const MINISTRY_FIRST_NAME = "Ministry";
const MINISTRY_LAST_NAME = "Official";

// If you already know the Clerk User ID, set it here (otherwise leave empty string)
const EXISTING_CLERK_USER_ID = "user_39saqXySWN70cpmYejdqzJwR6h2";

console.log("=".repeat(60));
console.log("CREATING MINISTRY USER");
console.log("=".repeat(60));
console.log(`Email: ${MINISTRY_EMAIL}`);
console.log(`Password: ${MINISTRY_PASSWORD}`);
console.log("=".repeat(60));

async function createMinistryUser() {
  try {
    let clerkUserId;

    // If we already know the Clerk User ID, skip creation
    if (EXISTING_CLERK_USER_ID) {
      console.log("\n[1/4] Using existing Clerk User ID...");
      clerkUserId = EXISTING_CLERK_USER_ID;
      console.log(`  ✓ Clerk User ID: ${clerkUserId}`);
    } else {
      // Step 1: Create user via Clerk API
      console.log("\n[1/4] Creating user via Clerk API...");

      const clerkResponse = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: [MINISTRY_EMAIL],
          password: MINISTRY_PASSWORD,
          first_name: MINISTRY_FIRST_NAME,
          last_name: MINISTRY_LAST_NAME,
          public_metadata: {
            type: "ministry",
          },
        }),
      });

      if (!clerkResponse.ok) {
        const error = await clerkResponse.json();
        const errorMsg = error.errors?.[0]?.message || error.message || "";

        // Check if user already exists (multiple error messages possible)
        if (errorMsg.includes("already exists") ||
            errorMsg.includes("taken") ||
            error.errors?.[0]?.code === "form_identifier_exists") {
          console.log("  ⚠ User already exists in Clerk. Fetching existing user...");

          // User exists, need to find them
          const listResponse = await fetch(
            `https://api.clerk.com/v1/users?email_address=${MINISTRY_EMAIL}`,
            {
              headers: {
                "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
              },
            }
          );

          const listData = await listResponse.json();
          clerkUserId = listData.data?.[0]?.id;

          if (!clerkUserId) {
            throw new Error("Could not find existing user in Clerk");
          }
          console.log(`  ✓ Found existing Clerk user: ${clerkUserId}`);
        } else {
          throw new Error(`Clerk API error: ${JSON.stringify(error)}`);
        }
      } else {
        const clerkUser = await clerkResponse.json();
        clerkUserId = clerkUser.id;
        console.log(`  ✓ Created Clerk user: ${clerkUserId}`);
      }
    }

    // Step 2: Confirm Clerk user ID
    console.log("\n[2/4] Clerk User ID confirmed...");
    console.log(`  ✓ Clerk User ID: ${clerkUserId}`);

    // Step 3: Check/create database user
    console.log("\n[3/4] Checking database user...");

    let dbUser = await sql`
      SELECT id, type, role FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;

    let userId;

    if (dbUser.length === 0) {
      console.log("  Creating new database user...");

      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      await sql`
        INSERT INTO users (
          id, clerk_user_id, type, role, name, first_name, last_name,
          email, phone, school_id, profile_image, date_of_birth, gender,
          grade, section, roll_number, address, city, state, postal_code,
          country, parent_contact, parent_phone, emergency_contact,
          blood_group, enrollment_date, last_login, employee_id,
          department, subjects, is_active, onboarding_complete,
          created_at, updated_at
        ) VALUES (
          ${newUserId}, ${clerkUserId}, 'ministry', 'ministry',
          ${MINISTRY_FIRST_NAME + ' ' + MINISTRY_LAST_NAME},
          ${MINISTRY_FIRST_NAME}, ${MINISTRY_LAST_NAME},
          ${MINISTRY_EMAIL}, '', NULL, '', '', 'other',
          0, '', '', '', 'Thimphu', '', '',
          'Bhutan', '', '', '', '',
          ${new Date().toISOString().split('T')[0]}, ${new Date().toISOString()},
          'MIN001', 'Ministry of Education', '', true, true,
          NOW(), NOW()
        )
      `;

      userId = newUserId;
      console.log(`  ✓ Created database user: ${userId}`);
    } else {
      userId = dbUser[0].id;
      console.log(`  ✓ Database user exists: ${userId}`);

      // Update to ministry type if needed
      await sql`
        UPDATE users
        SET type = 'ministry',
            role = 'ministry',
            onboarding_complete = true,
            updated_at = NOW()
        WHERE id = ${userId}
      `;
      console.log(`  ✓ Updated user to ministry type`);
    }

    // Step 4: Check/assign ministry RBAC role
    console.log("\n[4/4] Checking RBAC role...");

    const ministryRole = await sql`
      SELECT id FROM roles WHERE slug = 'ministry' LIMIT 1
    `;

    if (ministryRole.length === 0) {
      console.log("  ⚠ Ministry role not found in RBAC. Creating it...");

      await sql`
        INSERT INTO roles (id, name, slug, description, created_at)
        VALUES (
          'role-' || date_part('epoch', NOW())::bigint,
          'Ministry Official',
          'ministry',
          'Ministry of Education officials with national-level access',
          NOW()
        )
      `;

      const newRole = await sql`SELECT id FROM roles WHERE slug = 'ministry' LIMIT 1`;
      const roleId = newRole[0].id;
      console.log(`  ✓ Created ministry role: ${roleId}`);
    } else {
      console.log(`  ✓ Ministry role exists: ${ministryRole[0].id}`);
    }

    const roleId = ministryRole.length > 0 ? ministryRole[0].id :
      (await sql`SELECT id FROM roles WHERE slug = 'ministry' LIMIT 1`)[0].id;

    // Check if user already has the role
    const existingRole = await sql`
      SELECT id FROM user_roles WHERE user_id = ${userId} AND role_id = ${roleId} LIMIT 1
    `;

    if (existingRole.length === 0) {
      await sql`
        INSERT INTO user_roles (id, user_id, role_id, assigned_by, created_at)
        VALUES (
          'ur-' || date_part('epoch', NOW())::bigint || '-' || md5(random()::text),
          ${userId},
          ${roleId},
          ${userId},
          NOW()
        )
      `;
      console.log(`  ✓ Assigned ministry role to user`);
    } else {
      console.log(`  ✓ User already has ministry role`);
    }

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("MINISTRY USER CREATED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\n📧 Email:    ${MINISTRY_EMAIL}`);
    console.log(`🔑 Password: ${MINISTRY_PASSWORD}`);
    console.log(`🆔 User ID:  ${userId}`);
    console.log(`🆔 Clerk ID: ${clerkUserId}`);
    console.log(`\n🌐 Sign in at: http://localhost:3003/sign-in`);
    console.log(`\nAfter signing in, you'll be redirected to the ministry portal.`);
    console.log("=".repeat(60));

    return { userId, clerkUserId, email: MINISTRY_EMAIL };

  } catch (error) {
    console.error("\n❌ Error creating ministry user:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
createMinistryUser()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Failed:", err);
    process.exit(1);
  });