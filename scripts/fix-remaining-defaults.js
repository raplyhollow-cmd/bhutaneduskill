/**
 * Fix remaining columns with DEFAULT constraints
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

const REMAINING_WITH_DEFAULTS = [
  { table: 'assessment_types', column: 'target_audience' },
  { table: 'events', column: 'target_audience' },
  { table: 'notices', column: 'target_audience' },
];

async function fixDefaults() {
  console.log('=== FIXING COLUMNS WITH DEFAULTS ===\n');

  for (const { table, column } of REMAINING_WITH_DEFAULTS) {
    console.log(`\n→ ${table}.${column}`);

    try {
      // Check if default exists
      const colInfo = await sql.query(`
        SELECT column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${table}'
        AND column_name = '${column}';
      `);

      if (colInfo.length > 0 && colInfo[0].column_default !== null) {
        console.log(`  - Dropping default...`);
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
      }

      // Clean invalid data first
      console.log(`  - Cleaning invalid data...`);
      await sql.query(`
        UPDATE "${table}"
        SET "${column}" = '[]'
        WHERE "${column}" IS NULL OR "${column}" = '' OR "${column}"::text = 'none';
      `);

      console.log(`  - Converting to JSON...`);
      await sql.query(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
        USING COALESCE("${column}"::json, '[]'::json);
      `);

      // Restore default
      console.log(`  - Restoring default...`);
      await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);

      console.log(`  ✓ Fixed!`);

    } catch (error) {
      console.log(`  ✗ Error: ${error.message.substring(0, 150)}`);

      // Try without default restore
      try {
        console.log(`  - Retrying without default...`);
        await sql.query(`
          UPDATE "${table}"
          SET "${column}" = '[]'
          WHERE "${column}" IS NULL OR "${column}" = '' OR "${column}"::text = 'none';
        `);
        await sql.query(`
          ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
          USING COALESCE("${column}"::json, '[]'::json);
        `);
        console.log(`  ✓ Fixed (no default restored)`);
      } catch (error2) {
        console.log(`  ✗ Still failed: ${error2.message.substring(0, 100)}`);
      }
    }
  }

  console.log('\n=== DONE ===');
}

fixDefaults().catch(console.error);