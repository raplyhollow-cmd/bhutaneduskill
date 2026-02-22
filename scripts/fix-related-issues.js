/**
 * Fix related_issues column
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixRelatedIssues() {
  console.log('=== Finding and fixing related_issues column ===\n');

  const result = await sql.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE column_name = 'related_issues'
    AND table_schema = 'public'
    AND data_type != 'json'
    ORDER BY table_name;
  `);

  console.log('Tables with related_issues column (non-json):');
  console.table(result);

  for (const row of result) {
    const tableName = row.table_name;
    console.log(`\nFixing ${tableName}.related_issues...`);
    try {
      await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "related_issues" SET DATA TYPE json USING COALESCE(related_issues::json, '[]'::json);`);
      console.log('  ✓ Fixed!');
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }
}

fixRelatedIssues().catch(console.error);
