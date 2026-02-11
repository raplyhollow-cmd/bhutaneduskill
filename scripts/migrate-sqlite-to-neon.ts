/**
 * SQLite to Neon PostgreSQL Migration Script
 *
 * This script exports data from local SQLite and imports to Neon PostgreSQL
 *
 * Usage:
 *   1. Set DATABASE_URL to your Neon connection string
 *   2. Run: npm run migrate:neon
 *   3. Or: npx tsx scripts/migrate-sqlite-to-neon.ts
 */

import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/db/schema";

// Configuration
const SQLITE_PATH = process.env.SQLITE_PATH || "local.db";
const NEON_URL = process.env.DATABASE_URL;

if (!NEON_URL) {
  console.error("❌ DATABASE_URL environment variable is required!");
  console.error("   Set it to your Neon PostgreSQL connection string.");
  process.exit(1);
}

// Initialize databases
const sqlite = new Database(SQLITE_PATH);
const neonClient = neon(NEON_URL);

// Track migration stats
const stats = {
  tables: [] as string[],
  rowsMigrated: 0,
  errors: [] as string[],
};

/**
 * Convert a row from SQLite to PostgreSQL format
 */
function convertRow(row: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      converted[key] = null;
    } else if (typeof value === "object" && !Buffer.isBuffer(value)) {
      // JSON objects - stringify for PostgreSQL
      converted[key] = JSON.stringify(value);
    } else if (Buffer.isBuffer(value)) {
      // Buffer to base64 or string
      converted[key] = value.toString("base64");
    } else {
      converted[key] = value;
    }
  }

  return converted;
}

/**
 * Migrate a table from SQLite to Neon using raw SQL
 */
async function migrateTable(tableName: string) {
  try {
    console.log(`\n📋 Migrating ${tableName}...`);

    // Get all rows from SQLite using raw SQL
    const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all() as any[];

    if (rows.length === 0) {
      console.log(`   ℹ️  No data in ${tableName}, skipping.`);
      return;
    }

    console.log(`   Found ${rows.length} rows`);

    // Get column names from first row
    const columns = Object.keys(rows[0]);

    // Convert and insert into Neon
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const converted = convertRow(row);

        // Build INSERT query
        const cols = columns.join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map(col => converted[col]);

        const query = `
          INSERT INTO ${tableName} (${cols})
          VALUES (${placeholders})
          ON CONFLICT (id) DO NOTHING
        `;

        await neonClient.query(query, values);
        successCount++;
      } catch (err) {
        errorCount++;
        const errorMsg = (err as Error).message;
        if (!errorMsg.includes('duplicate key') && !errorMsg.includes('constraint')) {
          stats.errors.push(`${tableName}: ${errorMsg}`);
        }
      }
    }

    console.log(`   ✅ ${successCount} rows migrated, ${errorCount} errors`);
    stats.tables.push(tableName);
    stats.rowsMigrated += successCount;

  } catch (error) {
    console.error(`   ❌ Error migrating ${tableName}:`, error);
    stats.errors.push(`${tableName}: ${(error as Error).message}`);
  }
}

/**
 * Create PostgreSQL schema from SQLite schema
 */
async function createPostgreSQLSchema() {
  console.log("\n🔨 Creating PostgreSQL schema...");

  // First, let's check what tables exist in SQLite
  const tables = sqlite.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string }[];

  console.log(`   Found ${tables.length} tables in SQLite`);

  // For each table, create it in PostgreSQL
  for (const table of tables) {
    const tableName = table.name;

    // Get table schema from SQLite
    const pragma = sqlite.prepare(`PRAGMA table_info(${tableName})`).all() as {
      name: string;
      type: string;
      notnull: number;
      dflt_value: any;
    }[];

    // Build CREATE TABLE statement
    let createSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

    const columns = pragma.map(col => {
      let pgType = "TEXT";

      // Convert SQLite types to PostgreSQL
      if (col.type.toLowerCase().includes("int")) {
        pgType = "INTEGER";
      } else if (col.type.toLowerCase().includes("text") || col.type.toLowerCase().includes("char")) {
        pgType = "TEXT";
      } else if (col.type.toLowerCase().includes("real") || col.type.toLowerCase().includes("float") || col.type.toLowerCase().includes("double")) {
        pgType = "REAL";
      } else if (col.type.toLowerCase().includes("blob")) {
        pgType = "BYTEA";
      }

      let columnDef = `  ${col.name} ${pgType}`;

      if (col.name === "id") {
        columnDef += " PRIMARY KEY";
      } else if (col.notnull) {
        columnDef += " NOT NULL";
      }

      return columnDef;
    });

    createSQL += columns.join(",\n");
    createSQL += "\n);";

    try {
      await neonClient.query(createSQL);
      console.log(`   ✅ Created table: ${tableName}`);
    } catch (err) {
      // Table might already exist
      if ((err as Error).message.includes("already exists")) {
        console.log(`   ℹ️  Table exists: ${tableName}`);
      } else {
        console.error(`   ⚠️  Error creating ${tableName}:`, (err as Error).message);
      }
    }
  }

  console.log("   ✅ Schema creation complete");
}

/**
 * Main migration function
 */
async function migrate() {
  console.log("🚀 Starting SQLite to Neon PostgreSQL migration...\n");
  console.log(`   SQLite: ${SQLITE_PATH}`);
  console.log(`   Neon: ${NEON_URL?.substring(0, 50)}...`);

  // Test connections
  try {
    await neonClient.query('SELECT 1');
    console.log("\n✅ Neon connection verified");
  } catch (error) {
    console.error("\n❌ Cannot connect to Neon:", error);
    process.exit(1);
  }

  // Create PostgreSQL schema
  await createPostgreSQLSchema();

  // Get all tables to migrate
  const tables = sqlite.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string }[];

  // Migrate tables in dependency order (critical tables first)
  const tableOrder = [
    "tenants", "districts",
    "schools",
    "users",
    "assessment_types", "questions", "assessments",
    "mbti_results", "disc_results", "work_values_results",
    "learning_styles_results", "riasec_results",
    "careers", "career_matches", "career_plans",
    "classes", "academic_terms", "subjects",
    "enrollments", "teacher_assignments",
    "homework", "homework_submissions",
    "attendance_sessions", "attendance",
    "exam_results", "exam_results_enhanced",
    "fee_structures", "student_fees", "fee_payments",
    "learning_modules", "module_progress",
    "tuition_categories", "tutors", "tuition_courses",
    "tuition_enrollments", "live_sessions",
    "tutor_reviews", "tutor_earnings",
    "physical_tuition_requests",
    "colleges", "rub_programs", "scholarships",
    "data_sources", "content_audit",
    "consent_records", "counselor_notes",
    "school_admins", "counselor_assignments",
    "file_storage", "wizard_progress",
    "announcements", "announcement_reads",
    "notification_preferences",
    "assessment_submissions"
  ];

  // Migrate in order, then any remaining tables
  for (const tableName of tableOrder) {
    await migrateTable(tableName);
  }

  // Migrate any remaining tables
  for (const table of tables) {
    if (!tableOrder.includes(table.name)) {
      await migrateTable(table.name);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(50));
  console.log(`   Tables processed: ${stats.tables.length}`);
  console.log(`   Rows migrated: ${stats.rowsMigrated}`);
  console.log(`   Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n⚠️  Errors encountered:");
    stats.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Migration complete!");
  console.log("=".repeat(50));

  // Close SQLite connection
  sqlite.close();
  process.exit(stats.errors.length > 0 ? 1 : 0);
}

// Run migration
migrate().catch((error) => {
  console.error("\n❌ Migration failed:", error);
  process.exit(1);
});
