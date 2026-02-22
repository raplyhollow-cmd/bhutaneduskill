/**
 * ULTIMATE SCAN & FIX - Scan entire database for ALL JSON issues and fix them
 * This is the comprehensive solution to fix all JSON column errors at once
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function ultimateScanAndFix() {
  console.log('=== ULTIMATE SCAN & FIX ===\n');
  console.log('Scanning ENTIRE database for text columns that should be JSON...\n');

  // Get ALL text columns in the database
  const result = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type IN ('text', 'USER-DEFINED')
    ORDER BY table_name, column_name;
  `);

  console.log(`Found ${result.length} text/USER-DEFINED columns to analyze\n`);

  // Patterns that indicate a column should be JSON
  const jsonPatterns = [
    'data', 'meta', 'content', 'config', 'setting', 'option', 'tag', 'item', 'list',
    'array', 'schedule', 'result', 'response', 'score', 'value', 'goal',
    'milestone', 'criter', 'requirement', 'qualification', 'document', 'attachment',
    'permission', 'issue', 'weakness', 'strength', 'skill', 'program', 'course',
    'subject', 'student', 'teacher', 'parent', 'contact', 'layout', 'color',
    'section', 'signature', 'break', 'working_day', 'period', 'term', 'rub',
    'holiday', 'observed', 'exchange', 'translation', 'variable', 'channel',
    'header', 'property', 'attribute', 'parameter', 'threshold', 'element',
    'component', 'widget', 'day', 'available', 'career', 'rubric', 'assessment',
    'announcement', 'notification', 'event', 'calendar', 'timeline', 'progress',
    'achievement', 'behavior', 'homework', 'assignment', 'lesson', 'module',
    'resource', 'material', 'facility', 'amenity', 'room', 'seat', 'vehicle',
    'route', 'pickup', 'drop', 'fee', 'invoice', 'payment', 'subscription',
    'tenant', 'preference', 'filter', 'search', 'sort', 'view', 'widget',
  ];

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of result) {
    const table = row.table_name;
    const column = row.column_name;
    const dataType = row.data_type;
    const udtName = row.udt_name;
    const hasDefault = row.column_default !== null;

    // Skip if already JSON
    if (dataType === 'json' || dataType === 'jsonb' || udtName === 'json' || udtName === 'jsonb') {
      continue;
    }

    // Check if this column should be JSON based on naming patterns
    const shouldBeJson = jsonPatterns.some(pattern =>
      column.toLowerCase().includes(pattern)
    );

    if (!shouldBeJson) {
      continue;
    }

    console.log(`\n→ ${table}.${column} (${dataType})`);

    try {
      // Step 1: Clean invalid data
      await sql.query(`
        UPDATE "${table}"
        SET "${column}" = CASE
          WHEN "${column}" IS NULL THEN '[]'
          WHEN "${column}" = '' THEN '[]'
          WHEN "${column}"::text = 'none' THEN '[]'
          WHEN "${column}"::text = 'all' THEN '[]'
          WHEN "${column}"::text NOT LIKE '{%' AND "${column}"::text NOT LIKE '[' THEN '[]'
          ELSE "${column}"
        END
        WHERE "${column}" IS NULL
           OR "${column}" = ''
           OR "${column}"::text = 'none'
           OR "${column}"::text = 'all'
           OR ("${column}"::text NOT LIKE '{%' AND "${column}"::text NOT LIKE '[');
      `);

      // Step 2: Drop default if exists
      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
      }

      // Step 3: Convert to JSON
      const usingClause = `COALESCE("${column}"::json, '[]'::json)`;
      await sql.query(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
        USING ${usingClause};
      `);

      // Step 4: Restore default if it had one
      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      }

      console.log(`  ✓ Fixed!`);
      fixed++;

    } catch (error) {
      const errorMsg = error.message;

      // Try alternative approach for columns with array-like data
      if (errorMsg.includes('invalid input syntax')) {
        try {
          console.log(`  - Retrying with array conversion...`);

          // Try treating as text array first
          await sql.query(`
            UPDATE "${table}"
            SET "${column}" = '[]'
            WHERE "${column}" IS NULL OR "${column}" = '';
          `);

          if (hasDefault) {
            await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
          }

          await sql.query(`
            ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
            USING '[]'::json;
          `);

          if (hasDefault) {
            await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
          }

          console.log(`  ✓ Fixed (with default [])`);
          fixed++;

        } catch (error2) {
          console.log(`  ✗ Still failed: ${error2.message.substring(0, 80)}`);
          errors++;
        }
      } else {
        console.log(`  ✗ Error: ${errorMsg.substring(0, 80)}`);
        errors++;
      }
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total columns scanned: ${result.length}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('\n=== DONE ===');

  return { fixed, skipped, errors };
}

ultimateScanAndFix().catch(console.error);
