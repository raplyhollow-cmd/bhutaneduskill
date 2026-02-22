import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const clerkUserId = "user_39hhwCmfyypYaBYApbcNxapWgXy";

  // Get full user details
  const user = await sql`
    SELECT
      id,
      clerk_user_id,
      email,
      type,
      role,
      onboarding_complete
    FROM users
    WHERE clerk_user_id = ${clerkUserId}
    LIMIT 1
  `;

  if (!user || user.length === 0) {
    console.log("❌ User not found!");
    return;
  }

  const u = user[0];
  console.log("User Details:");
  console.log("===============");
  console.log(`ID: ${u.id}`);
  console.log(`Email: ${u.email}`);
  console.log(`Clerk User ID: ${u.clerk_user_id}`);
  console.log(`Type: ${u.type}`);
  console.log(`Role: ${u.role}`);
  console.log(`Onboarding Complete: ${u.onboarding_complete}`);

  // Check RBAC role
  const rbac = await sql`
    SELECT r.slug, r.name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${u.id}
  `;

  console.log("\nRBAC Roles:");
  if (rbac && rbac.length > 0) {
    for (const r of rbac) {
      console.log(`  - ${r.slug} (${r.name})`);
    }
  } else {
    console.log("  ❌ No RBAC roles assigned!");
  }

  // What /api/auth/set-role would return
  console.log("\n/api/auth/set-role would return:");
  console.log(`  userType: "${u.type}"`);
  console.log(`  needsSetup: ${!u.onboarding_complete}`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
