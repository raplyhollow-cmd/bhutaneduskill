/**
 * Fix ALL existing JSON columns by querying the database directly
 * This finds and fixes ANY column that should be JSON but isn't
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixAllExistingJsonColumns() {
  console.log('=== Fixing ALL existing JSON columns (database-driven scan) ===\n');

  // Get ALL text columns that should likely be JSON based on naming patterns
  const result = await sql.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND (
      column_name LIKE '%data%' OR
      column_name LIKE '%metadata%' OR
      column_name LIKE '%content%' OR
      column_name LIKE '%config%' OR
      column_name LIKE '%settings%' OR
      column_name LIKE '%options%' OR
      column_name LIKE '%tags%' OR
      column_name LIKE '%items%' OR
      column_name LIKE '%list%' OR
      column_name LIKE '%array%' OR
      column_name LIKE '%json%' OR
      column_name LIKE '%schedule%' OR
      column_name LIKE '%results%' OR
      column_name LIKE '%response%' OR
      column_name LIKE '%scores%' OR
      column_name LIKE '%values%' OR
      column_name LIKE '%goals%' OR
      column_name LIKE '%milestone%' OR
      column_name LIKE '%criteria%' OR
      column_name LIKE '%requirement%' OR
      column_name LIKE '%qualification%' OR
      column_name LIKE '%documents%' OR
      column_name LIKE '%attachment%' OR
      column_name LIKE '%permission%' OR
      column_name LIKE '%detail%' OR
      column_name LIKE '%info%' OR
      column_name LIKE '%contact%'
    )
    AND data_type IN ('text', 'USER-DEFINED')
    ORDER BY table_name, column_name;
  `);

  console.log(`Found ${result.length} columns that might need JSON type...\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const row of result) {
    const table = row.table_name;
    const column = row.column_name;
    const dataType = row.data_type;

    try {
      // Handle different data types
      if (dataType === 'USER-DEFINED') {
        // For user-defined types (like enums), drop default first
        try {
          await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
        } catch (e) {
          // Ignore if no default
        }
      }

      // Determine appropriate USING clause
      let usingClause;
      if (column.includes('tags') || column.includes('items') ||
          column.includes('options') || column.includes('list') ||
          column.includes('array') || column.includes('scores') ||
          column.includes('values') || column.includes('goals') ||
          column.includes('milestone') || column.includes('results') ||
          column.includes('attachments') || column.includes('documents') ||
          column.includes('permissions') || column.includes('response')) {
        usingClause = `COALESCE(${column}::text::json, '[]'::json)`;
      } else {
        usingClause = `COALESCE(${column}::text::json, '{}'::json)`;
      }

      await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING ${usingClause};`);

      // Set default back if needed
      if (dataType === 'USER-DEFINED') {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      }

      process.stdout.write(`\r✓ Fixed: ${table}.${column}                              `);
      fixedCount++;
    } catch (error) {
      if (error.message.includes('already') || error.message.includes('42801')) {
        skippedCount++;
      } else {
        errorCount++;
        console.log(`\n✗ ${table}.${column}: ${error.message.substring(0, 80)}`);
      }
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${skippedCount}`);
}

fixAllExistingJsonColumns().catch(console.error);
