/**
 * Database Test Script
 *
 * Tests database operations: WRITE, PULL (QUERY), READ
 *
 * Run: npx tsx scripts/test-database.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/db/schema";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  log("\nPlease set up your .env file with a valid Neon PostgreSQL connection string.", "yellow");
  log("\nExample: DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require", "cyan");
  process.exit(1);
}

const neonClient = neon(databaseUrl, {
  fetchOptions: {
    cache: "no-store",
  },
});

export const db = drizzle(neonClient, { schema });

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

  try {
    // Simple query to test connection
    const result = await neonClient`SELECT NOW() as current_time`;
    log(`✓ Database connected successfully!`, "green");
    log(`  Server time: ${result[0].current_time}`, "blue");
    return true;
  } catch (error) {
    log(`✗ Connection failed: ${error}`, "red");
    return false;
  }
}

async function testWriteSchool() {
  section("TEST 2: WRITE - Create School");

  const newSchool = {
    id: testSchoolId,
    name: "Test School for Database Validation",
    code: `TEST-${Date.now()}`,
    type: "private",
    address: "123 Test Street",
    city: "Thimphu",
    state: "Thimphu",
    country: "Bhutan",
    postalCode: "11001",
    phone: "+975-1234567",
    email: "test@school.bt",
    website: "https://testschool.bt",
    logo: "",
    establishedYear: 2020,
    accreditationStatus: "accredited",
    maxStudents: 500,
    campusSize: "5 acres",
    facilities: ["library", "lab", "sports"],
    board: "BCSE",
    principalName: "Test Principal",
    principalEmail: "principal@testschool.bt",
    principalPhone: "+975-1234568",
    counselorName: "Test Counselor",
    counselorEmail: "counselor@testschool.bt",
    counselorPhone: "+975-1234569",
    vicePrincipalName: "Test Vice Principal",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.schools).values(newSchool);

  log(`✓ School created with ID: ${testSchoolId}`, "green");
  log(`  Name: ${newSchool.name}`, "blue");
  log(`  Code: ${newSchool.code}`, "blue");
}

async function testWriteUser() {
  section("TEST 3: WRITE - Create User (Student)");

  const newUser = {
    id: testUserId,
    clerkUserId: `clerk_test_${Date.now()}`,
    type: "student",
    role: "student",
    name: "Test Student",
    firstName: "Test",
    lastName: "Student",
    email: `test${Date.now()}@student.bt`,
    phone: "+975-9876543",
    schoolId: testSchoolId,
    profileImage: "",
    dateOfBirth: "2010-01-01",
    gender: "other",
    grade: 10,
    section: "A",
    rollNumber: "1",
    address: "456 Student Lane",
    city: "Thimphu",
    state: "Thimphu",
    postalCode: "11001",
    country: "Bhutan",
    parentContact: "Test Parent",
    parentPhone: "+975-1111111",
    emergencyContact: "Test Emergency",
    bloodGroup: "O+",
    enrollmentDate: "2024-01-01",
    lastLogin: new Date().toISOString(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.users).values(newUser);

  log(`✓ User created with ID: ${testUserId}`, "green");
  log(`  Name: ${newUser.name}`, "blue");
  log(`  Email: ${newUser.email}`, "blue");
}

async function testWriteClass() {
  section("TEST 4: WRITE - Create Class");

  const newClass = {
    id: testClassId,
    name: "Test Class 10A",
    grade: 10,
    section: "A",
    schoolId: testSchoolId,
    homeroomTeacherId: testUserId,
    homeroomTeacherName: "Test Teacher",
    classTeacherId: testUserId,
    classTeacherName: "Test Teacher",
    teacherId: testUserId,
    academicYear: "2024-2025",
    roomNumber: "101",
    capacity: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.classes).values(newClass);

  log(`✓ Class created with ID: ${testClassId}`, "green");
  log(`  Name: ${newClass.name}`, "blue");
}

async function testWriteHomework() {
  section("TEST 5: WRITE - Create Homework");

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const assignedDate = new Date();

  const newHomework = {
    id: testHomeworkId,
    title: "Test Mathematics Assignment",
    description: "Solve problems 1-10 from Chapter 5",
    classId: testClassId,
    dueDate: dueDate.toISOString(),
    assignedDate: assignedDate.toISOString(),
    totalPoints: 100,
    passingScore: 60,
    authorId: testUserId,
    authorName: "Test Teacher",
    authorRole: "teacher",
    isPublished: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.homework).values(newHomework);

  log(`✓ Homework created with ID: ${testHomeworkId}`, "green");
  log(`  Title: ${newHomework.title}`, "blue");
  log(`  Due Date: ${newHomework.dueDate}`, "blue");
}

async function testPullSchool() {
  section("TEST 6: PULL (QUERY) - Read School by ID");

  const school = await db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.id, testSchoolId))
    .limit(1);

  if (school.length === 0) {
    throw new Error("School not found!");
  }

  log(`✓ School retrieved successfully!`, "green");
  log(`  ID: ${school[0].id}`, "blue");
  log(`  Name: ${school[0].name}`, "blue");
  log(`  Type: ${school[0].type}`, "blue");
  log(`  City: ${school[0].city}`, "blue");
  log(`  Active: ${school[0].isActive}`, "blue");
}

async function testPullUser() {
  section("TEST 7: PULL (QUERY) - Read User by ID");

  const user = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      type: schema.users.type,
      grade: schema.users.grade,
      schoolName: schema.schools.name,
    })
    .from(schema.users)
    .leftJoin(schema.schools, eq(schema.users.schoolId, schema.schools.id))
    .where(eq(schema.users.id, testUserId))
    .limit(1);

  if (user.length === 0) {
    throw new Error("User not found!");
  }

  log(`✓ User retrieved successfully with JOIN!`, "green");
  log(`  ID: ${user[0].id}`, "blue");
  log(`  Name: ${user[0].name}`, "blue");
  log(`  Email: ${user[0].email}`, "blue");
  log(`  Type: ${user[0].type}`, "blue");
  log(`  Grade: ${user[0].grade}`, "blue");
  log(`  School: ${user[0].schoolName || "N/A"}`, "blue");
}

async function testPullMultiple() {
  section("TEST 8: PULL (QUERY) - Read Multiple Records");

  // Get all classes for the school
  const classes = await db
    .select()
    .from(schema.classes)
    .where(eq(schema.classes.schoolId, testSchoolId));

  log(`✓ Retrieved ${classes.length} class(es) for school`, "green");
  classes.forEach((cls) => {
    log(`  - ${cls.name} (Grade ${cls.grade}-${cls.section})`, "blue");
  });

  // Get all homework for the class
  const homework = await db
    .select()
    .from(schema.homework)
    .where(eq(schema.homework.classId, testClassId));

  log(`✓ Retrieved ${homework.length} homework assignment(s)`, "green");
  homework.forEach((hw) => {
    log(`  - ${hw.title} (Due: ${hw.dueDate})`, "blue");
  });
}

async function testUpdateRecord() {
  section("TEST 9: UPDATE - Modify School Name");

  const newName = `Updated Test School ${Date.now()}`;

  await db
    .update(schema.schools)
    .set({
      name: newName,
      updatedAt: new Date(),
    })
    .where(eq(schema.schools.id, testSchoolId));

  // Verify the update
  const updated = await db
    .select({ name: schema.schools.name })
    .from(schema.schools)
    .where(eq(schema.schools.id, testSchoolId))
    .limit(1);

  if (updated[0].name !== newName) {
    throw new Error("Update verification failed!");
  }

  log(`✓ School name updated successfully!`, "green");
  log(`  New name: ${newName}`, "blue");
}

async function testComplexQuery() {
  section("TEST 10: COMPLEX QUERY - User with Classes and Homework");

  const result = await db
    .select({
      user: {
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      },
      classes: {
        id: schema.classes.id,
        name: schema.classes.name,
        grade: schema.classes.grade,
      },
      school: {
        name: schema.schools.name,
        city: schema.schools.city,
      },
    })
    .from(schema.users)
    .innerJoin(schema.schools, eq(schema.users.schoolId, schema.schools.id))
    .innerJoin(schema.classes, eq(schema.classes.schoolId, schema.schools.id))
    .where(eq(schema.users.id, testUserId))
    .limit(5);

  log(`✓ Complex JOIN query executed successfully!`, "green");
  log(`  Found ${result.length} record(s)`, "blue");
  result.forEach((row) => {
    log(`  User: ${row.user.name} | Class: ${row.classes.name} | School: ${row.school.name}`, "blue");
  });
}

async function testAggregateQuery() {
  section("TEST 11: AGGREGATE - Count Records");

  // Count users by type
  const userCounts = await neonClient`
    SELECT type, COUNT(*) as count
    FROM users
    GROUP BY type
  `;

  log(`✓ User count by type:`, "green");
  userCounts.forEach((row: any) => {
    log(`  ${row.type}: ${row.count}`, "blue");
  });

  // Count schools
  const schoolCount = await neonClient`
    SELECT COUNT(*) as count FROM schools
  `;

  log(`✓ Total schools: ${schoolCount[0].count}`, "green");
}

async function cleanupTestData() {
  section("CLEANUP: Removing Test Data");

  try {
    // Delete in reverse order of dependencies
    await db.delete(schema.homework).where(eq(schema.homework.id, testHomeworkId));
    log(`✓ Deleted homework`, "yellow");

    await db.delete(schema.classes).where(eq(schema.classes.id, testClassId));
    log(`✓ Deleted class`, "yellow");

    await db.delete(schema.users).where(eq(schema.users.id, testUserId));
    log(`✓ Deleted user`, "yellow");

    await db.delete(schema.schools).where(eq(schema.schools.id, testSchoolId));
    log(`✓ Deleted school`, "yellow");

    log(`\n✓ All test data cleaned up successfully!`, "green");
  } catch (error) {
    log(`\n⚠ Cleanup warning: ${error}`, "yellow");
    log(`  You may need to manually delete test records with IDs:`, "yellow");
    log(`  - School: ${testSchoolId}`, "yellow");
    log(`  - User: ${testUserId}`, "yellow");
    log(`  - Class: ${testClassId}`, "yellow");
    log(`  - Homework: ${testHomeworkId}`, "yellow");
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

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Run all tests
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

  // Cleanup
  await cleanupTestData();

  // Print summary
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

// Import eq for queries
import { eq } from "drizzle-orm";

// Run the tests
main().catch((error) => {
  log(`\nFatal error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
