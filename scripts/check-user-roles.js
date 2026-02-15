import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Get all user role assignments
  const assignments = await sql`
    SELECT
      u.id as user_id,
      u.email,
      u.clerk_user_id,
      r.slug as role_slug,
      r.name as role_name
    FROM user_roles ur
    JOIN users u ON ur.user_id = u.id
    JOIN roles r ON ur.role_id = r.id
    ORDER BY u.email, r.slug
  `;

  console.log("User Role Assignments:");
  console.log("=======================");
  if (!assignments || assignments.length === 0) {
    console.log("❌ No role assignments found!");
  } else {
    for (const assign of assignments) {
      console.log(`📧 ${assign.email}`);
      console.log(`   User ID: ${assign.user_id}`);
      console.log(`   Role: ${assign.role_slug} (${assign.role_name})`);
      console.log(`   Clerk ID: ${assign.clerk_user_id}`);
      console.log("---");
    }
  }
  console.log(`\nTotal: ${assignments?.length || 0} role assignments`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
