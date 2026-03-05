/**
 * E2E Test Data Seed Script
 *
 * This script creates test users and data for E2E testing.
 * It creates users with known credentials that match the test fixtures.
 *
 * IMPORTANT: This script should be run in a TEST/DEVELOPMENT environment only!
 *
 * Usage:
 *   npx tsx scripts/seed-e2e-test-data.ts
 *
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 *   E2E_TEST_SECRET - Secret to verify this is a test environment
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

// Security check - only run in test/dev mode
if (process.env.NODE_ENV === "production" && !process.env.E2E_TEST_SECRET) {
  console.error("❌ ERROR: Cannot run E2E seed script in production without E2E_TEST_SECRET");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);

// Test users matching the credentials in playwright-helpers.ts
const TEST_USERS = [
  {
    email: "test-student@bhutaneduskill.bt",
    type: "student",
    firstName: "Test",
    lastName: "Student",
    clerkUserId: "test-student-clerk-id",
    onboardingStatus: "approved",
    onboardingComplete: true,
  },
  {
    email: "test-teacher@bhutaneduskill.bt",
    type: "teacher",
    firstName: "Test",
    lastName: "Teacher",
    clerkUserId: "test-teacher-clerk-id",
    onboardingStatus: "approved",
    onboardingComplete: true,
  },
  {
    email: "test-schooladmin@bhutaneduskill.bt",
    type: "school-admin",
    firstName: "Test",
    lastName: "School Admin",
    clerkUserId: "test-schooladmin-clerk-id",
    onboardingStatus: "approved",
    onboardingComplete: true,
  },
  {
    email: "test-parent@bhutaneduskill.bt",
    type: "parent",
    firstName: "Test",
    lastName: "Parent",
    clerkUserId: "test-parent-clerk-id",
    onboardingStatus: "approved",
    onboardingComplete: true,
  },
  {
    email: "test-counselor@bhutaneduskill.bt",
    type: "counselor",
    firstName: "Test",
    lastName: "Counselor",
    clerkUserId: "test-counselor-clerk-id",
    onboardingStatus: "approved",
    onboardingComplete: true,
  },
  {
    email: "test-admin@bhutaneduskill.bt",
    type: "admin",
    firstName: "Test",
    lastName: "Admin",
    clerkUserId: "test-admin-clerk-id",
    onboardingStatus: "approved",
    onboardingComplete: true,
  },
  {
    email: "test-ministry@bhutaneduskill.bt",
    type: "ministry",
    firstName: "Test",
    lastName: "Ministry",
    clerkUserId: "test-ministry-clerk-id",
    onboardingStatus: "approved",
    onboardingComplete: true,
  },
];

// Test school
const TEST_SCHOOL = {
  name: "Test Academy",
  code: "TEST001",
  isActive: true,
  setupComplete: true,
  subscriptionStatus: "active",
};

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create or find test school
 */
async function createTestSchool() {
  console.log("\n[Finding Test School]");

  // Check if test school already exists
  const existing = await sql`
    SELECT id, name FROM schools WHERE code = ${TEST_SCHOOL.code} LIMIT 1
  `;

  if (existing.length > 0) {
    console.log(`  ✓ Using existing test school: ${existing[0].id}`);
    return existing[0].id;
  }

  // Try to find any existing active school to use for testing
  const anySchool = await sql`
    SELECT id, name FROM schools WHERE is_active = true AND subscription_status = 'active' LIMIT 1
  `;

  if (anySchool.length > 0) {
    console.log(`  ✓ Using existing active school: ${anySchool[0].id} (${anySchool[0].name})`);
    return anySchool[0].id;
  }

  // Create minimal test school with all required fields
  const schoolId = generateId("school");
  await sql`
    INSERT INTO schools (
      id, name, code, type, address, city, state, country, postal_code, phone, email, website, logo,
      established_year, accreditation_status, max_students, campus_size, board,
      principal_name, principal_email, principal_phone,
      counselor_name, counselor_email, counselor_phone,
      vice_principal_name, school_type, level,
      is_active, subscription_status, setup_complete,
      created_at, updated_at
    )
    VALUES (
      ${schoolId}, ${TEST_SCHOOL.name}, ${TEST_SCHOOL.code}, 'public',
      'Test Address', 'Thimphu', 'Thimphu', 'Bhutan', '11001',
      '+975-2-123456', 'test@bhutaneduskill.bt', 'https://bhutaneduskill.bt', '',
      2020, 'accredited', 500, '10 acres', 'BCSEB',
      'Test Principal', 'principal@test.bt', '+975-2-123456',
      'Test Counselor', 'counselor@test.bt', '+975-2-123456',
      'Test VP', 'public', 'middle',
      ${TEST_SCHOOL.isActive}, ${TEST_SCHOOL.subscriptionStatus}, ${TEST_SCHOOL.setupComplete},
      NOW(), NOW()
    )
  `;

  console.log(`  ✓ Created test school: ${schoolId}`);
  return schoolId;
}

/**
 * Create test users
 */
async function createTestUsers(schoolId: string) {
  console.log("\n[Creating Test Users]");

  const createdUsers: Array<{ email: string; id: string; type: string }> = [];

  for (const user of TEST_USERS) {
    // Check if user already exists
    const existing = await sql`
      SELECT id, type FROM users WHERE clerk_user_id = ${user.clerkUserId} LIMIT 1
    `;

    if (existing.length > 0) {
      console.log(`  ✓ Using existing ${user.type}: ${existing[0].id} (${user.email})`);
      createdUsers.push({ email: user.email, id: existing[0].id, type: user.type });
      continue;
    }

    const userId = generateId(user.type);
    const fullName = `${user.firstName} ${user.lastName}`;

    await sql`
      INSERT INTO users (
        id, clerk_user_id, type, role, name, first_name, last_name, email, phone, grade,
        school_id, onboarding_status, onboarding_complete,
        created_at, updated_at
      )
      VALUES (
        ${userId}, ${user.clerkUserId}, ${user.type}, ${user.type}, ${fullName}, ${user.firstName}, ${user.lastName}, ${user.email}, '+975-2-123456', 8,
        ${schoolId}, ${user.onboardingStatus}, ${user.onboardingComplete},
        NOW(), NOW()
      )
      ON CONFLICT (clerk_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW()
    `;

    console.log(`  ✓ Created ${user.type}: ${userId} (${user.email})`);
    createdUsers.push({ email: user.email, id: userId, type: user.type });
  }

  return createdUsers;
}

/**
 * Create test subjects
 */
async function createTestSubjects(schoolId: string) {
  console.log("\n[Creating Test Subjects]");

  const subjects = [
    { name: "Mathematics", code: "MATH-TEST", grade: 8 },
    { name: "English", code: "ENG-TEST", grade: 8 },
    { name: "Science", code: "SCI-TEST", grade: 8 },
    { name: "Dzongkha", code: "DZO-TEST", grade: 8 },
  ];

  const createdSubjects: Array<{ id: string; name: string }> = [];

  for (const subject of subjects) {
    const subjectId = generateId("subject");
    try {
      await sql`
        INSERT INTO subjects (id, school_id, name, code, grade, type, is_active, created_at, updated_at)
        VALUES (${subjectId}, ${schoolId}, ${subject.name}, ${subject.code}, ${subject.grade}, 'core', true, NOW(), NOW())
        ON CONFLICT (code) DO NOTHING
      `;
      console.log(`  ✓ Created subject: ${subject.name} (${subject.code})`);
      createdSubjects.push({ id: subjectId, name: subject.name });
    } catch (e: any) {
      if (e.code === '23505') {
        console.log(`  ✓ Subject already exists: ${subject.code}`);
      } else {
        console.error(`  ✗ Failed to create subject: ${subject.name}`, e.message);
      }
    }
  }

  return createdSubjects;
}

/**
 * Create test classes
 */
async function createTestClasses(schoolId: string, teacherId: string) {
  console.log("\n[Creating Test Classes]");

  const classes = [
    { name: "Class 8A", section: "A", grade: 8 },
    { name: "Class 8B", section: "B", grade: 8 },
  ];

  const createdClasses: Array<{ id: string; name: string }> = [];

  for (const cls of classes) {
    const classId = generateId("class");
    try {
      await sql`
        INSERT INTO classes (id, school_id, name, section, grade, homeroom_teacher_id, is_active, created_at, updated_at)
        VALUES (${classId}, ${schoolId}, ${cls.name}, ${cls.section}, ${cls.grade}, ${teacherId}, true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;
      console.log(`  ✓ Created class: ${cls.name}`);
      createdClasses.push({ id: classId, name: cls.name });
    } catch (e: any) {
      console.error(`  ✗ Failed to create class: ${cls.name}`, e.message);
    }
  }

  return createdClasses;
}

/**
 * Create test assessments (for student portal testing)
 */
async function createTestAssessments(studentId: string) {
  console.log("\n[Creating Test Assessments]");

  const assessmentId = generateId("assessment");
  try {
    await sql`
      INSERT INTO assessments (id, user_id, type, status, completed_at, created_at, updated_at)
      VALUES (${assessmentId}, ${studentId}, 'riasec', 'completed', NOW(), NOW(), NOW())
      ON CONFLICT DO NOTHING
    `;
    console.log(`  ✓ Created completed RIASEC assessment for test student`);
    return assessmentId;
  } catch (e: any) {
    console.error(`  ✗ Failed to create assessment:`, e.message);
    return null;
  }
}

/**
 * Main seed function
 */
async function seedE2ETestData() {
  console.log("═════════════════════════════════════════════════════════");
  console.log("  E2E Test Data Seed Script");
  console.log("═════════════════════════════════════════════════════════");
  console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`  Database: ${process.env.DATABASE_URL?.split("@")[1] || "unknown"}`);
  console.log("═════════════════════════════════════════════════════════");

  try {
    // 1. Create test school
    const schoolId = await createTestSchool();

    // 2. Create test users
    const users = await createTestUsers(schoolId);

    // 3. Create test subjects
    await createTestSubjects(schoolId);

    // 4. Create test classes (using teacher user)
    const teacherUser = users.find(u => u.type === "teacher");
    if (teacherUser) {
      await createTestClasses(schoolId, teacherUser.id);
    }

    // 5. Create completed assessment for student
    const studentUser = users.find(u => u.type === "student");
    if (studentUser) {
      await createTestAssessments(studentUser.id);
    }

    console.log("\n═════════════════════════════════════════════════════════");
    console.log("  ✅ E2E Test Data Seeded Successfully!");
    console.log("═════════════════════════════════════════════════════════");
    console.log("\n📝 Test User Credentials:");
    console.log("─────────────────────────────────────────────────────────");
    for (const user of TEST_USERS) {
      console.log(`  ${user.type.padEnd(15)} ${user.email}`);
    }
    console.log("─────────────────────────────────────────────────────────");
    console.log("\n⚠️  IMPORTANT:");
    console.log("  - These are TEST users for E2E testing only");
    console.log("  - Passwords are managed by Clerk (not in database)");
    console.log("  - Set up Clerk test users with matching emails");
    console.log("─────────────────────────────────────────────────────────\n");

  } catch (error) {
    console.error("\n❌ Error seeding E2E test data:", error);
    process.exit(1);
  }
}

// Run the seed function
seedE2ETestData().catch(console.error);
