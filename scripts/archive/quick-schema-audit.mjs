/**
 * Quick Schema Audit - Direct Database Query
 * Fast comparison of schema vs database without parsing TS files
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const sql = neon(process.env.DATABASE_URL);

// Known tables from schema (manual list for speed)
const KNOWN_TABLES = [
  'users', 'schools', 'classes', 'students', 'teachers', 'parents',
  'school_admin_applications', 'teacher_applications', 'student_applications',
  'assessments', 'career_matches', 'homework', 'attendance',
  'roles', 'user_roles', 'permissions', 'role_permissions',
  'invoices', 'subscriptions', 'payments',
  'library_books', 'library_members', 'library_circulation',
  'transport_routes', 'transport_allocations',
  'wizard_progress', 'ai_interactions'
];

// Timestamp columns to check for timezone issues
const TIMESTAMP_COLUMNS = {
  'school_admin_applications': ['payment_date', 'payment_verified_at', 'applied_at', 'reviewed_at', 'created_at', 'updated_at'],
  'teacher_applications': ['applied_at', 'reviewed_at', 'created_at', 'updated_at'],
  'users': ['created_at', 'updated_at'],
  'schools': ['created_at', 'updated_at'],
  'invoices': ['created_at', 'updated_at'],
};

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║           QUICK SCHEMA AUDIT - Database vs Schema           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

async function audit() {
  const issues = {
    missingTables: [],
    missingColumns: [],
    timezoneMismatches: [],
    extraColumns: [],
  };

  // 1. Check tables exist
  console.log('─── Checking Tables Exist ───');
  const dbTables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  `;

  const dbTableNames = new Set(dbTables.map(t => t.table_name));

  for (const table of KNOWN_TABLES) {
    if (dbTableNames.has(table)) {
      console.log(`  ✓ ${table}`);
    } else {
      console.log(`  ❌ ${table} - MISSING`);
      issues.missingTables.push(table);
    }
  }

  // 2. Check specific columns for known tables
  console.log('\n─── Checking Critical Columns ───');

  // school_admin_applications
  const saaColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'school_admin_applications'
    ORDER BY ordinal_position
  `;

  const saaColNames = new Set(saaColumns.map(c => c.column_name));
  const expectedSaaCols = ['id', 'user_id', 'school_id', 'status', 'payment_status',
    'payment_amount', 'payment_date', 'payment_method', 'payment_reference',
    'payment_verified_by', 'payment_verified_at', 'bank_reference_number',
    'applied_at', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'notes',
    'created_at', 'updated_at'];

  for (const col of expectedSaaCols) {
    if (saaColNames.has(col)) {
      console.log(`  ✓ school_admin_applications.${col}`);
    } else {
      console.log(`  ❌ school_admin_applications.${col} - MISSING`);
      issues.missingColumns.push({ table: 'school_admin_applications', column: col });
    }
  }

  // 3. Check timestamp timezone issues
  console.log('\n─── Checking Timestamp Timezone Issues ───');

  for (const [table, columns] of Object.entries(TIMESTAMP_COLUMNS)) {
    if (!dbTableNames.has(table)) continue;

    const tableColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = ${table}
    `;

    const colData = Object.fromEntries(tableColumns.map(c => [c.column_name, c.data_type]));

    for (const col of columns) {
      if (!colData[col]) continue;

      const hasTimezone = colData[col].includes('with time zone');
      const expectedWithTimezone = false; // Most columns use 'without'

      if (hasTimezone !== expectedWithTimezone) {
        const issue = hasTimezone
          ? `Has timezone but shouldn't`
          : `Missing timezone (expected 'with time zone')`;
        console.log(`  ⚠ ${table}.${col}: ${colData[col]} - ${issue}`);
        issues.timezoneMismatches.push({ table, column: col, current: colData[col] });
      } else {
        console.log(`  ✓ ${table}.${col}: ${colData[col]}`);
      }
    }
  }

  // 4. Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    AUDIT SUMMARY                             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`  Missing Tables:     ${issues.missingTables.length}`);
  console.log(`  Missing Columns:    ${issues.missingColumns.length}`);
  console.log(`  Timezone Issues:    ${issues.timezoneMismatches.length}`);
  console.log(`  Total Issues:       ${issues.missingTables.length + issues.missingColumns.length + issues.timezoneMismatches.length}\n`);

  // Generate SQL fixes
  if (issues.missingColumns.length > 0 || issues.timezoneMismatches.length > 0) {
    console.log('─── Suggested SQL Fixes ───\n');
    console.log('BEGIN;');

    for (const col of issues.missingColumns) {
      console.log(`ALTER TABLE "${col.table}" ADD COLUMN "${col.column}" TEXT;`);
    }

    console.log('\nCOMMIT;');
  }

  return issues;
}

audit().catch(console.error);