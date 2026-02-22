import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const neonClient = neon(databaseUrl);

  console.log("\n=== Checking Existing Tables ===\n");

  const tables = await neonClient`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log("Existing tables:");
  tables.forEach((t: any) => console.log(`  - ${t.table_name}`));

  console.log("\n=== Checking 'users' table structure ===\n");

  try {
    const columns = await neonClient`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    columns.forEach((c: any) => {
      console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
    });
  } catch (e) {
    console.log("  'users' table does not exist");
  }

  console.log("\n=== Checking 'schools' table structure ===\n");

  try {
    const columns = await neonClient`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'schools' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    columns.forEach((c: any) => {
      console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
    });
  } catch (e) {
    console.log("  'schools' table does not exist");
  }

  console.log("\n=== Count of records in each table ===\n");

  for (const t of tables) {
    const count = await neonClient`SELECT COUNT(*) as count FROM "${neonClient(t.table_name)}"`;
    console.log(`  ${t.table_name}: ${count[0].count} records`);
  }
}

main().catch(console.error);
