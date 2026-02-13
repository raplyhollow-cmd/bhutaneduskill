/**
 * Drop and recreate Neon database schema
 * Run this before pushing a clean schema
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Load .env file
config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    console.error("Make sure .env file exists with DATABASE_URL");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Dropping existing schema...");

  try {
    // Drop the entire public schema
    await sql`DROP SCHEMA public CASCADE`;
    console.log("✓ Dropped public schema");

    // Recreate the public schema
    await sql`CREATE SCHEMA public`;
    console.log("✓ Created public schema");

    // Grant permissions
    await sql`GRANT ALL ON SCHEMA public TO public`;
    await sql`GRANT ALL ON SCHEMA public TO neondb_owner`;
    console.log("✓ Granted permissions");

    console.log("\n✓ Schema reset complete. You can now run: npx drizzle-kit push");
  } catch (error) {
    console.error("Error dropping schema:", error);
    process.exit(1);
  }
}

main();
