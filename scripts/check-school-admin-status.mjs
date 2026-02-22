import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const sql = neon(process.env.DATABASE_URL);

async function checkStatus() {
  console.log("Checking school admin users...\n");

  const users = await sql`
    SELECT id, clerk_user_id, type, school_id, onboarding_status, email, name
    FROM users
    WHERE type = 'school-admin'
    LIMIT 5
  `;

  console.log("School Admin Users:");
  console.table(users);

  // Check applications
  const applications = await sql`
    SELECT id, user_id, school_id, status, payment_status, applied_at
    FROM school_admin_applications
    LIMIT 5
  `;

  console.log("\nSchool Admin Applications:");
  console.table(applications);

  process.exit(0);
}

checkStatus().catch(console.error);
