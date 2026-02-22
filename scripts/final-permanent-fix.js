/**
 * FINAL PERMANENT FIX - Convert ALL remaining text columns to JSON
 * Based on actual database state check
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// Columns that are still TEXT and need to be JSON
const REMAINING_FIXES = [
  // From database scan - these are still text
  { table: 'users', column: 'subjects' },
  { table: 'users', column: 'interests' }, // Already json but double check
  { table: 'users', column: 'parent_contact' }, // Already json but double check
  { table: 'users', column: 'emergency_contact' }, // Already json but double check
  { table: 'exam_results_enhanced', column: 'subjects' },
  { table: 'teacher_applications', column: 'subjects' },
  { table: 'assessment_types', column: 'target_audience' },
  { table: 'counselor_resources', column: 'target_audience' },
  { table: 'events', column: 'target_audience' },
  { table: 'notices', column: 'target_audience' },
  { table: 'rooms', column: 'facilities' },
  { table: 'parents', column: 'emergency_contact' },
  { table: 'school_events', column: 'target_audience' },
  { table: 'students', column: 'emergency_contact' },
];

async function finalFix() {
  console.log('=== FINAL PERMANENT FIX ===\n');

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const { table, column } of REMAINING_FIXES) {
    // Check current type
    const result = await sql.query(`
      SELECT data_type, udt_name
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

    if (currentType === 'json' || currentType === 'jsonb') {
      console.log(`✓ ${table}.${column} - already JSON`);
      skipped++;
      continue;
    }

    console.log(`\n→ Fixing ${table}.${column} (${currentType})`);

    try {
      // For text columns, try converting with COALESCE fallback
      await sql.query(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
        USING COALESCE(NULLIF("${column}"::text, '')::json, '[]'::json);
      `);
      console.log(`  ✓ Fixed!`);
      fixed++;

    } catch (error) {
      // If that fails, try empty object as fallback
      try {
        await sql.query(`
          ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
          USING COALESCE("${column}"::text::json, '{}'::json);
        `);
        console.log(`  ✓ Fixed (with {})`);
        fixed++;

      } catch (error2) {
        console.log(`  ✗ Error: ${error2.message.substring(0, 100)}`);
        errors++;
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('\n=== DONE ===');
}

finalFix().catch(console.error);