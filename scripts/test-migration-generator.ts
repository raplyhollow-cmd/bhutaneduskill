/**
 * Migration Generator Test Script
 *
 * Tests the unified architecture's migration generator
 * by generating SQL from feature definitions.
 */

import { generateFeatureMigration, generateFullMigration } from "../src/lib/features/define-feature";
import { AttendanceFeature } from "../src/features/attendance.feature";
import { StudentFeature } from "../src/features/students.feature";
import { TeacherFeature } from "../src/features/teachers.feature";
import { ClassFeature } from "../src/features/classes.feature";
import { SubjectFeature } from "../src/features/subjects.feature";
import { SchoolFeature } from "../src/features/schools.feature";
import { AssessmentFeature } from "../src/features/assessments.feature";

// Features collection
const features = {
  students: StudentFeature,
  teachers: TeacherFeature,
  classes: ClassFeature,
  subjects: SubjectFeature,
  schools: SchoolFeature,
  assessments: AssessmentFeature,
  attendance: AttendanceFeature,
};

console.log("=".repeat(80));
console.log("MIGRATION GENERATOR TEST");
console.log("=".repeat(80));
console.log();

// Test 1: Generate migration for Attendance Feature only
console.log("-".repeat(80));
console.log("TEST 1: Single Feature Migration (Attendance)");
console.log("-".repeat(80));
console.log();

const attendanceMigration = generateFeatureMigration(AttendanceFeature.config);
console.log(attendanceMigration);

console.log();
console.log("-".repeat(80));
console.log("TEST 2: Single Feature Migration (Students)");
console.log("-".repeat(80));
console.log();

const studentMigration = generateFeatureMigration(StudentFeature.config);
console.log(studentMigration);

console.log();
console.log("-".repeat(80));
console.log("TEST 3: Full Migration (All Features)");
console.log("-".repeat(80));
console.log();

const fullMigration = generateFullMigration(features);
console.log(fullMigration);

console.log();
console.log("=".repeat(80));
console.log("TEST COMPLETE");
console.log("=".repeat(80));
