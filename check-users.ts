import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    const users = await sql`
      SELECT id, name, email, role, clerk_user_id, onboarding_complete
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `;

    console.log("Users in database:");
    console.table(users);
  } catch (error) {
    console.log("Error or no users:", error);
  }
}

main();
