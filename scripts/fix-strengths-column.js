/**
 * Find and fix strengths column
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixStrengths() {
  console.log('=== Finding strengths column ===\n');

  const result = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE column_name = 'strengths'
    AND table_schema = 'public'
    AND data_type != 'json'
    ORDER BY table_name;
  `);

  console.log('Tables with strengths column (non-json):');
  console.table(result);

  console.log('\n=== Fixing ===\n');

  for (const row of result) {
    const tableName = row.table_name;
    const dataType = row.data_type;
    const udtName = row.udt_name;

    console.log(`Fixing ${tableName}.strengths (${dataType}/${udtName})...`);

    try {
      if (udtName === '_text' || dataType === 'ARRAY') {
        // Text array type
        await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "strengths" SET DATA TYPE json USING CASE
          WHEN strengths IS NULL THEN '[]'::json
          ELSE json_build_array(strengths)
        END;`);
      } else {
        // Regular text type
        await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "strengths" SET DATA TYPE json USING COALESCE(strengths::json, '[]'::json);`);
      }
      console.log('  ✓ Fixed!');
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }
}

fixStrengths().catch(console.error);
