/**
 * Fix tricky JSON columns that need special handling
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixTrickyColumns() {
  console.log('=== Fixing tricky JSON columns ===\n');

  // First, let's check what type these columns actually are
  console.log('Checking column types...\n');

  const checks = [
    `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_audience';`,
    `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'rub_programs' AND column_name = 'rub_programs';`,
  ];

  for (const check of checks) {
    try {
      const result = await sql.query(check);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  console.log('\n=== Applying fixes ===\n');

  const fixes = [
    // For target_audience - might be text[], need to cast through array
    `ALTER TABLE "notifications" ALTER COLUMN "target_audience" SET DATA TYPE json USING CASE
      WHEN target_audience IS NULL THEN '[]'::json
      ELSE json_build_array(target_audience)
    END;`,

    // For rub_programs - same issue
    `ALTER TABLE "rub_programs" ALTER COLUMN "rub_programs" SET DATA TYPE json USING CASE
      WHEN rub_programs IS NULL THEN '[]'::json
      ELSE json_build_array(rub_programs)
    END;`,
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    try {
      const tableName = fix.match(/"([^"]+)"/)?.[1];
      const columnName = fix.match(/ALTER COLUMN "([^"]+)"/)?.[1];
      process.stdout.write(`Fixing ${tableName}.${columnName}...`);

      await sql.query(fix);
      successCount++;
      console.log(' ✓');
    } catch (error) {
      errorCount++;
      console.log(` ✗ ${error.message}`);

      // Try alternative fix
      if (error.message.includes('target_audience')) {
        console.log('  Trying alternative fix for target_audience...');
        try {
          await sql.query(`ALTER TABLE "notifications" ALTER COLUMN "target_audience" SET DATA TYPE json USING target_audience::text::json;`);
          successCount++;
          console.log('  ✓ Alternative fix worked!');
        } catch (e2) {
          console.log(`  ✗ Alternative also failed: ${e2.message}`);
        }
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

fixTrickyColumns().catch(console.error);