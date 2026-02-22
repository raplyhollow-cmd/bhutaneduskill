/**
 * MASTER SCRIPT - Fix ALL JSON columns in the database
 * This combines all previous fixes into one comprehensive solution
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function masterFix() {
  console.log('=== MASTER FIX - ALL JSON COLUMNS ===\n');

  // Part 1: Fix known JSON columns from schema files
  console.log('Part 1: Fixing known schema columns...\n');

  const knownFixes = {
    'schools': ['facilities'],
    'school_settings': ['working_days'],
    'academic_years': ['terms'],
    'grade_configurations': ['grades'],
    'bell_schedules': ['periods'],
    'classes': ['students'],
    'assessment_questions': ['question_data', 'options'],
    'assessment_types': ['results'],
    'assessment_results': ['answers', 'text_answers'],
    'homework': ['attachments'],
    'lesson_plans': ['questions', 'attachments', 'schedule', 'tags', 'requirements', 'prerequisites'],
    'teacher_logs': ['content'],
    'announcements': ['target_class_ids', 'target_user_ids'],
    'notifications': ['target_audience', 'reminders', 'attachments'],
    'bus_attendance': ['pickup_location', 'drop_location'],
    'vehicles': ['metadata'],
    'users': ['interests', 'emergency_contact', 'parent_contact'],
    'careers': ['holland_codes', 'skills', 'subjects', 'rub_programs'],
    'career_plans': ['short_term_goals', 'long_term_goals', 'subjects', 'milestones', 'action_steps'],
    'college_programs': ['metadata'],
    'scholarships': ['metadata'],
    'career_opportunities': ['subjects', 'qualifications', 'availability', 'grade_levels'],
    'riasec_results': ['scores', 'recommended_careers'],
    'aptitude_results': ['scores', 'strengths', 'weaknesses', 'recommended_careers'],
    'personality_results': ['scores', 'strengths', 'weaknesses', 'recommended_careers'],
    'interest_inventory_results': ['top_values', 'recommended_careers'],
    'skill_assessments': ['recommendations'],
    'courses': ['content', 'tags', 'objectives', 'prerequisites'],
    'student_progress': ['completed_lessons'],
    'fee_structures': ['assigned_classes', 'assigned_grades', 'breakdown', 'fees'],
    'invoices': ['metadata'],
    'subscriptions': ['metadata'],
    'fee_payments': ['payment_details'],
    'counselor_sessions': ['notes', 'attachments', 'tags'],
    'intervention_plans': ['strategies', 'progress'],
    'intervention_sessions': ['responses'],
    'wellness_records': ['tags'],
    'ai_interactions': ['interaction_data', 'metadata'],
    'platform_analytics': ['growth_data', 'revenue_data', 'activity_data'],
    'report_templates': ['layout', 'colors', 'custom_sections', 'signatures'],
    'generated_reports': ['attachments', 'acknowledgements'],
    'meeting_notes': ['attachments'],
    'training_programs': ['eligibility_criteria', 'benefits', 'documents_required', 'metadata'],
    'syllabi': ['structured_data', 'required_subjects', 'aggregate_requirements'],
    'health_records': ['symptoms', 'medications_prescribed', 'dietary_restrictions'],
    'tutors': ['specialties', 'subjects'],
    'parent_links': ['phone_numbers'],
    'parent_invitations': ['config'],
    'behavior_logs': ['behavior_tags'],
    'counselor_interventions': ['strategies'],
    'roadmap_progress': ['milestone_status'],
    'student_portfolios': ['content', 'attachments', 'tags'],
    'rub_colleges': ['programs'],
    'rub_programs': ['reserved_seats', 'required_subjects', 'eligibility_criteria'],
    'counselor_notes': ['tags', 'action_items', 'content'],
    'counselor_resources': ['tags', 'content'],
    'learning_modules': ['tags', 'content'],
    'library_books': ['tags'],
    'tuition_courses': ['tags', 'requirements', 'schedule'],
    'forums': ['tags'],
    'documents': ['tags'],
    'bookmarks': ['tags'],
  };

  let fixedCount = 0;
  let errorCount = 0;

  for (const [table, columns] of Object.entries(knownFixes)) {
    for (const column of columns) {
      try {
        let usingClause;
        if (column.includes('data') || column.includes('metadata') ||
            column.includes('content') || column.includes('config') ||
            column.includes('layout') || column.includes('colors') ||
            column.includes('signatures') || column.includes('location') ||
            column.includes('schedule') || column.includes('structure') ||
            column.includes('contact') && !column.includes('phone')) {
          usingClause = `COALESCE(${column}::json, '{}'::json)`;
        } else {
          usingClause = `COALESCE(${column}::json, '[]'::json)`;
        }

        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING ${usingClause};`);
        fixedCount++;
        process.stdout.write(`\r✓ ${fixedCount} `);
      } catch (error) {
        if (!error.message.includes('does not exist') && !error.message.includes('already')) {
          errorCount++;
        }
      }
    }
  }

  // Part 2: Database-driven scan for any remaining text columns that should be JSON
  console.log('\n\nPart 2: Database-driven scan for remaining columns...\n');

  const result = await sql.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND (
      column_name LIKE '%data%' OR
      column_name LIKE '%metadata%' OR
      column_name LIKE '%content%' OR
      column_name LIKE '%config%' OR
      column_name LIKE '%tags%' OR
      column_name LIKE '%items%' OR
      column_name LIKE '%options%' OR
      column_name LIKE '%response%'
    )
    AND data_type IN ('text', 'USER-DEFINED')
    ORDER BY table_name, column_name;
  `);

  for (const row of result) {
    const table = row.table_name;
    const column = row.column_name;

    try {
      // For user-defined types, drop default first
      await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);

      let usingClause;
      if (column.includes('tags') || column.includes('items') ||
          column.includes('options') || column.includes('response')) {
        usingClause = `COALESCE(${column}::text::json, '[]'::json)`;
      } else {
        usingClause = `COALESCE(${column}::text::json, '{}'::json)`;
      }

      await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING ${usingClause};`);

      // Set default back for arrays
      if (column.includes('tags') || column.includes('items') || column.includes('options')) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      }

      fixedCount++;
      process.stdout.write(`\r✓ ${fixedCount} `);
    } catch (error) {
      if (!error.message.includes('already') && !error.message.includes('42801')) {
        errorCount++;
      }
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Total Fixed: ${fixedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('\n=== DONE ===');
}

masterFix().catch(console.error);
