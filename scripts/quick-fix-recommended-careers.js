/**
 * Quick fix for recommended_careers and any remaining JSON columns
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function quickFix() {
  console.log('=== QUICK FIX FOR REMAINING JSON COLUMNS ===\n');

  // Get ALL text columns that might need to be JSON
  const result = await sql.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type IN ('text', 'USER-DEFINED')
    AND (
      column_name LIKE '%career%' OR
      column_name LIKE '%recommended%' OR
      column_name LIKE '%data%' OR
      column_name LIKE '%meta%' OR
      column_name LIKE '%config%' OR
      column_name LIKE '%setting%' OR
      column_name LIKE '%option%' OR
      column_name LIKE '%tag%' OR
      column_name LIKE '%item%' OR
      column_name LIKE '%list%'
    )
    ORDER BY table_name, column_name;
  `);

  console.log(`Found ${result.length} potential JSON columns\n`);

  let fixed = 0;
  let errors = 0;

  for (const row of result) {
    const table = row.table_name;
    const column = row.column_name;

    try {
      // Clean data first
      await sql.query(`
        UPDATE "${table}"
        SET "${column}" = '[]'
        WHERE "${column}" IS NULL OR "${column}" = '' OR "${column}"::text NOT LIKE '{%';
      `);

      // Check if has default
      const colInfo = await sql.query(`
        SELECT column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${table}'
        AND column_name = '${column}';
      `);

      const hasDefault = colInfo.length > 0 && colInfo[0].column_default !== null;

      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
      }

      await sql.query(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
        USING COALESCE("${column}"::json, '[]'::json);
      `);

      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      }

      console.log(`✓ ${table}.${column}`);
      fixed++;

    } catch (error) {
      console.log(`✗ ${table}.${column}: ${error.message.substring(0, 80)}`);
      errors++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Errors: ${errors}`);
}

quickFix().catch(console.error);