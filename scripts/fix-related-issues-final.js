/**
 * Direct fix for any remaining related_issues columns
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixRemainingRelatedIssues() {
  console.log('=== Direct fix for related_issues ===\n');

  // Get ALL columns with related_issues name
  const result = await sql.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE column_name = 'related_issues'
    AND table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log('All tables with related_issues column:');
  console.table(result);

  console.log('\n=== Attempting fixes ===\n');

  for (const row of result) {
    const tableName = row.table_name;
    const dataType = row.data_type;

    if (dataType === 'json') {
      console.log(`\n${tableName}.related_issues - Already JSON, skipping`);
      continue;
    }

    console.log(`\nFixing ${tableName}.related_issues (${dataType})...`);

    try {
      if (dataType === 'USER-DEFINED') {
        await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "related_issues" DROP DEFAULT;`);
      }

      await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "related_issues" SET DATA TYPE json USING COALESCE(related_issues::json, '[]'::json);`);

      if (dataType === 'USER-DEFINED') {
        await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "related_issues" SET DEFAULT '[]'::json;`);
      }

      console.log('  ✓ Fixed!');
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }

  console.log('\n=== DONE ===');
}

fixRemainingRelatedIssues().catch(console.error);
