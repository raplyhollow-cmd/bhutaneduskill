import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/db/schema";

const client = createClient({
  url: "file:local.db",
});

const db = drizzle(client, { schema });

async function migrate() {
  console.log("🔧 Creating database tables...");

  // Create tables manually using SQL
  await client.execute(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      domain TEXT UNIQUE,
      settings TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  console.log("✅ Created tenants table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      domain TEXT UNIQUE,
      address TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      settings TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    )
  `);

  console.log("✅ Created schools table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      school_id TEXT,
      type TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      profile_picture TEXT,
      date_of_birth TEXT,
      class_grade INTEGER,
      section TEXT,
      parent_id TEXT,
      employee_id TEXT,
      subjects TEXT,
      occupation TEXT,
      relationship TEXT,
      clerk_user_id TEXT UNIQUE,
      email_verified INTEGER DEFAULT 0,
      settings TEXT,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (parent_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created users table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'riasec',
      status TEXT DEFAULT 'in_progress',
      answers TEXT NOT NULL,
      results TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created assessments table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      assessment_type TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      category TEXT,
      order_index INTEGER,
      is_active INTEGER DEFAULT 1,
      language TEXT DEFAULT 'en',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  console.log("✅ Created questions table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS careers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      riasec_code TEXT,
      riasec_scores TEXT,
      skills TEXT,
      education_path TEXT,
      subjects TEXT,
      work_environment TEXT,
      salary_range TEXT,
      demand_outlook TEXT,
      bhutan_specific INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  console.log("✅ Created careers table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS career_matches (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      career_id TEXT NOT NULL,
      match_score INTEGER NOT NULL,
      recommendation_text TEXT,
      is_top_match INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (career_id) REFERENCES careers(id)
    )
  `);

  console.log("✅ Created career_matches table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      consent_text TEXT,
      ip_address TEXT,
      user_agent TEXT,
      consented_at INTEGER,
      revoked_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created consent_records table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      section TEXT,
      academic_year TEXT NOT NULL,
      students TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created classes table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS assessment_types (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      target_grade TEXT,
      target_audience TEXT,
      category TEXT,
      duration INTEGER,
      question_count INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);

  console.log("✅ Created assessment_types table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS assessment_submissions (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      assigned_by TEXT,
      status TEXT DEFAULT 'pending',
      started_at INTEGER,
      completed_at INTEGER,
      time_spent INTEGER,
      ip_address TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created assessment_submissions table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS mbti_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      ei_score INTEGER,
      sn_score INTEGER,
      tf_score INTEGER,
      jp_score INTEGER,
      personality_type TEXT,
      traits TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created mbti_results table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS disc_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      dominance INTEGER,
      influence INTEGER,
      steadiness INTEGER,
      conscientiousness INTEGER,
      disc_type TEXT,
      traits TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created disc_results table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS work_values_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      value_data TEXT,
      top_values TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created work_values_results table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS learning_styles_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      visual INTEGER,
      auditory INTEGER,
      read_write INTEGER,
      kinesthetic INTEGER,
      dominant_style TEXT,
      recommendations TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created learning_styles_results table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS riasec_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      realistic INTEGER,
      investigative INTEGER,
      artistic INTEGER,
      social INTEGER,
      enterprising INTEGER,
      conventional INTEGER,
      holland_code TEXT,
      traits TEXT,
      career_suggestions TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created riasec_results table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      exam_type TEXT,
      exam_year INTEGER,
      subjects TEXT,
      total_percentage INTEGER,
      division TEXT,
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT,
      entered_by TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (verified_by) REFERENCES users(id),
      FOREIGN KEY (entered_by) REFERENCES users(id)
    )
  `);

  console.log("✅ Created exam_results table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS career_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      counselor_id TEXT,
      current_phase TEXT DEFAULT 'self_assessment',
      targetCareer TEXT,
      short_term_goals TEXT,
      long_term_goals TEXT,
      action_steps TEXT,
      milestones TEXT,
      status TEXT DEFAULT 'active',
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (counselor_id) REFERENCES users(id),
      FOREIGN KEY (targetCareer) REFERENCES careers(id)
    )
  `);

  console.log("✅ Created career_plans table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS counselor_notes (
      id TEXT PRIMARY KEY,
      counselor_id TEXT,
      student_id TEXT,
      note TEXT NOT NULL,
      is_private INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (counselor_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  console.log("✅ Created counselor_notes table");

  console.log("🎉 Database migration complete!");
  process.exit(0);
}

migrate().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
