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
  // Check tenants table
  const tenants = await sql`SELECT * FROM tenants`;
  console.log("Tenants:", tenants);

  // Check schools without tenant_id
  const schools = await sql`SELECT id, name, tenant_id FROM schools LIMIT 5`;
  console.log("Schools:", schools);
}

main().catch(console.error);
