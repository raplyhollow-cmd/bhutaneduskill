import { neon } from "@neondatabase/neon";

async function addOnboardingStatus() {
  console.log("Adding onboarding_status column to users table...");

  const sql = neon(process.env.DATABASE_URL!);

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'restricted';`;
    console.log("✓ Added onboarding_status column");
  } catch (error) {
    console.log("Column may already exist:", error.message);
  }

  try {
    // Check if school_admin_applications table exists
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
      await sql`
        CREATE TABLE "school_admin_applications" (
          "id" text PRIMARY KEY NOT NULL,
          "user_id" text NOT NULL,
          "school_id" text NOT NULL,
          "status" text NOT NULL DEFAULT 'pending_approval',
          "payment_status" text NOT NULL DEFAULT 'pending',
          "applied_at" timestamp with time zone NOT NULL,
          "approved_at" timestamp with time zone,
          "approved_by" text,
          "rejection_reason" text,
          "created_at" timestamp with time zone NOT NULL,
          "updated_at" timestamp with time zone NOT NULL
        );
      `;
      console.log("✓ Created school_admin_applications table");

      await sql`
        CREATE INDEX IF NOT EXISTS "idx_school_admin_applications_user_id" ON "school_admin_applications" ("user_id");
        CREATE INDEX IF NOT EXISTS "idx_school_admin_applications_school_id" ON "school_admin_applications" ("school_id");
        CREATE INDEX IF NOT EXISTS "idx_school_admin_applications_status" ON "school_admin_applications" ("status");
      `;
      console.log("✓ Created indexes");
    } else {
      console.log("✓ school_admin_applications table already exists");
    }
  } catch (error) {
    console.log("Table may already exist:", error.message);
  }

  console.log("Migration complete!");
  process.exit(0);
}

addOnboardingStatus();
