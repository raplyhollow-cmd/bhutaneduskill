/**
 * Migration: Add onboarding_status column and student_applications table
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Starting migration...");

  // Add onboarding_status column to users table
  try {
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'pending_enrollment'
    `;
    console.log("✓ Added onboarding_status column to users table");
  } catch (e: any) {
    console.log("  Note:", e.message);
  }

  // Create student_applications table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS student_applications (
        id text PRIMARY KEY,
        student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        school_id text NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        status text NOT NULL,
        requested_grade integer,
        requested_section text,
        guardian_name text,
        guardian_phone text,
        guardian_email text,
        previous_school text,
        previous_grade integer,
        special_notes text,
        submitted_at timestamp with time zone NOT NULL,
        reviewed_at timestamp with time zone,
        reviewed_by text REFERENCES users(id),
        rejection_reason text,
        notes text,
        created_at timestamp with time zone NOT NULL,
        updated_at timestamp with time zone NOT NULL
      )
    `;
    console.log("✓ Created student_applications table");
  } catch (e: any) {
    console.log("  Note:", e.message);
  }

  // Create indexes
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_student_apps_student_id ON student_applications(student_id)`;
    console.log("  ✓ Created index: idx_student_apps_student_id");
  } catch (e: any) {
    console.log("  Note:", e.message);
  }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_student_apps_school_id ON student_applications(school_id)`;
    console.log("  ✓ Created index: idx_student_apps_school_id");
  } catch (e: any) {
    console.log("  Note:", e.message);
  }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_student_apps_status ON student_applications(status)`;
    console.log("  ✓ Created index: idx_student_apps_status");
  } catch (e: any) {
    console.log("  Note:", e.message);
  }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_student_apps_school_status ON student_applications(school_id, status)`;
    console.log("  ✓ Created index: idx_student_apps_school_status");
  } catch (e: any) {
    console.log("  Note:", e.message);
  }

  console.log("\n✅ Migration completed!");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
