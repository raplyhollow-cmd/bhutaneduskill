// Load environment variables
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log("Verifying seeded data...\n");

  // Check school count
  const schoolCount = await sql`SELECT COUNT(*) as count FROM schools`;
  console.log(`Total schools: ${schoolCount[0]?.count || 0}`);

  // Search for "yang" schools
  const yangSchools = await sql`
    SELECT id, name, code, city, state
    FROM schools
    WHERE LOWER(name) LIKE LOWER('%yang%')
  `;
  console.log("\n🔍 Schools matching 'yang':");
  console.table(yangSchools);

  // List all schools
  const allSchools = await sql`
    SELECT id, name, code, city
    FROM schools
    ORDER BY name
    LIMIT 10
  `;
  console.log("\n📚 First 10 schools:");
  console.table(allSchools);
}

main().catch(console.error);
