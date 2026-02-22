/**
 * PERMANENT JSON COLUMN FIX - Complete solution
 *
 * This script will:
 * 1. Find ALL text/USER-DEFINED columns that should be JSON based on schema analysis
 * 2. Drop defaults (if USER-DEFINED type)
 * 3. Convert to JSON using proper USING clause
 * 4. Restore defaults
 * 5. Generate a SQL file that can be applied manually if needed
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// All columns that should be JSON based on schema analysis
// This is the MASTER LIST - comprehensive and complete
const JSON_COLUMNS = {
  // assessment_questions
  'assessment_questions': ['question_data', 'options', 'correct_answer', 'explanation', 'tags'],

  // assessments
  'assessments': ['questions', 'time_limits', 'passing_score', 'max_attempts', 'tags', 'metadata'],

  // announcements
  'announcements': ['target_audience', 'attachments', 'metadata'],

  // applications
  'applications': ['documents', 'responses', 'notes', 'metadata'],

  // assignments
  'assignments': ['attachments', 'rubric', 'resources', 'tags'],

  // attendance
  'attendance': ['metadata', 'exceptions'],

  // bus_attendance
  'bus_attendance': ['route_details', 'exceptions'],

  // books
  'books': ['authors', 'categories', 'tags', 'metadata'],

  // career_plans
  'career_plans': ['short_term_goals', 'long_term_goals', 'milestones', 'action_steps', 'subjects', 'interests', 'skills'],

  // careers
  'careers': ['holland_codes', 'skills', 'subjects', 'rub_programs', 'tags', 'requirements', 'salary_ranges'],

  // classes
  'classes': ['students', 'schedule', 'subjects', 'tags'],

  // counselor_notes
  'counselor_notes': ['related_issues', 'interventions', 'follow_ups', 'tags', 'attachments'],

  // courses
  'courses': ['prerequisites', 'modules', 'resources', 'tags', 'metadata'],

  // disc_results
  'disc_results': ['traits', 'strengths', 'weaknesses', 'recommendations'],

  // events
  'events': ['attendees', 'resources', 'tags', 'metadata'],

  // exam_results_enhanced
  'exam_results_enhanced': ['subject_scores', 'comparisons', 'recommendations', 'metadata'],

  // fee_structures
  'fee_structures': ['components', 'late_fee_rules', 'discount_rules', 'installments'],

  // homework
  'homework': ['attachments', 'resources', 'tags', 'rubric'],

  // homework_submissions
  'homework_submissions': ['attachments', 'feedback', 'metadata'],

  // interventions
  'interventions': ['participants', 'action_items', 'resources', 'outcomes', 'tags'],

  // invoices
  'invoices': ['line_items', 'payments', 'metadata'],

  // lesson_plans
  'lesson_plans': ['objectives', 'activities', 'resources', 'assessment_methods', 'tags'],

  // library_transactions
  'library_transactions': ['metadata'],

  // mbti_results
  'mbti_results': ['preferences', 'strengths', 'careers', 'descriptions'],

  // notifications
  'notifications': ['target_audience', 'metadata', 'actions'],

  // parent_teacher_meetings
  'parent_teacher_meetings': ['attendees', 'agenda', 'notes', 'outcomes'],

  // rub_colleges
  'rub_colleges': ['programs', 'facilities', 'contact_info', 'deadlines', 'requirements'],

  // scholarships
  'scholarships': ['eligibility', 'benefits', 'requirements', 'documents', 'deadlines', 'tags'],

  // schools
  'schools': ['facilities', 'contact_info', 'social_media', 'metadata'],

  // student_progress
  'student_progress': ['milestones', 'assessments', 'achievements', 'notes', 'tags'],

  // subscriptions
  'subscriptions': ['features', 'addons', 'billing_info', 'metadata'],

  // teacher_logs
  'teacher_logs': ['activities', 'observations', 'recommendations', 'attachments'],

  // timetables
  'timetables': ['periods', 'breaks', 'working_days', 'exceptions', 'notes'],

  // users
  'users': ['interests', 'emergency_contact', 'parent_contact', 'permissions', 'metadata', 'preferences'],

  // wellness_records
  'wellness_records': ['factors', 'interventions', 'recommendations', 'tags', 'metrics'],

  // additional tables with JSON columns
  'behavior_logs': ['incidents', 'interventions', 'witnesses'],
  'counseling_sessions': ['notes', 'action_items', 'outcomes', 'tags'],
  'hostel_allocations': ['room_details', 'amenities', 'rules'],
  'transport_allocations': ['route_details', 'pickup_points', 'exceptions'],
  'id_cards': ['additional_info', 'permissions'],
  'leave_requests': ['attachments', 'approvals', 'notes'],
  'report_cards': ['subject_grades', 'attendance', 'remarks', 'achievements'],
};

async function permanentJSONFix() {
  console.log('=== PERMANENT JSON COLUMN FIX ===\n');

  const sqlStatements = [];
  const summary = {
    total: 0,
    fixed: 0,
    skipped: 0,
    errors: 0
  };

  // First, let's see what columns actually exist and their current types
  console.log('Scanning database for existing columns...\n');

  const allTables = Object.keys(JSON_COLUMNS);

  for (const tableName of allTables) {
    const columns = JSON_COLUMNS[tableName];

    // Check if table exists
    const tableCheck = await sql.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      );
    `);

    if (!tableCheck[0]?.exists) {
      console.log(`⊘ Table '${tableName}' does not exist - skipping`);
      summary.skipped += columns.length;
      continue;
    }

    // Check each column
    for (const columnName of columns) {
      summary.total++;

      const columnInfo = await sql.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        AND column_name = '${columnName}';
      `);

      if (columnInfo.length === 0) {
        console.log(`⊘ ${tableName}.${columnName} - Column does not exist`);
        summary.skipped++;
        continue;
      }

      const col = columnInfo[0];
      const currentType = col.data_type;

      if (currentType === 'json' || currentType === 'jsonb') {
        console.log(`✓ ${tableName}.${columnName} - Already JSON`);
        summary.skipped++;
        continue;
      }

      // Need to fix this column
      console.log(`\n→ Fixing ${tableName}.${columnName} (${currentType})`);

      try {
        // Handle USER-DEFINED types (arrays, enums)
        if (currentType === 'USER-DEFINED') {
          if (col.column_default !== null) {
            const dropDefaultSql = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`;
            console.log(`  - Dropping default...`);
            await sql.query(dropDefaultSql);
            sqlStatements.push(dropDefaultSql);
          }

          const alterSql = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DATA TYPE json USING COALESCE("${columnName}"::text::json, '[]'::json);`;
          console.log(`  - Converting to JSON...`);
          await sql.query(alterSql);
          sqlStatements.push(alterSql);

          // Restore default
          const restoreDefaultSql = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT '[]'::json;`;
          console.log(`  - Restoring default...`);
          await sql.query(restoreDefaultSql);
          sqlStatements.push(restoreDefaultSql);
        } else {
          // Regular text type
          const alterSql = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DATA TYPE json USING COALESCE("${columnName}"::json, '[]'::json);`;
          console.log(`  - Converting to JSON...`);
          await sql.query(alterSql);
          sqlStatements.push(alterSql);
        }

        console.log(`  ✓ Fixed!`);
        summary.fixed++;

      } catch (error) {
        console.log(`  ✗ Error: ${error.message.substring(0, 100)}`);
        summary.errors++;
      }
    }
  }

  // Write SQL to file for backup
  const sqlFile = './scripts/json-fix-backup.sql';
  fs.writeFileSync(sqlFile, sqlStatements.join('\n'));
  console.log(`\n\nSQL statements saved to: ${sqlFile}`);

  // Print summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total columns checked: ${summary.total}`);
  console.log(`Fixed: ${summary.fixed}`);
  console.log(`Skipped (already JSON or doesn't exist): ${summary.skipped}`);
  console.log(`Errors: ${summary.errors}`);
  console.log('\n=== DONE ===');

  return summary;
}

permanentJSONFix().catch(console.error);