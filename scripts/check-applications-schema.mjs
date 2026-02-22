import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    console.log("Checking if school_admin_applications table exists...\n");

    // Check if table exists
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'school_admin_applications'
    `;

    if (tables.length === 0) {
      console.log("❌ Table 'school_admin_applications' does NOT exist!");
      console.log("\nCreating table now...");

      await sql`
        CREATE TABLE IF NOT EXISTS school_admin_applications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending_approval',
          payment_status TEXT NOT NULL DEFAULT 'pending',
          payment_amount TEXT,
          payment_date TIMESTAMP WITH TIME ZONE,
          payment_method TEXT,
          payment_reference TEXT,
          payment_verified_by TEXT REFERENCES users(id),
          payment_verified_at TIMESTAMP WITH TIME ZONE,
          bank_reference_number TEXT,
          applied_at TIMESTAMP WITH TIME ZONE NOT NULL,
          reviewed_by TEXT REFERENCES users(id),
          reviewed_at TIMESTAMP WITH TIME ZONE,
          rejection_reason TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `;

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_user_id ON school_admin_applications(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_school_id ON school_admin_applications(school_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_status ON school_admin_applications(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_payment_status ON school_admin_applications(payment_status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_school_status ON school_admin_applications(school_id, status)`;

      console.log("✅ Table 'school_admin_applications' created successfully!");
    } else {
      console.log("✅ Table 'school_admin_applications' exists!\n");

      // Get column info
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'school_admin_applications'
        ORDER BY ordinal_position
      `;

      console.log("Columns:");
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Check for existing applications
    const apps = await sql`SELECT COUNT(*) as count FROM school_admin_applications`;
    console.log(`\nExisting applications: ${apps[0].count}`);

  } catch (error) {
    console.error("Error:", error);
  }
}

checkSchema();
