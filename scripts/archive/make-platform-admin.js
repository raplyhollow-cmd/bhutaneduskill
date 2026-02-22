import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const clerkUserId = "user_39hhwCmfyypYaBYApbcNxapWgXy";

  // 1. Get the platform-admin role
  const platformAdminRole = await sql`
    SELECT id FROM roles WHERE slug = 'platform-admin' LIMIT 1
  `;

  if (!platformAdminRole || platformAdminRole.length === 0) {
    console.error("Platform admin role not found! Run seed-rbac.ts first.");
    process.exit(1);
  }

  const roleId = platformAdminRole[0].id;

  // 2. Check if user exists
  const user = await sql`
    SELECT id, type, role FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
  `;

  if (!user || user.length === 0) {
    console.error("User not found in database!");
    process.exit(1);
  }

  const userId = user[0].id;

  // 3. Update user to admin
  await sql`
    UPDATE users
    SET type = 'admin',
        role = 'admin',
        onboarding_complete = true,
        updated_at = NOW()
    WHERE id = ${userId}
  `;

  // 4. Check if already has platform-admin role
  const existingRole = await sql`
    SELECT id FROM user_roles WHERE user_id = ${userId} AND role_id = ${roleId} LIMIT 1
  `;

  if (!existingRole || existingRole.length === 0) {
    // Assign platform-admin role
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
  }

  console.log("✓ User is now a Platform Admin!");
  console.log(`  Email: raplyhollow@gmail.com`);
  console.log(`  User ID: ${userId}`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
