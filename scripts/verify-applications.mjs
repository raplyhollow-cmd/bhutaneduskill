import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const sql = neon(process.env.DATABASE_URL);

async function verify() {
  const applications = await sql`
    SELECT saa.id, saa.status, saa.payment_status, u.name as user_name, u.email as user_email, s.name as school_name, s.code as school_code
    FROM school_admin_applications saa
    LEFT JOIN users u ON saa.user_id = u.id
    LEFT JOIN schools s ON saa.school_id = s.id
  `;

  console.log("Applications with user and school details:");
  console.table(applications);
  process.exit(0);
}

verify().catch(console.error);
