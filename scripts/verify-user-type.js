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
  console.log("User Details (RAW from database):");
  console.log("================================");
  console.log(`ID: "${u.id}"`);
  console.log(`Email: "${u.email}"`);
  console.log(`Clerk User ID: "${u.clerk_user_id}"`);
  console.log(`Type: "${u.type}"` + ` (type of: ${typeof u.type})`);
  console.log(`Role: "${u.role}"` + ` (type of: ${typeof u.role})`);
  console.log(`Onboarding Complete: ${u.onboarding_complete}`);

  // What requireAuth(['admin']) would check
  console.log("\nrequireAuth(['admin']) check:");
  console.log(`  Allowed types: ['admin']`);
  console.log(`  User type: "${u.type}"`);
  console.log(`  Result: ${['admin'].includes(u.type) ? '✓ PASS' : '❌ FAIL - 403 Forbidden!'}`);

  if (!['admin'].includes(u.type)) {
    console.log("\n⚠️ FIX NEEDED: User type is '${u.type}' but should be 'admin'");
    console.log("  Run: UPDATE users SET type = 'admin' WHERE clerk_user_id = '" + clerkUserId + "'");
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
