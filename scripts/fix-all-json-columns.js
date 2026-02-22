/**
 * Comprehensive JSON column type casting fix
 *
 * Scans and fixes ALL JSON columns that need USING clause for type conversion
 * Generated from schema.ts analysis
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// Organized by table - ALL JSON columns from schema.ts
const fixes = [
  // ==================== schools ====================
  `ALTER TABLE "schools" ALTER COLUMN "facilities" SET DATA TYPE json USING facilities::json;`,

  // ==================== school_settings ====================
  `ALTER TABLE "school_settings" ALTER COLUMN "working_days" SET DATA TYPE json USING working_days::json;`,

  // ==================== academic_years ====================
  `ALTER TABLE "academic_years" ALTER COLUMN "terms" SET DATA TYPE json USING terms::json;`,

  // ==================== grade_configurations ====================
  `ALTER TABLE "grade_configurations" ALTER COLUMN "grades" SET DATA TYPE json USING grades::json;`,

  // ==================== bell_schedules ====================
  `ALTER TABLE "bell_schedules" ALTER COLUMN "periods" SET DATA TYPE json USING periods::json;`,

  // ==================== classes ====================
  `ALTER TABLE "classes" ALTER COLUMN "students" SET DATA TYPE json USING students::json;`,

  // ==================== assessment_questions ====================
  `ALTER TABLE "assessment_questions" ALTER COLUMN "question_data" SET DATA TYPE json USING question_data::json;`,
  `ALTER TABLE "assessment_questions" ALTER COLUMN "options" SET DATA TYPE json USING options::json;`,

  // ==================== assessment_types ====================
  `ALTER TABLE "assessment_types" ALTER COLUMN "results" SET DATA TYPE json USING results::json;`,

  // ==================== assessment_results ====================
  `ALTER TABLE "assessment_results" ALTER COLUMN "answers" SET DATA TYPE json USING answers::json;`,
  `ALTER TABLE "assessment_results" ALTER COLUMN "text_answers" SET DATA TYPE json USING text_answers::json;`,

  // ==================== homework ====================
  `ALTER TABLE "homework" ALTER COLUMN "attachments" SET DATA TYPE json USING attachments::json;`,

  // ==================== lesson_plans ====================
  `ALTER TABLE "lesson_plans" ALTER COLUMN "questions" SET DATA TYPE json USING questions::json;`,
  `ALTER TABLE "lesson_plans" ALTER COLUMN "attachments" SET DATA TYPE json USING attachments::json;`,

  // ==================== teacher_logs ====================
  `ALTER TABLE "teacher_logs" ALTER COLUMN "content" SET DATA TYPE json USING content::json;`,

  // ==================== announcements ====================
  `ALTER TABLE "announcements" ALTER COLUMN "target_class_ids" SET DATA TYPE json USING target_class_ids::json;`,
  `ALTER TABLE "announcements" ALTER COLUMN "target_user_ids" SET DATA TYPE json USING target_user_ids::json;`,

  // ==================== bus_attendance ====================
  `ALTER TABLE "bus_attendance" ALTER COLUMN "pickup_location" SET DATA TYPE json USING pickup_location::json;`,
  `ALTER TABLE "bus_attendance" ALTER COLUMN "drop_location" SET DATA TYPE json USING drop_location::json;`,

  // ==================== vehicles ====================
  `ALTER TABLE "vehicles" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,

  // ==================== users ====================
  `ALTER TABLE "users" ALTER COLUMN "interests" SET DATA TYPE json USING interests::json;`,

  // ==================== fee_structures ====================
  `ALTER TABLE "fee_structures" ALTER COLUMN "assigned_classes" SET DATA TYPE json USING assigned_classes::json;`,
  `ALTER TABLE "fee_structures" ALTER COLUMN "assigned_grades" SET DATA TYPE json USING assigned_grades::json;`,
  `ALTER TABLE "fee_structures" ALTER COLUMN "breakdown" SET DATA TYPE json USING breakdown::json;`,
  `ALTER TABLE "fee_structures" ALTER COLUMN "fees" SET DATA TYPE json USING fees::json;`,

  // ==================== career_plans ====================
  `ALTER TABLE "career_plans" ALTER COLUMN "short_term_goals" SET DATA TYPE json USING COALESCE(short_term_goals::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "long_term_goals" SET DATA TYPE json USING COALESCE(long_term_goals::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "milestones" SET DATA TYPE json USING COALESCE(milestones::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "action_steps" SET DATA TYPE json USING COALESCE(action_steps::json, '[]'::json);`,

  // ==================== riasec_results ====================
  `ALTER TABLE "riasec_results" ALTER COLUMN "scores" SET DATA TYPE json USING COALESCE(scores::json, '{}'::json);`,
  `ALTER TABLE "riasec_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json USING recommended_careers::json;`,

  // ==================== aptitude_results ====================
  `ALTER TABLE "aptitude_results" ALTER COLUMN "scores" SET DATA TYPE json USING COALESCE(scores::json, '{}'::json);`,
  `ALTER TABLE "aptitude_results" ALTER COLUMN "strengths" SET DATA TYPE json USING strengths::json;`,
  `ALTER TABLE "aptitude_results" ALTER COLUMN "weaknesses" SET DATA TYPE json USING weaknesses::json;`,
  `ALTER TABLE "aptitude_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json USING recommended_careers::json;`,

  // ==================== personality_results ====================
  `ALTER TABLE "personality_results" ALTER COLUMN "scores" SET DATA TYPE json USING COALESCE(scores::json, '{}'::json);`,
  `ALTER TABLE "personality_results" ALTER COLUMN "strengths" SET DATA TYPE json USING strengths::json;`,
  `ALTER TABLE "personality_results" ALTER COLUMN "weaknesses" SET DATA TYPE json USING weaknesses::json;`,
  `ALTER TABLE "personality_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json USING recommended_careers::json;`,

  // ==================== interest_inventory_results ====================
  `ALTER TABLE "interest_inventory_results" ALTER COLUMN "top_values" SET DATA TYPE json USING COALESCE(top_values::json, '[]'::json);`,
  `ALTER TABLE "interest_inventory_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json USING recommended_careers::json;`,

  // ==================== skill_assessments ====================
  `ALTER TABLE "skill_assessments" ALTER COLUMN "recommendations" SET DATA TYPE json USING recommendations::json;`,

  // ==================== courses ====================
  `ALTER TABLE "courses" ALTER COLUMN "content" SET DATA TYPE json USING COALESCE(content::json, '{}'::json);`,
  `ALTER TABLE "courses" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);`,
  `ALTER TABLE "courses" ALTER COLUMN "objectives" SET DATA TYPE json USING COALESCE(objectives::json, '[]'::json);`,
  `ALTER TABLE "courses" ALTER COLUMN "prerequisites" SET DATA TYPE json USING COALESCE(prerequisites::json, '[]'::json);`,

  // ==================== student_progress ====================
  `ALTER TABLE "student_progress" ALTER COLUMN "completed_lessons" SET DATA TYPE json USING COALESCE(completed_lessons::json, '[]'::json);`,

  // ==================== lesson_plans (schedule) ====================
  `ALTER TABLE "lesson_plans" ALTER COLUMN "schedule" SET DATA TYPE json USING COALESCE(schedule::json, '[]'::json);`,
  `ALTER TABLE "lesson_plans" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);`,
  `ALTER TABLE "lesson_plans" ALTER COLUMN "requirements" SET DATA TYPE json USING COALESCE(requirements::json, '[]'::json);`,
  `ALTER TABLE "lesson_plans" ALTER COLUMN "prerequisites" SET DATA TYPE json USING COALESCE(prerequisites::json, '[]'::json);`,

  // ==================== career_opportunities ====================
  `ALTER TABLE "career_opportunities" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);`,
  `ALTER TABLE "career_opportunities" ALTER COLUMN "qualifications" SET DATA TYPE json USING COALESCE(qualifications::json, '[]'::json);`,
  `ALTER TABLE "career_opportunities" ALTER COLUMN "availability" SET DATA TYPE json USING COALESCE(availability::json, '[]'::json);`,
  `ALTER TABLE "career_opportunities" ALTER COLUMN "grade_levels" SET DATA TYPE json USING COALESCE(grade_levels::json, '[]'::json);`,

  // ==================== rub_programs ====================
  `ALTER TABLE "rub_programs" ALTER COLUMN "holland_codes" SET DATA TYPE json USING COALESCE(holland_codes::json, '[]'::json);`,
  `ALTER TABLE "rub_programs" ALTER COLUMN "skills" SET DATA TYPE json USING COALESCE(skills::json, '[]'::json);`,
  `ALTER TABLE "rub_programs" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);`,
  `ALTER TABLE "rub_programs" ALTER COLUMN "rub_programs" SET DATA TYPE json USING COALESCE(rub_programs::json, '[]'::json);`,

  // ==================== ai_interactions ====================
  `ALTER TABLE "ai_interactions" ALTER COLUMN "interaction_data" SET DATA TYPE json USING COALESCE(interaction_data::json, '{}'::json);`,
  `ALTER TABLE "ai_interactions" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,

  // ==================== platform_analytics ====================
  `ALTER TABLE "platform_analytics" ALTER COLUMN "growth_data" SET DATA TYPE json USING growth_data::json;`,
  `ALTER TABLE "platform_analytics" ALTER COLUMN "revenue_data" SET DATA TYPE json USING revenue_data::json;`,
  `ALTER TABLE "platform_analytics" ALTER COLUMN "activity_data" SET DATA TYPE json USING activity_data::json;`,

  // ==================== notifications ====================
  `ALTER TABLE "notifications" ALTER COLUMN "target_audience" SET DATA TYPE json USING COALESCE(target_audience::json, '[]'::json);`,

  // ==================== notifications (reminders) ====================
  `ALTER TABLE "notifications" ALTER COLUMN "reminders" SET DATA TYPE json USING COALESCE(reminders::json, '[]'::json);`,
  `ALTER TABLE "notifications" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);`,

  // ==================== intervention_sessions ====================
  `ALTER TABLE "intervention_sessions" ALTER COLUMN "responses" SET DATA TYPE json USING COALESCE(responses::json, '{}'::json);`,

  // ==================== parent_invitations ====================
  `ALTER TABLE "parent_invitations" ALTER COLUMN "config" SET DATA TYPE json USING COALESCE(config::json, '{}'::json);`,

  // ==================== college_programs ====================
  `ALTER TABLE "college_programs" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,

  // ==================== scholarships ====================
  `ALTER TABLE "scholarships" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,

  // ==================== syllabi ====================
  `ALTER TABLE "syllabi" ALTER COLUMN "structured_data" SET DATA TYPE json USING structured_data::json;`,
  `ALTER TABLE "syllabi" ALTER COLUMN "required_subjects" SET DATA TYPE json USING required_subjects::json;`,
  `ALTER TABLE "syllabi" ALTER COLUMN "aggregate_requirements" SET DATA TYPE json USING COALESCE(aggregate_requirements::json, '{}'::json);`,

  // ==================== training_programs ====================
  `ALTER TABLE "training_programs" ALTER COLUMN "eligibility_criteria" SET DATA TYPE json USING eligibility_criteria::json;`,
  `ALTER TABLE "training_programs" ALTER COLUMN "benefits" SET DATA TYPE json USING benefits::json;`,
  `ALTER TABLE "training_programs" ALTER COLUMN "documents_required" SET DATA TYPE json USING COALESCE(documents_required::json, '[]'::json);`,
  `ALTER TABLE "training_programs" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,

  // ==================== counselor_sessions (attachments) ====================
  `ALTER TABLE "counselor_sessions" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);`,
  `ALTER TABLE "counselor_sessions" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);`,

  // ==================== wellness_records ====================
  `ALTER TABLE "wellness_records" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);`,
  `ALTER TABLE "wellness_records" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);`,

  // ==================== tutors ====================
  `ALTER TABLE "tutors" ALTER COLUMN "specialties" SET DATA TYPE json USING COALESCE(specialties::json, '[]'::json);`,
  `ALTER TABLE "tutors" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);`,

  // ==================== report_templates ====================
  `ALTER TABLE "report_templates" ALTER COLUMN "layout" SET DATA TYPE json USING COALESCE(layout::json, '{}'::json);`,
  `ALTER TABLE "report_templates" ALTER COLUMN "colors" SET DATA TYPE json USING COALESCE(colors::json, '{}'::json);`,
  `ALTER TABLE "report_templates" ALTER COLUMN "custom_sections" SET DATA TYPE json USING COALESCE(custom_sections::json, '[]'::json);`,
  `ALTER TABLE "report_templates" ALTER COLUMN "signatures" SET DATA TYPE json USING COALESCE(signatures::json, '{}'::json);`,

  // ==================== generated_reports ====================
  `ALTER TABLE "generated_reports" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);`,
  `ALTER TABLE "generated_reports" ALTER COLUMN "acknowledgements" SET DATA TYPE json USING COALESCE(acknowledgements::json, '[]'::json);`,

  // ==================== meeting_notes ====================
  `ALTER TABLE "meeting_notes" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);`,

  // ==================== health_records ====================
  `ALTER TABLE "health_records" ALTER COLUMN "symptoms" SET DATA TYPE json USING COALESCE(symptoms::json, '[]'::json);`,
  `ALTER TABLE "health_records" ALTER COLUMN "medications_prescribed" SET DATA TYPE json USING COALESCE(medications_prescribed::json, '[]'::json);`,
  `ALTER TABLE "health_records" ALTER COLUMN "dietary_restrictions" SET DATA TYPE json USING COALESCE(dietary_restrictions::json, '[]'::json);`,

  // ==================== subscriptions ====================
  `ALTER TABLE "subscriptions" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,

  // ==================== invoices ====================
  `ALTER TABLE "invoices" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,
];

async function main() {
  console.log('Applying COMPREHENSIVE JSON column type fixes...\n');
  console.log(`Total fixes to apply: ${fixes.length}\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < fixes.length; i++) {
    const fix = fixes[i];
    try {
      const tableName = fix.match(/"([^"]+)"/)?.[1] || 'unknown';
      const columnName = fix.match(/ALTER COLUMN "([^"]+)"/)?.[1] || 'unknown';

      process.stdout.write(`\r[${i + 1}/${fixes.length}] ${tableName}.${columnName}...`);

      // Use the query method for DDL statements
      await sql.query(fix);
      successCount++;
    } catch (error) {
      errorCount++;
      errors.push({ fix, error: error.message });

      // Don't log unless it's a real error
      if (!error.message.includes('does not exist') &&
          !error.message.includes('already') &&
          !error.message.includes('type json')) {
        console.log(`\n  ✗ Error: ${error.message}`);
      }
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0 && errorCount > 5) {
    console.log(`\n=== Recent Errors (last 5) ===`);
    errors.slice(-5).forEach(e => {
      console.log(`- ${e.fix.substring(0, 60)}...`);
      console.log(`  ${e.error}`);
    });
  }
}

main().catch(console.error);
