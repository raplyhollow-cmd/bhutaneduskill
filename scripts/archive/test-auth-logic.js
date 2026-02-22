import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Testing requireAuth logic ===\n");

  const clerkUserId = "user_39hhwCmfyypYaBYApbcNxapWgXy";

  // Simulate what requireAuth(['admin']) does
  console.log("1. Checking if user exists in database...");
  const user = await sql`
    SELECT id, clerk_user_id, type, email
    FROM users
    WHERE clerk_user_id = ${clerkUserId}
    LIMIT 1
  `;

  if (!user || user.length === 0) {
    console.log("  ❌ User not found - would return 404");
    return;
  }

  console.log(`  ✓ Found user: ${user[0].email}`);
  console.log(`  ✓ User type: "${user[0].type}"`);

  console.log("\n2. Checking if type is in ['admin']...");
  const allowedRoles = ['admin'];
  const hasRole = allowedRoles.includes(user[0].type);

  console.log(`  Allowed: ${allowedRoles}`);
  console.log(`  User type: "${user[0].type}"`);
  console.log(`  Result: ${hasRole ? '✓ PASS' : '❌ FAIL - would return 403'}`);

  // Test the actual include check
  console.log("\n3. JavaScript include test:");
  console.log(`  ['admin'].includes("admin") = ${['admin'].includes('admin')}`);
  console.log(`  ['admin'].includes("${user[0].type}") = ${['admin'].includes(user[0].type)}`);

  // Check for any hidden characters
  console.log("\n4. Checking for hidden characters in type:");
  console.log(`  Type length: ${user[0].type.length}`);
  console.log(`  Type bytes: ${Array.from(user[0].type).map(b => b.charCodeAt(0))}`);
  console.log(`  Type JSON: ${JSON.stringify(user[0].type)}`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
