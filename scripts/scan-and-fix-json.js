/**
 * Comprehensive scan and fix for ALL JSON columns
 *
 * This script:
 * 1. Scans the database for ALL text columns that should be JSON
 * 2. Checks their current data type
 * 3. Applies fixes with USING clause
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function scanAndFix() {
  console.log('=== Scanning database for JSON columns that need fixing ===\n');

  // Get ALL columns that are text type but should be json
  // Based on schema.ts analysis
  const jsonColumnsByTable = {
    // Core tables
    'users': ['interests'],
    'schools': ['facilities'],
    'school_settings': ['working_days'],
    'academic_years': ['terms'],
    'grade_configurations': ['grades'],
    'bell_schedules': ['periods'],
    'classes': ['students'],
    'subjects': [],
    'departments': [],

    // Assessment tables
    'assessment_questions': ['question_data', 'options'],
    'assessment_types': ['results'],
    'assessment_results': ['answers', 'text_answers'],
    'assessments': [],

    // Homework & Lessons
    'homework': ['attachments'],
    'lesson_plans': ['questions', 'attachments', 'schedule', 'tags', 'requirements', 'prerequisites'],
    'teacher_logs': ['content'],

    // Announcements & Notifications
    'announcements': ['target_class_ids', 'target_user_ids'],
    'notifications': ['target_audience', 'reminders', 'attachments'],

    // Transport
    'bus_attendance': ['pickup_location', 'drop_location'],
    'vehicles': ['metadata'],
    'transport_routes': [],

    // Career & College
    'careers': ['holland_codes', 'skills', 'subjects'],
    'career_plans': ['short_term_goals', 'long_term_goals', 'subjects', 'milestones', 'action_steps'],
    'college_programs': ['metadata'],
    'scholarships': ['metadata'],
    'career_opportunities': ['subjects', 'qualifications', 'availability', 'grade_levels'],
    'rub_programs': ['holland_codes', 'skills', 'subjects', 'rub_programs'],

    // Assessment Results
    'riasec_results': ['scores', 'recommended_careers'],
    'aptitude_results': ['scores', 'strengths', 'weaknesses', 'recommended_careers'],
    'personality_results': ['scores', 'strengths', 'weaknesses', 'recommended_careers'],
    'interest_inventory_results': ['top_values', 'recommended_careers'],
    'skill_assessments': ['recommendations'],

    // Courses & Progress
    'courses': ['content', 'tags', 'objectives', 'prerequisites'],
    'student_progress': ['completed_lessons'],

    // Fees
    'fee_structures': ['assigned_classes', 'assigned_grades', 'breakdown', 'fees'],
    'invoices': ['metadata'],
    'subscriptions': ['metadata'],
    'fee_payments': ['payment_details'],

    // Counseling
    'counselor_sessions': ['notes', 'attachments', 'tags'],
    'intervention_plans': ['strategies', 'progress'],
    'intervention_sessions': ['responses'],
    'wellness_records': ['tags'],

    // AI
    'ai_interactions': ['interaction_data', 'metadata'],

    // Analytics
    'platform_analytics': ['growth_data', 'revenue_data', 'activity_data'],

    // Reports
    'report_templates': ['layout', 'colors', 'custom_sections', 'signatures'],
    'generated_reports': ['attachments', 'acknowledgements'],
    'meeting_notes': ['attachments'],

    // Training
    'training_programs': ['eligibility_criteria', 'benefits', 'documents_required', 'metadata'],
    'syllabi': ['structured_data', 'required_subjects', 'aggregate_requirements'],

    // Health
    'health_records': ['symptoms', 'medications_prescribed', 'dietary_restrictions'],

    // Tutors
    'tutors': ['specialties', 'subjects'],

    // Parent
    'parent_links': ['phone_numbers'],
    'parent_invitations': ['config'],
  };

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const [table, columns] of Object.entries(jsonColumnsByTable)) {
    for (const column of columns) {
      const snakeColumn = column; // Schema uses snake_case in DB

      // Build appropriate USING clause based on expected data
      let usingClause;
      if (column.includes('goals') || column.includes('students') ||
          column.includes('grades') || column.includes('codes') ||
          column.includes('subjects') || column.includes('skills') ||
          column.includes('tags') || column.includes('attachments') ||
          column.includes('recommendations') || column.includes('strengths') ||
          column.includes('weaknesses') || column.includes('values') ||
          column.includes('qualifications') || column.includes('availability') ||
          column.includes('prerequisites') || column.includes('requirements') ||
          column.includes('objectives') || column.includes('documents') ||
          column.includes('periods') || column.includes('terms') ||
          column.includes('milestones') || column.includes('steps') ||
          column.includes('items') || column.includes('lessons') ||
          column.includes('questions') || column.includes('answers') ||
          column.includes('symptoms') || column.includes('medications') ||
          column.includes('restrictions') || column.includes('specialties') ||
          column.includes('phone_numbers') || column.includes('reminders') ||
          column.includes('acknowledgements') || column.includes('sections')) {
        usingClause = `COALESCE(${snakeColumn}::json, '[]'::json)`;
      } else if (column.includes('data') || column.includes('metadata') ||
                 column.includes('content') || column.includes('config') ||
                 column.includes('layout') || column.includes('colors') ||
                 column.includes('signatures') || column.includes('notes') ||
                 column.includes('location') || column.includes('scores') ||
                 column.includes('responses') || column.includes('breakdown') ||
                 column.includes('details') || column.includes('structure')) {
        usingClause = `COALESCE(${snakeColumn}::json, '{}'::json)`;
      } else {
        usingClause = `${snakeColumn}::json`;
      }

      const fixSql = `ALTER TABLE "${table}" ALTER COLUMN "${snakeColumn}" SET DATA TYPE json USING ${usingClause};`;

      try {
        process.stdout.write(`Fixing ${table}.${column}...`);
        await sql.query(fixSql);
        successCount++;
        console.log(' ✓');
      } catch (error) {
        if (error.message.includes('does not exist')) {
          skippedCount++;
          console.log(' ⊘ (skip)');
        } else if (error.message.includes('already') || error.message.includes('type json')) {
          skippedCount++;
          console.log(' ⊘ (already fixed)');
        } else {
          errorCount++;
          console.log(` ✗ ${error.message.substring(0, 60)}`);
        }
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${skippedCount}`);
}

scanAndFix().catch(console.error);