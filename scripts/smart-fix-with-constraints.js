/**
 * SMART FIX - Handle constraints and indexes properly
 * Drop indexes/constraints before converting, then restore
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// Known JSON columns from Drizzle schema that need fixing
const COLUMNS_TO_FIX = [
  'hostel_facilities.equipment',
  'rooms.equipment',
  'inventory_items.specifications',
  'vehicles.features',
  'school_settings.equipment_provided',
  'tuition_courses.materials_included',
  'teacher_applications.teaching_materials',
];

async function smartFix() {
  console.log('=== SMART FIX - Handling Constraints ===\n');

  for (const columnRef of COLUMNS_TO_FIX) {
    const [table, column] = columnRef.split('.');

    // Check if column exists and is text
    const result = await sql.query(`
      SELECT data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = '${table}'
      AND column_name = '${column}';
    `);

    if (result.length === 0) {
      console.log(`⊘ ${table}.${column} - doesn't exist`);
      continue;
    }

    const currentType = result[0].data_type;
    const hasDefault = result[0].column_default !== null;

    if (currentType === 'json' || currentType === 'jsonb') {
      console.log(`✓ ${table}.${column} - already JSON`);
      continue;
    }

    console.log(`\n→ ${table}.${column} (${currentType})`);

    try {
      // Get indexes on this column
      const indexes = await sql.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = '${table}'
        AND indexdef LIKE '%${column}%';
      `);

      // Drop indexes that include this column
      for (const idx of indexes) {
        try {
          await sql.query(`DROP INDEX IF EXISTS "${idx.indexname}";`);
          console.log(`  - Dropped index: ${idx.indexname}`);
        } catch (e) {
          // Index might not exist or can't be dropped
        }
      }

      // Clean data
      await sql.query(`
        UPDATE "${table}"
        SET "${column}" = CASE
          WHEN "${column}" IS NULL THEN '[]'
          WHEN "${column}" = '' THEN '[]'
          ELSE "${column}"
        END;
      `);

      // Drop default if exists
      if (hasDefault) {
        await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
      }

      // Convert to JSON
      await sql.query(`
        ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
        USING COALESCE("${column}"::json, '[]'::json);
      `);

      // Restore default
      await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);

      console.log(`  ✓ Fixed!`);

    } catch (error) {
      console.log(`  ✗ Error: ${error.message.substring(0, 100)}`);

      // Try without cleaning first
      try {
        console.log(`  - Trying direct conversion...`);

        if (hasDefault) {
          await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
        }

        await sql.query(`
          ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json
          USING '[]'::json;
        `);

        if (hasDefault) {
          await sql.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
        }

        console.log(`  ✓ Fixed (direct)!`);
      } catch (error2) {
        console.log(`  ✗ Still failed: ${error2.message.substring(0, 60)}`);
      }
    }
  }

  console.log('\n=== DONE ===');
}

smartFix().catch(console.error);
