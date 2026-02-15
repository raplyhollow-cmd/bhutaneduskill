/**
 * Database Test Script - Simplified
 *
 * Tests database operations: WRITE, PULL (QUERY), READ
 * Uses raw SQL to work with existing database structure
 *
 * Run: npx tsx scripts/test-database-simple.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

// ANSI color codes for terminal output
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

// Test result tracking
const results = {
  passed: [] as string[],
  failed: [] as string[],
};

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    results.passed.push(name);
    log(`✓ ${name}`, "green");
  } catch (error) {
    results.failed.push(name);
    log(`✗ ${name}`, "red");
    log(`  Error: ${error instanceof Error ? error.message : String(error)}`, "red");
  }
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  log("ERROR: DATABASE_URL environment variable is not set!", "red");
  process.exit(1);
}

const sql = neon(databaseUrl);

// ============================================================================
// TEST DATA
// ============================================================================

const testSchoolId = `test-school-${Date.now()}`;
const testUserId = `test-user-${Date.now()}`;
const testClassId = `test-class-${Date.now()}`;
const testHomeworkId = `test-homework-${Date.now()}`;

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testConnection() {
  section("TEST 1: Database Connection");

  const result = await sql`SELECT NOW() as current_time`;
  log(`✓ Database connected successfully!`, "green");
  log(`  Server time: ${result[0].current_time}`, "blue");
}

async function testWriteSchool() {
  section("TEST 2: WRITE - Create School");

  await sql`
    INSERT INTO schools (
      id, name, code, type, address, city, state, country, postal_code,
      phone, email, website, logo, established_year, accreditation_status,
      max_students, campus_size, facilities, board, principal_name,
      principal_email, principal_phone, counselor_name, counselor_email,
      counselor_phone, vice_principal_name, created_at, updated_at
    ) VALUES (
      ${testSchoolId},
      'Test School for Database Validation',
      ${`TEST-${Date.now()}`},
      'private',
      '123 Test Street',
      'Thimphu',
      'Thimphu',
      'Bhutan',
      '11001',
      '+975-1234567',
      'test@school.bt',
      'https://testschool.bt',
      '',
      2020,
      'accredited',
      500,
      '5 acres',
      '["library","lab","sports"]',
      'BCSE',
      'Test Principal',
      'principal@testschool.bt',
      '+975-1234568',
      'Test Counselor',
      'counselor@testschool.bt',
      '+975-1234569',
      'Test Vice Principal',
      NOW(),
      NOW()
    )
  `;

  log(`✓ School created with ID: ${testSchoolId}`, "green");
}

async function testWriteUser() {
  section("TEST 3: WRITE - Create User (Student)");

  await sql`
    INSERT INTO users (
      id, clerk_user_id, type, role, name, first_name, last_name,
      email, phone, school_id, profile_image, date_of_birth, gender,
      grade, section, roll_number, address, city, state, postal_code,
      country, parent_contact, parent_phone, emergency_contact,
      blood_group, enrollment_date, last_login, is_active, created_at, updated_at
    ) VALUES (
      ${testUserId},
      ${`clerk_test_${Date.now()}`},
      'student',
      'student',
      'Test Student',
      'Test',
      'Student',
      ${`test${Date.now()}@student.bt`},
      '+975-9876543',
      ${testSchoolId},
      '',
      '2010-01-01',
      'other',
      10,
      'A',
      '1',
      '456 Student Lane',
      'Thimphu',
      'Thimphu',
      '11001',
      'Bhutan',
      'Test Parent',
      '+975-1111111',
      'Test Emergency',
      'O+',
      '2024-01-01',
      ${new Date().toISOString()},
      true,
      NOW(),
      NOW()
    )
  `;

  log(`✓ User created with ID: ${testUserId}`, "green");
}

async function testWriteClass() {
  section("TEST 4: WRITE - Create Class");

  await sql`
    INSERT INTO classes (
      id, school_id, name, grade, section, room_number, capacity,
      homeroom_teacher_name, class_teacher_name, teacher_id,
      academic_year, is_active, created_at, updated_at
    ) VALUES (
      ${testClassId},
      ${testSchoolId},
      'Test Class 10A',
      10,
      'A',
      '101',
      30,
      'Test Teacher',
      'Test Teacher',
      ${testUserId},
      '2024-2025',
      true,
      NOW(),
      NOW()
    )
  `;

  log(`✓ Class created with ID: ${testClassId}`, "green");
}

async function testWriteHomework() {
  section("TEST 5: WRITE - Create Homework");

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO homework (
      id, class_id, title, description, due_date, assigned_date,
      total_points, passing_score, is_published, is_active, created_at, updated_at
    ) VALUES (
      ${testHomeworkId},
      ${testClassId},
      'Test Mathematics Assignment',
      'Solve problems 1-10 from Chapter 5',
      ${dueDate.toISOString()},
      ${new Date().toISOString()},
      100,
      60,
      true,
      true,
      NOW(),
      NOW()
    )
  `;

  log(`✓ Homework created with ID: ${testHomeworkId}`, "green");
}

async function testPullSchool() {
  section("TEST 6: PULL (QUERY) - Read School by ID");

  const school = await sql`
    SELECT * FROM schools WHERE id = ${testSchoolId}
  `;

  if (school.length === 0) {
    throw new Error("School not found!");
  }

  log(`✓ School retrieved successfully!`, "green");
  log(`  ID: ${school[0].id}`, "blue");
  log(`  Name: ${school[0].name}`, "blue");
  log(`  Type: ${school[0].type}`, "blue");
  log(`  City: ${school[0].city}`, "blue");
  log(`  Active: ${school[0].is_active}`, "blue");
}

async function testPullUser() {
  section("TEST 7: PULL (QUERY) - Read User with JOIN");

  const user = await sql`
    SELECT
      u.id, u.name, u.email, u.type, u.grade,
      s.name as school_name
    FROM users u
    LEFT JOIN schools s ON u.school_id = s.id
    WHERE u.id = ${testUserId}
  `;

  if (user.length === 0) {
    throw new Error("User not found!");
  }

  log(`✓ User retrieved successfully with JOIN!`, "green");
  log(`  ID: ${user[0].id}`, "blue");
  log(`  Name: ${user[0].name}`, "blue");
  log(`  Email: ${user[0].email}`, "blue");
  log(`  Type: ${user[0].type}`, "blue");
  log(`  Grade: ${user[0].grade}`, "blue");
  log(`  School: ${user[0].school_name || "N/A"}`, "blue");
}

async function testPullMultiple() {
  section("TEST 8: PULL (QUERY) - Read Multiple Records");

  const classes = await sql`
    SELECT * FROM classes WHERE school_id = ${testSchoolId}
  `;

  log(`✓ Retrieved ${classes.length} class(es) for school`, "green");
  classes.forEach((cls: any) => {
    log(`  - ${cls.name} (Grade ${cls.grade}-${cls.section})`, "blue");
  });

  const homework = await sql`
    SELECT * FROM homework WHERE class_id = ${testClassId}
  `;

  log(`✓ Retrieved ${homework.length} homework assignment(s)`, "green");
  homework.forEach((hw: any) => {
    log(`  - ${hw.title} (Due: ${hw.due_date})`, "blue");
  });
}

async function testUpdateRecord() {
  section("TEST 9: UPDATE - Modify School Name");

  const newName = `Updated Test School ${Date.now()}`;

  await sql`
    UPDATE schools
    SET name = ${newName}, updated_at = NOW()
    WHERE id = ${testSchoolId}
  `;

  const updated = await sql`
    SELECT name FROM schools WHERE id = ${testSchoolId}
  `;

  if (updated[0].name !== newName) {
    throw new Error("Update verification failed!");
  }

  log(`✓ School name updated successfully!`, "green");
  log(`  New name: ${newName}`, "blue");
}

async function testComplexQuery() {
  section("TEST 10: COMPLEX QUERY - Multi-table JOIN");

  const result = await sql`
    SELECT
      u.id as user_id, u.name as user_name, u.email as user_email,
      c.id as class_id, c.name as class_name, c.grade as class_grade,
      s.name as school_name, s.city as school_city
    FROM users u
    INNER JOIN schools s ON u.school_id = s.id
    INNER JOIN classes c ON c.school_id = s.id
    WHERE u.id = ${testUserId}
    LIMIT 5
  `;

  log(`✓ Complex JOIN query executed successfully!`, "green");
  log(`  Found ${result.length} record(s)`, "blue");
  result.forEach((row: any) => {
    log(`  User: ${row.user_name} | Class: ${row.class_name} | School: ${row.school_name}`, "blue");
  });
}

async function testAggregateQuery() {
  section("TEST 11: AGGREGATE - Count Records");

  const userCounts = await sql`
    SELECT type, COUNT(*) as count
    FROM users
    GROUP BY type
  `;

  log(`✓ User count by type:`, "green");
  userCounts.forEach((row: any) => {
    log(`  ${row.type}: ${row.count}`, "blue");
  });

  const schoolCount = await sql`
    SELECT COUNT(*) as count FROM schools
  `;

  log(`✓ Total schools: ${schoolCount[0].count}`, "green");
}

async function cleanupTestData() {
  section("CLEANUP: Removing Test Data");

  try {
    await sql`DELETE FROM homework WHERE id = ${testHomeworkId}`;
    log(`✓ Deleted homework`, "yellow");

    await sql`DELETE FROM classes WHERE id = ${testClassId}`;
    log(`✓ Deleted class`, "yellow");

    await sql`DELETE FROM users WHERE id = ${testUserId}`;
    log(`✓ Deleted user`, "yellow");

    await sql`DELETE FROM schools WHERE id = ${testSchoolId}`;
    log(`✓ Deleted school`, "yellow");

    log(`\n✓ All test data cleaned up successfully!`, "green");
  } catch (error) {
    log(`\n⚠ Cleanup warning: ${error}`, "yellow");
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log("\n");
  log("╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║         BHUTAN EDUSKILL - DATABASE TEST SUITE            ║", "cyan");
  log("║              Testing Neon PostgreSQL                      ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");

  const startTime = Date.now();

  await runTest("CONNECTION: Database", testConnection);
  await runTest("WRITE: Create School", testWriteSchool);
  await runTest("WRITE: Create User", testWriteUser);
  await runTest("WRITE: Create Class", testWriteClass);
  await runTest("WRITE: Create Homework", testWriteHomework);
  await runTest("PULL: Read School by ID", testPullSchool);
  await runTest("PULL: Read User with JOIN", testPullUser);
  await runTest("PULL: Read Multiple Records", testPullMultiple);
  await runTest("UPDATE: Modify School Name", testUpdateRecord);
  await runTest("COMPLEX: Multi-table JOIN", testComplexQuery);
  await runTest("AGGREGATE: Count Records", testAggregateQuery);

  await cleanupTestData();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  section("TEST SUMMARY");
  log(`Total Tests: ${results.passed.length + results.failed.length}`, "cyan");
  log(`Passed: ${results.passed.length}`, "green");
  log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? "red" : "green");
  log(`Duration: ${duration}s`, "blue");

  if (results.failed.length > 0) {
    log("\nFailed tests:", "red");
    results.failed.forEach((test) => log(`  - ${test}`, "red"));
  }

  log("\n✓ Database test suite completed!", results.failed.length === 0 ? "green" : "yellow");
  console.log("\n");

  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  log(`\nFatal error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
