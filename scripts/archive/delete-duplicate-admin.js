import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const userIdToDelete = "user-admin-1771147224943";

  // Check if user exists
  const user = await sql`
    SELECT id, email FROM users WHERE id = ${userIdToDelete} LIMIT 1
  `;

  if (!user || user.length === 0) {
    console.log("User not found (may already be deleted):", userIdToDelete);
    return;
  }

  console.log("Found user to delete:");
  console.log(`ID: ${user[0].id}, Email: ${user[0].email}`);

  // Delete user_roles entries first
  const deletedRoles = await sql`
    DELETE FROM user_roles WHERE user_id = ${userIdToDelete}
  `;
  console.log(`Deleted ${deletedRoles} user_roles entries`);

  // Delete the user
  const deletedUser = await sql`
    DELETE FROM users WHERE id = ${userIdToDelete}
  `;
  console.log(`✓ Deleted user: ${userIdToDelete}`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
