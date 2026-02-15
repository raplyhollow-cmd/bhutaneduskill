import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const clerkUserId = "user_39hhwCmfyypYaBYApbcNxapWgXy";

  // Get user
  const user = await sql`
    SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
  `;

  if (!user || user.length === 0) {
    console.log("❌ User not found!");
    return;
  }

  const userId = user[0].id;
  console.log("User ID:", userId);

  // Get platform-admin role
  const role = await sql`
    SELECT id FROM roles WHERE slug = 'platform-admin' LIMIT 1
  `;

  if (!role || role.length === 0) {
    console.log("❌ platform-admin role not found!");
    return;
  }

  const roleId = role[0].id;
  console.log("Role ID:", roleId);

  // Check if user has this role assigned
  const userRole = await sql`
    SELECT * FROM user_roles WHERE user_id = ${userId} AND role_id = ${roleId}
  `;

  console.log("\nUser role assignment:");
  if (userRole && userRole.length > 0) {
    console.log("✓ User HAS platform-admin role");
  } else {
    console.log("❌ User DOES NOT have platform-admin role assigned");
  }

  // Check permissions for platform-admin role
  const permissions = await sql`
    SELECT p.slug, p.name, p.resource, p.action
    FROM role_permissions rp
    JOIN permissions p ON p.permission_id = p.id
    WHERE rp.role_id = ${roleId}
    `;

  console.log("\nPermissions for platform-admin role:");
  if (permissions && permissions.length > 0) {
    for (const perm of permissions) {
      console.log(`  - ${perm.slug}: ${perm.name} (${perm.resource}.${perm.action})`);
    }
  } else {
    console.log("  ❌ NO PERMISSIONS assigned to platform-admin role!");
  }

  // Check if schools.create exists
  const schoolsCreatePerm = await sql`
    SELECT * FROM permissions WHERE slug = 'schools.create' LIMIT 1
  `;

  console.log("\nschools.create permission:");
  if (schoolsCreatePerm && schoolsCreatePerm.length > 0) {
    console.log("✓ schools.create permission exists");
  } else {
    console.log("❌ schools.create permission DOES NOT exist!");
  }

  // Check if platform-admin has schools.create
  const hasSchoolsCreate = await sql`
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON p.permission_id = rp.id
    WHERE rp.role_id = ${roleId}
      AND p.slug = 'schools.create'
    LIMIT 1
  `;

  console.log("\nplatform-admin has schools.create:", hasSchoolsCreate.length > 0 ? "✓ YES" : "❌ NO");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
