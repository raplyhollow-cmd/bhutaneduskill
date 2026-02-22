/**
 * Fix JSON column type casting issues - Extended
 *
 * This script fixes the error: "column 'X' cannot be cast automatically to type json"
 * by applying USING clauses to all JSON type conversions.
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// SQL statements to fix JSON type casting - extended list
const fixes = [
  // assessment_questions table (the original error source)
  `ALTER TABLE "assessment_questions" ALTER COLUMN "question_data" SET DATA TYPE json USING question_data::json;`,
  `ALTER TABLE "assessment_questions" ALTER COLUMN "options" SET DATA TYPE json USING options::json;`,

  // announcements table
  `ALTER TABLE "announcements" ALTER COLUMN "target_class_ids" SET DATA TYPE json USING target_class_ids::json;`,
  `ALTER TABLE "announcements" ALTER COLUMN "target_user_ids" SET DATA TYPE json USING target_user_ids::json;`,

  // bus_attendance table
  `ALTER TABLE "bus_attendance" ALTER COLUMN "pickup_location" SET DATA TYPE json USING pickup_location::json;`,
  `ALTER TABLE "bus_attendance" ALTER COLUMN "drop_location" SET DATA TYPE json USING drop_location::json;`,

  // users table - JSON columns
  `ALTER TABLE "users" ALTER COLUMN "interests" SET DATA TYPE json USING interests::json;`,

  // schools table - JSON columns
  `ALTER TABLE "schools" ALTER COLUMN "facilities" SET DATA TYPE json USING facilities::json;`,
  `ALTER TABLE "schools" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,

  // career_plans table - short_term_goals column
  `ALTER TABLE "career_plans" ALTER COLUMN "short_term_goals" SET DATA TYPE json USING COALESCE(short_term_goals::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "long_term_goals" SET DATA TYPE json USING COALESCE(long_term_goals::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "milestones" SET DATA TYPE json USING COALESCE(milestones::json, '[]'::json);`,
  `ALTER TABLE "career_plans" ALTER COLUMN "action_steps" SET DATA TYPE json USING COALESCE(action_steps::json, '[]'::json);`,

  // ai_interactions table - JSON columns
  `ALTER TABLE "ai_interactions" ALTER COLUMN "interaction_data" SET DATA TYPE json USING COALESCE(interaction_data::json, '{}'::json);`,
  `ALTER TABLE "ai_interactions" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);`,
];

async function main() {
  console.log('Applying JSON column type fixes (extended)...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    try {
      console.log(`Executing: ${fix.substring(0, 80)}...`);
      // Use the query method for DDL statements
      await sql.query(fix);
      successCount++;
      console.log('  ✓ Success\n');
    } catch (error) {
      errorCount++;
      console.error('  ✗ Error:', error.message);

      // Skip if column already has correct type or doesn't exist
      if (error.message.includes('already exists') ||
          error.message.includes('type json') ||
          error.message.includes('does not exist')) {
        console.log('  (Skipping - column may already be fixed or doesn\'t exist)\n');
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(console.error);
