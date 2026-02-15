import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Checking RBAC Setup ===\n");

  // Check if schools.create permission exists
  const perm = await sql`
    SELECT id, slug, name FROM permissions WHERE slug = 'schools.create'
  `;

  console.log("schools.create permission:");
  if (perm && perm.length > 0) {
    console.log("  ✓ EXISTS:", perm[0].id, perm[0].name);
  } else {
    console.log("  ❌ DOES NOT EXIST - needs to be created!");
  }

  // Check platform-admin role
  const role = await sql`
    SELECT id, name FROM roles WHERE slug = 'platform-admin'
  `;

  console.log("\nplatform-admin role:");
  if (role && role.length > 0) {
    console.log("  ✓ EXISTS:", role[0].id);

    // Check permissions assigned to platform-admin
    const rolePerms = await sql`
      SELECT p.slug, p.name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ${role[0].id}
      ORDER BY p.slug
    `;

    console.log(`  Permissions assigned (${rolePerms.length} total):`);
    if (rolePerms.length === 0) {
      console.log("    ❌ NO PERMISSIONS!");
    } else {
      for (const p of rolePerms) {
        const hasSchools = p.slug === 'schools.create' ? ' ← schools.create' : '';
        console.log(`    - ${p.slug}: ${p.name}${hasSchools}`);
      }
    }
  } else {
    console.log("  ❌ DOES NOT EXIST!");
  }

  // Check if platform-admin has schools.create
  const hasPerm = await sql`
    SELECT 1 FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN roles r ON rp.role_id = r.id
    WHERE r.slug = 'platform-admin' AND p.slug = 'schools.create'
  `;

  console.log("\nplatform-admin has schools.create:");
  console.log("  ", hasPerm.length > 0 ? "✓ YES" : "❌ NO");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
