import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function testSchoolCreateFlow() {
  const email = 'raplyhollow@gmail.com';

  console.log("=== SCHOOL CREATION FLOW TEST ===\n");

  // 1. Get user
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
  const userType = user[0].type;

  console.log("1. User Info:");
  console.log("   Database User ID:", userId);
  console.log("   Clerk User ID:", clerkUserId);
  console.log("   User Type:", userType);
  console.log("");

  // 2. Check user_roles
  const userRoles = await sql`
    SELECT * FROM user_roles WHERE user_id = ${userId}
  `;

  console.log("2. User Roles:");
  if (userRoles.length === 0) {
    console.log("   NO ROLES FOUND! This is the problem!");
  } else {
    console.log("   Found", userRoles.length, "role(s):");
    for (const ur of userRoles) {
      console.log("   - Role ID:", ur.role_id);
    }
  }
  console.log("");

  // 3. Check schools.create permission
  const permCheck = await sql`
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
      AND p.slug = 'schools.create'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    LIMIT 1
  `;

  console.log("3. Permission Check (schools.create):");
  if (permCheck.length > 0) {
    console.log("   PERMISSION GRANTED ✅");
  } else {
    console.log("   PERMISSION DENIED ❌");
    console.log("   This means the user does NOT have the schools.create permission");
  }
  console.log("");

  // 4. Check what permissions the user actually has
  const allPerms = await sql`
    SELECT p.slug, p.name
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY p.slug
  `;

  console.log("4. All User Permissions (first 10):");
  for (const p of allPerms.slice(0, 10)) {
    console.log(`   - ${p.slug}`);
  }
  if (allPerms.length > 10) {
    console.log(`   ... and ${allPerms.length - 10} more`);
  }
  console.log("");

  // 5. Check if schools.create permission exists at all
  const schoolCreatePerm = await sql`
    SELECT id, slug, name FROM permissions WHERE slug = 'schools.create'
  `;

  console.log("5. schools.create Permission in DB:");
  if (schoolCreatePerm.length > 0) {
    console.log("   ID:", schoolCreatePerm[0].id);
    console.log("   Slug:", schoolCreatePerm[0].slug);
    console.log("   Name:", schoolCreatePerm[0].name);
  } else {
    console.log("   NOT FOUND! The permission doesn't exist!");
  }
}

testSchoolCreateFlow().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
