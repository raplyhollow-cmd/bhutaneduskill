/**
 * MEGA SCAN - Fix EVERYTHING
 * Scan ALL text columns and convert ANYTHING that looks like it should be JSON
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function megaScan() {
  console.log('=== MEGA SCAN - FIX EVERYTHING ===\n');

  // Get ALL text columns (no filtering)
  const result = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type IN ('text', 'USER-DEFINED')
    ORDER BY table_name, column_name;
  `);

  console.log(`Found ${result.length} text/USER-DEFINED columns\n`);

  // Comprehensive patterns for JSON columns
  const jsonPatterns = [
    // Common JSON patterns
    '_data', '_meta', '_config', '_setting', '_option', '_tag', '_item', '_list',
    '_array', '_schedule', '_result', '_response', '_score', '_value', '_goal',
    '_milestone', '_criter', '_requirement', '_qualification', '_document',
    '_attachment', '_permission', '_issue', '_weakness', '_strength', '_skill',
    '_program', '_course', '_subject', '_student', '_teacher', '_parent',
    '_contact', '_layout', '_color', '_section', '_signature', '_break',
    '_working_day', '_period', '_term', '_rub', '_holiday', '_observed',
    '_exchange', '_translation', '_variable', '_channel', '_header',
    '_property', '_attribute', '_parameter', '_threshold', '_element',
    '_component', '_widget', '_day', '_available', '_career', '_rubric',
    '_assessment', '_announcement', '_notification', '_event', '_calendar',
    '_timeline', '_progress', '_achievement', '_behavior', '_homework',
    '_assignment', '_lesson', '_module', '_resource', '_material', '_facility',
    '_amenity', '_room', '_seat', '_vehicle', '_route', '_pickup', '_drop',
    '_fee', '_invoice', '_payment', '_subscription', '_tenant', '_preference',
    '_filter', '_search', '_sort', '_view', '_widget', '_equipment', '_tool',
    '_instrument', '_device', '_supply', '_material', '_furniture', '_furniture_type',

    // More patterns
    'equipment', 'tools', 'supplies', 'materials', 'furniture', 'furniture_type',
    'amenities', 'resources', 'assets', 'inventory', 'stock', 'items',
    'features', 'specifications', 'details', 'options', 'variants',
    'configuration', 'preferences', 'settings_data', 'custom_data',
    'additional_info', 'extra_data', 'other_data', 'extended_data',
    'json_data', 'meta_data', 'field_data', 'form_data', 'input_data',
    'output_data', 'result_data', 'response_data', 'request_data',
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
    if (dataType === 'json' || dataType === 'jsonb') {
      continue;
    }

    // Check if should be JSON
    const shouldBeJson = jsonPatterns.some(pattern =>
      column.toLowerCase().includes(pattern)
    );

    if (!shouldBeJson) {
      continue;
    }

    console.log(`\n→ ${table}.${column}`);

    try {
      // Clean invalid data
      await sql.query(`
        UPDATE "${table}"
        SET "${column}" = CASE
          WHEN "${column}" IS NULL THEN '[]'
          WHEN "${column}" = '' THEN '[]'
          WHEN "${column}"::text = 'none' THEN '[]'
          WHEN "${column}"::text = 'all' THEN '[]'
          WHEN "${column}"::text NOT LIKE '{%' AND "${column}"::text NOT LIKE '['
            AND "${column}"::text NOT LIKE '{"' THEN '[]'
          ELSE "${column}"
        END
        WHERE "${column}" IS NULL
           OR "${column}" = ''
           OR "${column}"::text = 'none'
           OR "${column}"::text = 'all'
           OR ("${column}"::text NOT LIKE '{%' AND "${column}"::text NOT LIKE '['
               AND "${column}"::text NOT LIKE '{"');
      `);

      // Drop default if exists
      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
      }

      // Convert to JSON - try array first, then object
      try {
        await sql.query(`
          ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
          USING COALESCE("${column}"::json, '[]'::json);
        `);
      } catch (innerError) {
        // Try with object default
        await sql.query(`
          ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
          USING COALESCE("${column}"::json, '{}'::json);
        `);
      }

      // Restore default if it had one
      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      }

      console.log(`  ✓ Fixed!`);
      fixed++;

    } catch (error) {
      // If conversion fails, try setting to empty array and retry
      try {
        await sql.query(`UPDATE "${table}" SET "${column}" = '[]' WHERE "${column}" IS NULL OR "${column}" = '';`);

        if (hasDefault) {
          await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
        }

        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING '[]'::json;`);

        if (hasDefault) {
          await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
        }

        console.log(`  ✓ Fixed (forced [])`);
        fixed++;
      } catch (error2) {
        console.log(`  ✗ Error: ${error2.message.substring(0, 80)}`);
        errors++;
      }
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total scanned: ${result.length}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('\n=== DONE ===');
}

megaScan().catch(console.error);
