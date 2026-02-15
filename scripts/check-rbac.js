import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Check if roles table exists
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  `;

  if (!tables || tables.length === 0) {
    console.log("❌ 'roles' table does not exist!");
    console.log("Need to run RBAC schema setup first.");
    return;
  }

  console.log("✓ 'roles' table exists");

  // Check existing roles
  const roles = await sql`
    SELECT id, slug, name FROM roles ORDER BY slug
  `;

  console.log("\nExisting RBAC Roles:");
  console.log("=======================");
  if (!roles || roles.length === 0) {
    console.log("❌ No roles found in database!");
  } else {
    for (const role of roles) {
      console.log(`- ${role.slug}: ${role.name} (ID: ${role.id})`);
    }
  }

  // Check user_roles table
  const userRoles = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  `;

  if (!userRoles || userRoles.length === 0) {
    console.log("\n❌ 'user_roles' table does not exist!");
  } else {
    console.log("\n✓ 'user_roles' table exists");

    const count = await sql`SELECT COUNT(*) as count FROM user_roles`;
    console.log(`  User role assignments: ${count[0].count}`);
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
