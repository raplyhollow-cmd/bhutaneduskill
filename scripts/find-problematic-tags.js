/**
 * Find which table has the problematic tags column
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function findProblematicTags() {
  console.log('=== Finding which table has problematic tags column ===\n');

  // Find all tables with a tags column that is NOT json type
  const result = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE column_name = 'tags'
    AND table_schema = 'public'
    AND data_type != 'json'
    ORDER BY table_name;
  `);

  console.log('Tables with tags column that is NOT json:');
  console.table(result);

  console.log('\n=== Attempting fixes ===\n');

  for (const row of result) {
    const tableName = row.table_name;
    const dataType = row.data_type;
    const udtName = row.udt_name;

    console.log(`\nFixing ${tableName}.tags (${dataType}/${udtName})...`);

    try {
      // Try different approaches based on data type
      if (udtName === '_text' || dataType === 'ARRAY') {
        // It's a text array, need to convert differently
        await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "tags" SET DATA TYPE json USING CASE
          WHEN tags IS NULL THEN '[]'::json
          ELSE json_build_array(tags)
        END;`);
      } else {
        // Regular text type
        await sql.query(`ALTER TABLE "${tableName}" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);`);
      }
      console.log('  ✓ Fixed!');
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }
}

findProblematicTags().catch(console.error);
