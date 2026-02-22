import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function debugSchoolCreate() {
  const email = 'raplyhollow@gmail.com';

  console.log("DEBUGGING SCHOOL CREATION PERMISSION");
  console.log("=" .repeat(60));

  // Get user
  const user = await sql`
    SELECT id, email, type, clerk_user_id
    FROM users
    WHERE email = ${email}
  `;

  if (user.length === 0) {
    console.log("User not found!");
    return;
  }

  const userId = user[0].id;
  const clerkUserId = user[0].clerk_user_id;
  console.log("Database User ID:", userId);
  console.log("Clerk User ID:", clerkUserId);
  console.log("User Type:", user[0].type);
  console.log("---");

  // Check permission the same way RBAC does
  const permissionSlug = 'schools.create';

  console.log(`Checking for permission: ${permissionSlug}`);

  const result = await sql`
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
      AND p.slug = ${permissionSlug}
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    LIMIT 1
  `;

  console.log("Query result:", result);

  if (result.length > 0) {
    console.log("✅ Permission CHECK PASSES - User can create schools");
  } else {
    console.log("❌ Permission CHECK FAILS - User CANNOT create schools");
  }
  console.log("---");

  // Check user_roles directly
  const userRoles = await sql`
    SELECT * FROM user_roles WHERE user_id = ${userId}
  `;
  console.log("User roles records:", userRoles);
  console.log("---");

  // Check role_permissions
  if (userRoles.length > 0) {
    const rolePerms = await sql`
      SELECT rp.*, p.slug, p.name
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ${userRoles[0].role_id}
      ORDER BY p.slug
    `;
    console.log(`Permissions for role ${userRoles[0].role_id}:`);
    for (const rp of rolePerms) {
      console.log(`  - ${rp.slug} (${rp.name})`);
    }
  }
}

debugSchoolCreate().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
