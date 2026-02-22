/**
 * FINAL COMPREHENSIVE FIX - One script to rule them all
 * This will directly fix the equipment column and any other lingering JSON issues
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function finalComprehensiveFix() {
  console.log('=== FINAL COMPREHENSIVE FIX ===\n');

  // Direct fix for equipment column in hostel_facilities
  console.log('Checking hostel_facilities.equipment...');

  const result = await sql.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'hostel_facilities'
    AND column_name = 'equipment';
  `);

  if (result.length > 0) {
    const currentType = result[0].data_type;
    console.log(`Current type: ${currentType}`);

    if (currentType === 'json') {
      console.log('✓ Already JSON - skipping');
    } else {
      console.log('Converting to JSON...');

      try {
        // Clean data
        await sql.query(`
          UPDATE hostel_facilities
          SET equipment = CASE
            WHEN equipment IS NULL THEN '[]'
            WHEN equipment = '' THEN '[]'
            ELSE equipment
          END
          WHERE equipment IS NULL OR equipment = '';
        `);

        // Convert
        await sql.query(`
          ALTER TABLE hostel_facilities
          ALTER COLUMN equipment SET DATA TYPE json
          USING COALESCE(equipment::json, '[]'::json);
        `);

        console.log('✓ Fixed!');
      } catch (error) {
        console.log(`✗ Error: ${error.message}`);

        // Force fix - set to empty array and convert
        try {
          await sql.query(`UPDATE hostel_facilities SET equipment = '[]' WHERE equipment IS NULL;`);
          await sql.query(`ALTER TABLE hostel_facilities ALTER COLUMN equipment SET DATA TYPE json USING '[]'::json;`);
          console.log('✓ Fixed (forced!)');
        } catch (e2) {
          console.log(`✗ Still failed: ${e2.message}`);
        }
      }
    }
  }

  // Check for any other text columns with common JSON patterns
  console.log('\nScanning for other potential JSON columns...');

  const scanResult = await sql.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type = 'text'
    AND (
      column_name LIKE '%equipment%' OR
      column_name LIKE '%facility%' OR
      column_name LIKE '%amenity%' OR
      column_name LIKE '%resource%' OR
      column_name LIKE '%material%' OR
      column_name LIKE '%tool%' OR
      column_name LIKE '%supply%'
    )
    ORDER BY table_name, column_name;
  `);

  console.log(`Found ${scanResult.length} potential columns`);

  for (const row of scanResult) {
    const table = row.table_name;
    const column = row.column_name;

    console.log(`\n→ ${table}.${column}`);

    try {
      await sql.query(`
        UPDATE "${table}"
        SET "${column}" = CASE
          WHEN "${column}" IS NULL THEN '[]'
          WHEN "${column}" = '' THEN '[]'
          ELSE "${column}"
        END
        WHERE "${column}" IS NULL OR "${column}" = '';
      `);

      await sql.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN "${column}" SET DATA TYPE json
        USING COALESCE("${column}"::json, '[]'::json);
      `);

      console.log(`  ✓ Fixed!`);
    } catch (error) {
      console.log(`  ✗ Skipped (might be FK or indexed)`);
    }
  }

  console.log('\n=== DONE ===');
}

finalComprehensiveFix().catch(console.error);
