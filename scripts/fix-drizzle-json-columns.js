/**
 * Fix ONLY the columns that Drizzle schema defines as JSON
 * These are the specific columns causing migration errors
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// Columns from Drizzle schema that should be JSON
// Only fix columns that are actually causing errors
const DRIZZLE_JSON_COLUMNS = [
  // From error messages and schema
  'assessment_types.target_audience',
  'counselor_resources.target_audience',
  'events.target_audience',
  'notices.target_audience',
  'school_events.target_audience',
  'hostel_facilities.available_days',
  'assessment_questions.question_data',
  'assessment_questions.options',
  'careers.holland_codes',
  'careers.skills',
  'careers.subjects',
  'careers.rub_programs',
  'rub_colleges.programs',
  'users.interests',
  'users.emergency_contact',
  'users.parent_contact',
  'notifications.target_audience',
  'counselor_notes.related_issues',
  'counselor_notes.tags',
  'counseling_sessions.tags',
  'counseling_sessions.action_items',
  'disc_results.strengths',
  'disc_results.weaknesses',
  'mbti_results.strengths',
  'mbti_results.weaknesses',
  'mbti_results.recommended_careers',
  'work_values_results.recommended_careers',
  'career_plans.subjects',
  'career_plans.short_term_goals',
  'career_plans.long_term_goals',
  'career_plans.milestones',
  'schools.facilities',
  'announcements.target_audience',
  'lesson_plans.objectives',
  'lesson_plans.activities',
  'lesson_plans.resources',
  'homework_submissions.feedback',
  'exam_results_enhanced.subjects',
  'teacher_applications.subjects',
  'tutors.subjects',
  'report_cards.subjects',
  'rub_programs.career_prospects',
  'rub_scholarship_applications.recommended_by',
  'tenants.settings',
  'parents.emergency_contact',
  'students.emergency_contact',
  'bcse_registrations.subjects',
  'user_roles.permissions',  // Special case
  'assessment_results.selected_option_id',
  'assessment_results.selected_option_text',
  'asset_assignments.item_id',
  'asset_assignments.item_name',
  'asset_disposal.item_id',
  'asset_disposal.item_name',
  'asset_maintenance.item_id',
  'asset_maintenance.item_name',
  'career_approvals.career_field',
  'career_approvals.career_match_id',
  'career_approvals.career_title',
  'career_matches.career_id',
  'career_matches.career_title',
  'career_plans.target_career',
  'career_plans.target_career_id',
  'digital_resources.tags',
  'library_books.tags',
  'student_interventions.tags',
  'student_portfolios.tags',
  'support_tickets.tags',
  'tuition_courses.tags',
  'learning_modules.tags',
  'counselor_resources.tags',
];

async function fixDrizzleJSONColumns() {
  console.log('=== FIXING DRIZZLE JSON COLUMNS ===\n');

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const columnRef of DRIZZLE_JSON_COLUMNS) {
    const [table, column] = columnRef.split('.');

    // Check current state
    const result = await sql.query(`
      SELECT data_type, udt_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = '${table}'
      AND column_name = '${column}';
    `);

    if (result.length === 0) {
      console.log(`⊘ ${table}.${column} - doesn't exist`);
      skipped++;
      continue;
    }

    const currentType = result[0].data_type;
    const udtName = result[0].udt_name;
    const hasDefault = result[0].column_default !== null;

    if (currentType === 'json' || currentType === 'jsonb' || udtName === 'json' || udtName === 'jsonb') {
      console.log(`✓ ${table}.${column} - already JSON`);
      skipped++;
      continue;
    }

    console.log(`\n→ ${table}.${column} (${currentType})`);

    try {
      // Clean data
      await sql.query(`
        UPDATE "${table}"
        SET "${column}" = CASE
          WHEN "${column}" IS NULL THEN '[]'
          WHEN "${column}" = '' THEN '[]'
          WHEN "${column}"::text = 'none' THEN '[]'
          WHEN "${column}"::text = 'all' THEN '[]'
          WHEN "${column}"::text NOT LIKE '{%' AND "${column}"::text NOT LIKE '[' THEN '[]'
          ELSE "${column}"
        END;
      `);

      // Drop default if exists
      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
      }

      // Convert to JSON
      await sql.query(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
        USING COALESCE("${column}"::json, '[]'::json);
      `);

      // Restore default
      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      }

      console.log(`  ✓ Fixed!`);
      fixed++;

    } catch (error) {
      const errorMsg = error.message;

      // Try with object default for single-value fields
      if (errorMsg.includes('invalid input syntax')) {
        try {
          console.log(`  - Retrying with {} default...`);

          await sql.query(`
            UPDATE "${table}" SET "${column}" = '{}' WHERE "${column}" IS NULL OR "${column}" = '';
          `);

          if (hasDefault) {
            await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
          }

          await sql.query(`
            ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
            USING COALESCE("${column}"::json, '{}'::json);
          `);

          if (hasDefault) {
            await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '{}'::json;`);
          }

          console.log(`  ✓ Fixed (with {})`);
          fixed++;

        } catch (error2) {
          console.log(`  ✗ Error: ${error2.message.substring(0, 80)}`);
          errors++;
        }
      } else {
        console.log(`  ✗ Error: ${errorMsg.substring(0, 80)}`);
        errors++;
      }
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('\n=== DONE ===');
}

fixDrizzleJSONColumns().catch(console.error);
