/**
 * Run approval workflow migration directly using Neon SQL client
 * This script adds:
 * 1. onboarding_status column to users table
 * 2. Creates school_admin_applications table if not exists
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env file from project root
config({ path: resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log("Starting approval workflow migration...\n");

  try {
    // Step 1: Add onboarding_status column to users table
    console.log("Step 1: Adding onboarding_status column to users table...");
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS onboarding_status text
      DEFAULT 'restricted';
    `;
    console.log("✓ Added onboarding_status column\n");
  } catch (error) {
    console.log("Note:", error.message, "\n");
  }

  try {
    // Step 2: Check if school_admin_applications table exists
    console.log("Step 2: Checking school_admin_applications table...");
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'school_admin_applications'
      );
    `;

    const tableExists = result[0]?.exists;

    if (!tableExists) {
      console.log("Creating school_admin_applications table...");

      // Create the table
      await sql`
        CREATE TABLE school_admin_applications (
          id text PRIMARY KEY NOT NULL,
          user_id text NOT NULL,
          school_id text NOT NULL,
          status text NOT NULL DEFAULT 'pending_approval',
          payment_status text NOT NULL DEFAULT 'pending',
          payment_amount text,
          payment_date timestamp with time zone,
          payment_method text,
          payment_reference text,
          payment_verified_by text,
          payment_verified_at timestamp with time zone,
          bank_reference_number text,
          applied_at timestamp with time zone NOT NULL,
          reviewed_by text,
          reviewed_at timestamp with time zone,
          rejection_reason text,
          notes text,
          created_at timestamp with time zone NOT NULL,
          updated_at timestamp with time zone NOT NULL,
          CONSTRAINT fk_user
            FOREIGN KEY(user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_school
            FOREIGN KEY(school_id)
            REFERENCES schools(id)
            ON DELETE CASCADE
        );
      `;
      console.log("✓ Created school_admin_applications table");

      // Create indexes
      await sql`
        CREATE INDEX idx_school_admin_apps_user_id
        ON school_admin_applications(user_id);
        CREATE INDEX idx_school_admin_apps_school_id
        ON school_admin_applications(school_id);
        CREATE INDEX idx_school_admin_apps_status
        ON school_admin_applications(status);
        CREATE INDEX idx_school_admin_apps_payment_status
        ON school_admin_applications(payment_status);
      `;
      console.log("✓ Created indexes\n");
    } else {
      console.log("✓ school_admin_applications table already exists\n");
    }
  } catch (error) {
    console.log("Note:", error.message, "\n");
  }

  console.log("Migration complete!");
  process.exit(0);
}

runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
