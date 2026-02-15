import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function fixAdminRole() {
  const email = 'raplyhollow@gmail.com';

  console.log("Fixing platform admin role assignment for:", email);
  console.log("---");

  // Get user info
  const user = await sql`
    SELECT id, email, clerk_user_id, type
    FROM users
    WHERE email = ${email}
  `;

  if (user.length === 0) {
    console.log("❌ User not found!");
    return;
  }

  const userId = user[0].id;
  console.log("User ID:", userId);
  console.log("Clerk ID:", user[0].clerk_user_id);
  console.log("---");

  // Get platform admin role
  const role = await sql`
    SELECT id, slug, name
    FROM roles
    WHERE slug = 'platform-admin'
  `;

  if (role.length === 0) {
    console.log("❌ Platform admin role not found!");
    return;
  }

  const roleId = role[0].id;
  console.log("Platform Admin Role ID:", roleId);
  console.log("---");

  // Check if user already has the role
  const existing = await sql`
    SELECT * FROM user_roles
    WHERE user_id = ${userId} AND role_id = ${roleId}
  `;

  if (existing.length > 0) {
    console.log("✅ User already has platform admin role!");
    return;
  }

  // Assign the role
  const nanoid = (await import('nanoid')).nanoid;
  await sql`
    INSERT INTO user_roles (id, user_id, role_id, assigned_by, created_at)
    VALUES (${nanoid()}, ${userId}, ${roleId}, ${userId}, NOW())
  `;

  console.log("✅ Assigned platform admin role to user!");
  console.log("---");
  console.log("Now try creating a school again!");
}

fixAdminRole().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
