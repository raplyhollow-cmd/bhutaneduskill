/**
 * FINAL CATCH-ALL - Fix any remaining JSON columns
 * This will scan the entire database and fix ANY column that needs JSON type
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function finalCatchAll() {
  console.log('=== FINAL CATCH-ALL - Scanning entire database for JSON issues ===\n');

  // Get ALL text columns that could be JSON
  const result = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type IN ('text', 'USER-DEFINED')
    AND (
      column_name LIKE '%data%' OR
      column_name LIKE '%meta%' OR
      column_name LIKE '%content%' OR
      column_name LIKE '%config%' OR
      column_name LIKE '%setting%' OR
      column_name LIKE '%option%' OR
      column_name LIKE '%tag%' OR
      column_name LIKE '%item%' OR
      column_name LIKE '%list%' OR
      column_name LIKE '%array%' OR
      column_name LIKE '%json%' OR
      column_name LIKE '%schedule%' OR
      column_name LIKE '%result%' OR
      column_name LIKE '%response%' OR
      column_name LIKE '%score%' OR
      column_name LIKE '%value%' OR
      column_name LIKE '%goal%' OR
      column_name LIKE '%milestone%' OR
      column_name LIKE '%criter%' OR
      column_name LIKE '%requirement%' OR
      column_name LIKE '%qualification%' OR
      column_name LIKE '%document%' OR
      column_name LIKE '%attachment%' OR
      column_name LIKE '%permission%' OR
      column_name LIKE '%detail%' OR
      column_name LIKE '%info%' OR
      column_name LIKE '%contact%' OR
      column_name LIKE '%issue%' OR
      column_name LIKE '%weakness%' OR
      column_name LIKE '%strength%' OR
      column_name LIKE '%skill%' OR
      column_name LIKE '%program%' OR
      column_name LIKE '%course%'
    )
    ORDER BY table_name, column_name;
  `);

  console.log(`Found ${result.length} potential JSON columns to check...\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const row of result) {
    const table = row.table_name;
    const column = row.column_name;
    const dataType = row.data_type;
    const udtName = row.udt_name;

    try {
      // Handle user-defined types (like enums)
      if (dataType === 'USER-DEFINED') {
        try {
          await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
        } catch (e) {
          // No default to drop
        }
      }

      // Determine appropriate USING clause
      let usingClause;
      if (udtName === '_text' || dataType === 'ARRAY') {
        // Text array type
        usingClause = `CASE
          WHEN ${column} IS NULL THEN '[]'::json
          ELSE json_build_array(${column})
        END`;
      } else if (column.includes('tags') || column.includes('items') ||
          column.includes('options') || column.includes('list') ||
          column.includes('array') || column.includes('scores') ||
          column.includes('values') || column.includes('goals') ||
          column.includes('milestone') || column.includes('results') ||
          column.includes('attachments') || column.includes('documents') ||
          column.includes('permissions') || column.includes('response') ||
          column.includes('issues') || column.includes('weaknesses') ||
          column.includes('strengths') || column.includes('skills') ||
          column.includes('programs') || column.includes('courses') ||
          column.includes('subjects') || column.includes('requirements') ||
          column.includes('qualifications') || column.includes('details') ||
          column.includes('answers') || column.includes('questions')) {
        usingClause = `COALESCE(${column}::text::json, '[]'::json)`;
      } else {
        usingClause = `COALESCE(${column}::text::json, '{}'::json)`;
      }

      await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING ${usingClause};`);

      // Set default back if needed
      if (dataType === 'USER-DEFINED') {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      }

      fixedCount++;
      process.stdout.write(`\r✓ Fixed: ${fixedCount}/${result.length} `);
    } catch (error) {
      if (error.message.includes('already') || error.message.includes('42801')) {
        skippedCount++;
      } else if (error.message.includes('does not exist')) {
        skippedCount++;
      } else {
        errorCount++;
        console.log(`\n✗ ${table}.${column}: ${error.message.substring(0, 100)}`);
      }
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log('\n=== DONE ===');
}

finalCatchAll().catch(console.error);
