/**
 * Hierarchical Ecosystem Migration Script
 *
 * Adds new tables and columns for the hierarchical approval system:
 * - schools: subscription_status, subscription_tier, activated_at, setup_complete, setup_completed_at
 * - school_admin_applications table
 * - teacher_applications table
 * - departments table
 * - subjects: department_id, subject_type, applicable_grades columns
 *
 * Run: npx tsx scripts/migrate-hierarchy.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

async function addSchoolSubscriptionFields() {
  section("ADDING SUBSCRIPTION FIELDS TO SCHOOLS TABLE");

  const fields = [
    { name: "subscription_status", sql: "ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending_payment'" },
    { name: "subscription_tier", sql: "ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_tier TEXT" },
    { name: "activated_at", sql: "ALTER TABLE schools ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP" },
    { name: "setup_complete", sql: "ALTER TABLE schools ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT FALSE" },
    { name: "setup_completed_at", sql: "ALTER TABLE schools ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMP" },
  ];

  for (const field of fields) {
    try {
      await sql.query(field.sql);
      log(`  ✓ Added ${field.name} to schools`, "green");
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.message?.includes("duplicate column")) {
        log(`  - ${field.name} already exists, skipping`, "blue");
      } else {
        log(`  ✗ Error adding ${field.name}: ${error.message}`, "red");
      }
    }
  }

  // Add index for subscription_status
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_schools_subscription_status ON schools(subscription_status)`;
    log(`  ✓ Added index on subscription_status`, "green");
  } catch (error: any) {
    log(`  - Index on subscription_status may already exist`, "blue");
  }
}

async function createSchoolAdminApplicationsTable() {
  section("CREATING SCHOOL_ADMIN_APPLICATIONS TABLE");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS school_admin_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending_approval',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_amount TEXT,
        payment_date TIMESTAMP,
        payment_method TEXT,
        payment_reference TEXT,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_by TEXT REFERENCES users(id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    log(`  ✓ Created school_admin_applications table`, "green");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_user_id ON school_admin_applications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_school_id ON school_admin_applications(school_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_status ON school_admin_applications(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_payment_status ON school_admin_applications(payment_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_school_admin_apps_school_status ON school_admin_applications(school_id, status)`;
    log(`  ✓ Created indexes for school_admin_applications`, "green");

  } catch (error: any) {
    log(`  - school_admin_applications table may already exist: ${error.message}`, "blue");
  }
}

async function createTeacherApplicationsTable() {
  section("CREATING TEACHER_APPLICATIONS TABLE");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS teacher_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        qualifications TEXT,
        experience INTEGER,
        subjects TEXT,
        desired_classes TEXT,
        previous_school TEXT,
        specialization TEXT,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_by TEXT REFERENCES users(id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    log(`  ✓ Created teacher_applications table`, "green");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_teacher_apps_user_id ON teacher_applications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teacher_apps_school_id ON teacher_applications(school_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teacher_apps_status ON teacher_applications(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teacher_apps_school_status ON teacher_applications(school_id, status)`;
    log(`  ✓ Created indexes for teacher_applications`, "green");

  } catch (error: any) {
    log(`  - teacher_applications table may already exist: ${error.message}`, "blue");
  }
}

async function createDepartmentsTable() {
  section("CREATING DEPARTMENTS TABLE");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        head_of_department TEXT REFERENCES users(id) ON DELETE SET NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    log(`  ✓ Created departments table`, "green");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_departments_school_id ON departments(school_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_departments_school_code ON departments(school_id, code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_departments_hod ON departments(head_of_department)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active)`;
    log(`  ✓ Created indexes for departments`, "green");

  } catch (error: any) {
    log(`  - departments table may already exist: ${error.message}`, "blue");
  }
}

async function addSubjectDepartmentFields() {
  section("ADDING DEPARTMENT FIELDS TO SUBJECTS TABLE");

  const fields = [
    { name: "department_id", sql: "ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id) ON DELETE SET NULL" },
    { name: "subject_type", sql: "ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_type TEXT DEFAULT 'core'" },
    { name: "applicable_grades", sql: "ALTER TABLE subjects ADD COLUMN IF NOT EXISTS applicable_grades TEXT" },
  ];

  for (const field of fields) {
    try {
      await sql.query(field.sql);
      log(`  ✓ Added ${field.name} to subjects`, "green");
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.message?.includes("duplicate column")) {
        log(`  - ${field.name} already exists, skipping`, "blue");
      } else {
        log(`  ✗ Error adding ${field.name}: ${error.message}`, "red");
      }
    }
  }

  // Add indexes
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_subjects_department_id ON subjects(department_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON subjects(is_active)`;
    log(`  ✓ Added indexes for subjects`, "green");
  } catch (error: any) {
    log(`  - Indexes may already exist`, "blue");
  }
}

async function migrateExistingSchools() {
  section("MIGRATING EXISTING SCHOOLS");

  try {
    // Set existing schools to active and complete
    const result = await sql`
      UPDATE schools
      SET
        subscription_status = 'active',
        activated_at = COALESCE(activated_at, created_at),
        setup_complete = TRUE,
        setup_completed_at = COALESCE(setup_completed_at, updated_at)
      WHERE subscription_status IS NULL OR subscription_status = 'pending_payment'
    `;
    log(`  ✓ Migrated ${result.count} existing schools to active status`, "green");
  } catch (error: any) {
    log(`  ✗ Error migrating schools: ${error.message}`, "red");
  }
}

async function seedDefaultDepartments() {
  section("SEEDING DEFAULT DEPARTMENTS FOR EXISTING SCHOOLS");

  try {
    // Get all schools
    const schools = await sql`SELECT id, name FROM schools`;

    let createdCount = 0;

    for (const school of schools) {
      // Check if departments already exist for this school
      const existing = await sql`
        SELECT COUNT(*) as count FROM departments WHERE school_id = ${school.id}
      `;

      if (existing[0].count > 0) {
        continue; // Skip schools that already have departments
      }

      // Default departments for Bhutan schools
      const defaultDepartments = [
        { name: "Mathematics", code: "MATH" },
        { name: "Science", code: "SCI" },
        { name: "Languages", code: "LANG" },
        { name: "Social Studies", code: "SOC" },
        { name: "IT & Computer Science", code: "IT" },
        { name: "Arts & Music", code: "ART" },
        { name: "Physical Education", code: "PE" },
      ];

      for (const dept of defaultDepartments) {
        await sql`
          INSERT INTO departments (id, school_id, name, code, created_at, updated_at)
          VALUES (CONCAT('dept_', MD5(RANDOM()::text)), ${school.id}, ${dept.name}, ${dept.code}, NOW(), NOW())
        `;
        createdCount++;
      }
    }

    log(`  ✓ Created ${createdCount} default departments`, "green");
  } catch (error: any) {
    log(`  ✗ Error seeding departments: ${error.message}`, "red");
  }
}

async function main() {
  console.log("\n");
  log("╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║        HIERARCHICAL ECOSYSTEM MIGRATION                    ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");

  try {
    await addSchoolSubscriptionFields();
    await createSchoolAdminApplicationsTable();
    await createTeacherApplicationsTable();
    await createDepartmentsTable();
    await addSubjectDepartmentFields();
    await migrateExistingSchools();
    await seedDefaultDepartments();

    console.log("\n");
    log("✓ Migration completed successfully!", "green");
    console.log("\n");

  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
