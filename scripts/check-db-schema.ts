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
  console.log("Checking database schema...\n");

  // Check schools table columns
  console.log("=== SCHOOLS TABLE COLUMNS ===");
  const schoolsColumns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'schools'
    ORDER BY ordinal_position
  `;
  console.table(schoolsColumns);

  // Check districts table columns
  console.log("\n=== DISTRICTS TABLE COLUMNS ===");
  const districtsColumns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'districts'
    ORDER BY ordinal_position
  `;
  console.table(districtsColumns);

  // Check count of existing schools
  console.log("\n=== EXISTING DATA ===");
  const schoolCount = await sql`SELECT COUNT(*) as count FROM schools`;
  console.log("Schools count:", schoolCount[0]?.count || 0);

  const districtCount = await sql`SELECT COUNT(*) as count FROM districts`;
  console.log("Districts count:", districtCount[0]?.count || 0);
}

main().catch(console.error);
