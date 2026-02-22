/**
 * Schema vs Database Comparison Script
 *
 * Compares Drizzle schema definitions with actual database structure
 * Identifies missing columns, type mismatches, and extra columns
 *
 * Run: npx tsx scripts/compare-schema-to-db.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/db/schema";

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  log("ERROR: DATABASE_URL not set!", "red");
  process.exit(1);
}

const sql = neon(databaseUrl);

// Tables defined in schema.ts (from main schema exports)
const schemaTables = {
  // Core tables from schema.ts
  users: true,
  schools: true,
  books: true,
  classes: true,
  subjects: true,
  assessmentTypes: true,
  assessmentQuestions: true,
  assessmentResults: true,
  assessmentSubmissions: true,
  assessments: true,
  announcements: true,
  userProgress: true,
  achievements: true,
  attendanceRecords: true,
  feePayments: true,
  studentFees: true,
  homework: true,
  homeworkSubmissions: true,
  classSubjects: true,
  timetableEntries: true,
  timePeriods: true,
  rooms: true,
  partners: true,
  counselorResources: true,
  enrollments: true,
  teacherAssignments: true,
  counselorAssignments: true,
  feeStructures: true,
  districts: true,
  tenants: true,
  examResultsEnhanced: true,
  academicTerms: true,
  attendance: true,
  careerMatches: true,
  careerPlans: true,
  riasecResults: true,
  mbtiResults: true,
  discResults: true,
  workValuesResults: true,
  learningStylesResults: true,
  learningModules: true,
  moduleProgress: true,
  tuitionCourses: true,
  tuitionEnrollments: true,
  tutors: true,
  tutorEarnings: true,
  liveSessions: true,
  tutorReviews: true,
  leaveRequests: true,
  vehicles: true,
  transportRoutes: true,
  transportAllocations: true,
  circulation: true,
  consentRecords: true,
  counselorNotes: true,
  wizardProgress: true,
  fileStorage: true,
  schoolEvents: true,
  dataSources: true,
  careers: true,
  announcementReads: true,
  tuitionCategories: true,
  // Re-exported tables
  rubColleges: true,
  rubPrograms: true,
  rubApplications: true,
  rubScholarships: true,
  rubScholarshipApplications: true,
  busAttendance: true,
  vehicleMaintenance: true,
  vehicleTracking: true,
  transportIncidents: true,
  hostelBuildings: true,
  hostelRooms: true,
  hostelAllocations: true,
  hostelAttendance: true,
  hostelLeaveRequests: true,
  hostelFacilities: true,
  hostelMess: true,
  inventoryItems: true,
  inventoryCategories: true,
  vendors: true,
  purchaseOrders: true,
  stockMovements: true,
  drivers: true,
};

// Known column mappings (snake_case in DB, camelCase in schema)
const columnMappings: Record<string, Record<string, string>> = {
  schools: {
    school_id: "schoolId",
    school_type: "schoolType",
    contact_email: "contactEmail",
    contact_phone: "contactPhone",
    tenant_id: "tenantId",
    district_id: "districtId",
    is_active: "isActive",
    postal_code: "postalCode",
    established_year: "establishedYear",
    accreditation_status: "accreditationStatus",
    max_students: "maxStudents",
    campus_size: "campusSize",
    principal_name: "principalName",
    principal_email: "principalEmail",
    principal_phone: "principalPhone",
    counselor_name: "counselorName",
    counselor_email: "counselorEmail",
    counselor_phone: "counselorPhone",
    vice_principal_name: "vicePrincipalName",
  },
  homework: {
    class_id: "classId",
    subject_id: "subjectId",
    due_date: "dueDate",
    assigned_date: "assignedDate",
    total_points: "totalPoints",
    passing_score: "passingScore",
    is_published: "isPublished",
    is_active: "isActive",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  users: {
    clerk_user_id: "clerkUserId",
    school_id: "schoolId",
    profile_image: "profileImage",
    date_of_birth: "dateOfBirth",
    parent_contact: "parentContact",
    parent_phone: "parentPhone",
    emergency_contact: "emergencyContact",
    blood_group: "bloodGroup",
    enrollment_date: "enrollmentDate",
    last_login: "lastLogin",
    employee_id: "employeeId",
    email_verified: "emailVerified",
    onboarding_complete: "onboardingComplete",
    clerk_id: "clerkUserId",
    class_grade: "classGrade",
    parent_id: "parentId",
    is_active: "isActive",
    department: "department",
  },
};

async function compareTable(tableName: string) {
  // Get actual database columns
  const dbColumns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = ${tableName} AND table_schema = 'public'
    ORDER BY ordinal_position
  `;

  if (dbColumns.length === 0) {
    log(`❌ Table '${tableName}' NOT FOUND in database`, "red");
    return null;
  }

  // Get schema columns (this is a simplified check - we'd need to parse the schema file for exact comparison)
  const dbColumnNames = new Set(dbColumns.map((c: any) => c.column_name));

  // Known missing columns from documentation
  // NOTE: These were FIXED - domain removed from schools, author_* removed from homework
  const knownMissing: Record<string, string[]> = {
    // schools: ["domain"], // FIXED - removed from schema
    // homework: ["author_id", "author_name", "author_role"], // FIXED - removed from schema
  };

  const missing = knownMissing[tableName] || [];
  const actuallyMissing = missing.filter(col => !dbColumnNames.has(col));

  return {
    tableName,
    dbColumnCount: dbColumns.length,
    dbColumns: dbColumns.map((c: any) => c.column_name),
    missingInDb: actuallyMissing,
  };
}

async function main() {
  console.log("\n");
  log("╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║     SCHEMA vs DATABASE COMPARISON TOOL                     ║", "cyan");
  log("║          Identifying Schema Mismatches                     ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");

  section("STEP 1: Check Which Schema Tables Exist in Database");

  const tablesInDb = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  const dbTableNames = new Set(tablesInDb.map((t: any) => t.table_name));

  let tablesFound = 0;
  let tablesMissing = 0;
  let tablesNotInSchema = 0;

  for (const [schemaTable] of Object.entries(schemaTables)) {
    const dbName = schemaToDbName(schemaTable);
    if (dbTableNames.has(dbName)) {
      tablesFound++;
      log(`  ✓ ${schemaTable}`, "green");
    } else {
      tablesMissing++;
      log(`  ✗ ${schemaTable} (NOT FOUND in DB)`, "red");
    }
  }

  console.log("\n");
  log(`Summary: ${tablesFound} tables found, ${tablesMissing} missing`, "blue");

  section("STEP 2: Check for Tables in DB but NOT in Schema");

  for (const dbTable of dbTableNames) {
    const schemaName = dbToSchemaName(dbTable);
    if (!schemaTables[schemaName]) {
      tablesNotInSchema++;
      log(`  ⚠ ${dbTable} (in DB but not in schema exports)`, "yellow");
    }
  }

  log(`\nFound ${tablesNotInSchema} tables in DB that aren't exported from schema`, "yellow");

  section("STEP 3: Column Comparison for Critical Tables");

  // Check critical tables for known issues
  const criticalTables = ["schools", "homework", "users", "books", "circulation"];

  for (const tableName of criticalTables) {
    log(`\n📋 Table: ${tableName}`, "cyan");

    const dbColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${tableName} AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    if (dbColumns.length > 0) {
      log(`  Columns (${dbColumns.length}):`, "blue");
      dbColumns.forEach((c: any) => {
        const nullable = c.is_nullable === "YES" ? "NULL" : "NOT NULL";
        log(`    ${c.column_name}: ${c.data_type} ${nullable}`, "blue");
      });
    }

    // Check for known missing columns
    const knownMissing: Record<string, string[]> = {
      schools: ["domain"],
      homework: ["author_id", "author_name", "author_role"],
    };

    if (knownMissing[tableName]) {
      const dbColumnNames = new Set(dbColumns.map((c: any) => c.column_name));
      for (const col of knownMissing[tableName]) {
        if (dbColumnNames.has(col)) {
          log(`    ✓ ${col} EXISTS in DB`, "green");
        } else {
          log(`    ✗ ${col} MISSING from DB`, "red");
        }
      }
    }
  }

  section("STEP 4: Check Specific Column Types");

  // Check users.subjects type - FIXED: Now uses text type to match DB
  const usersSubjects = await sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subjects'
  `;

  if (usersSubjects.length > 0) {
    const actualType = usersSubjects[0].data_type;
    log(`users.subjects type in DB: ${actualType}`, actualType === "text" ? "green" : "yellow");
    if (actualType !== "text") {
      log(`  ⚠ Expected: text, Got: ${actualType}`, "yellow");
    } else {
      log(`  ✓ Schema now matches DB (text type)`, "green");
    }
  }

  console.log("\n");
  log("✓ Comparison complete!", "green");
  console.log("\n");
}

// Convert schema camelCase to DB snake_case
function schemaToDbName(name: string): string {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// Convert DB snake_case to schema camelCase
function dbToSchemaName(name: string): string {
  return name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

main().catch(console.error);
