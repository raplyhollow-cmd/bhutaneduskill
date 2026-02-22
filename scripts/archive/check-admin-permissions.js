import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function checkPermissions() {
  const email = 'raplyhollow@gmail.com';

  console.log("Checking platform admin permissions for:", email);
  console.log("=" .repeat(50));

  // Get user
  const user = await sql`
    SELECT id, email, type
    FROM users
    WHERE email = ${email}
  `;

  if (user.length === 0) {
    console.log("❌ User not found!");
    return;
  }

  const userId = user[0].id;
  console.log("User ID:", userId);
  console.log("User Type:", user[0].type);
  console.log("---");

  // Check user_roles table
  const userRole = await sql`
    SELECT ur.id, ur.role_id, r.slug as role_slug, r.name as role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${userId}
  `;

  console.log("User Role Assignments (user_roles table):");
  if (userRole.length === 0) {
    console.log("  ❌ No roles found in user_roles table!");
  } else {
    for (const ur of userRole) {
      console.log(`  ✅ ${ur.role_name} (${ur.role_slug}) - ID: ${ur.role_id}`);
    }
  }
  console.log("---");

  // Check if schools.create permission exists
  const schoolsPerm = await sql`
    SELECT id, slug, name
    FROM permissions
    WHERE slug = 'schools.create'
  `;

  console.log("Schools Permission:");
  if (schoolsPerm.length === 0) {
    console.log("  ❌ schools.create permission NOT found!");
  } else {
    console.log(`  ✅ ${schoolsPerm[0].name} (${schoolsPerm[0].slug}) - ID: ${schoolsPerm[0].id}`);
  }
  console.log("---");

  // Check if role has the permission
  if (userRole.length > 0 && schoolsPerm.length > 0) {
    const roleId = userRole[0].role_id;
    const permId = schoolsPerm[0].id;

    const rolePerm = await sql`
      SELECT * FROM role_permissions
      WHERE role_id = ${roleId} AND permission_id = ${permId}
    `;

    console.log("Role Permission Link (role_permissions table):");
    if (rolePerm.length === 0) {
      console.log(`  ❌ Role '${userRole[0].role_slug}' does NOT have 'schools.create' permission!`);
      console.log("  Fix needed: Grant permission to role");
    } else {
      console.log(`  ✅ Role '${userRole[0].role_slug}' HAS 'schools.create' permission!`);
    }
  }
  console.log("---");

  // List all permissions for platform admin
  if (userRole.length > 0) {
    const allPerms = await sql`
      SELECT p.slug, p.name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ${userRole[0].role_id}
      ORDER BY p.name
    `;

    console.log("All Platform Admin Permissions:");
    console.log(`  Total: ${allPerms.length} permissions`);
    console.log("---");
    for (const p of allPerms) {
      console.log(`  ✅ ${p.slug}`);
    }
  }
}

checkPermissions().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
