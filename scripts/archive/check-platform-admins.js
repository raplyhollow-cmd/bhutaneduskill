import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Get all platform admin users
  const admins = await sql`
    SELECT u.id, u.clerk_user_id, u.email, u.type, u.role, u.onboarding_complete
    FROM users u
    WHERE u.type = 'admin' OR u.role = 'admin'
  `;

  console.log("Platform Admin Users:");
  console.log("====================");
  for (const admin of admins) {
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Clerk ID: ${admin.clerk_user_id}`);
    console.log(`Type: ${admin.type}, Role: ${admin.role}`);
    console.log(`Onboarding Complete: ${admin.onboarding_complete}`);
    console.log("---");
  }

  // Check RBAC roles
  const rbacAdmins = await sql`
    SELECT u.id, u.email, r.slug as role_slug
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.slug = 'platform-admin'
  `;

  console.log("\nUsers with platform-admin RBAC role:");
  console.log("=====================================");
  for (const admin of rbacAdmins) {
    console.log(`ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role_slug}`);
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
