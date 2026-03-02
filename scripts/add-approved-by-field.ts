/**
 * MIGRATION: Add approvedBy field to users table
 *
 * This field tracks who approved each user (student/teacher).
 * Run: npx tsx scripts/add-approved-by-field.ts
 */

import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import sql from "drizzle-orm/sql";

async function migrate() {
  console.log("Adding approved_by field to users table...");

  try {
    // Add the column using raw SQL
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS approved_by TEXT REFERENCES users(id);
    `);
    console.log("✅ Successfully added approved_by column to users table");
  } catch (error) {
    console.error("❌ Error adding approved_by column:", error);
    throw error;
  }

  // Add an index for efficient queries
  try {
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_approved_by ON users(approved_by);
    `);
    console.log("✅ Successfully created index on approved_by");
  } catch (error) {
    console.warn("⚠️ Warning: Could not create index:", error);
  }

  console.log("\nMigration complete!");
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
