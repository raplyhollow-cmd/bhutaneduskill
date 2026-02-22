/**
 * Fix remaining JSON columns that need USING clause
 * Run this when you get new JSON casting errors
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

const fixes = [
  // careers table - holland_codes
  `ALTER TABLE "careers" ALTER COLUMN "holland_codes" SET DATA TYPE json USING COALESCE(holland_codes::json, '[]'::json);`,

  // careers table - other JSON columns
  `ALTER TABLE "careers" ALTER COLUMN "skills" SET DATA TYPE json USING COALESCE(skills::json, '[]'::json);`,
  `ALTER TABLE "careers" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);`,
];

async function main() {
  console.log('Fixing careers table JSON columns...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    try {
      console.log(`Executing: ${fix.substring(0, 70)}...`);
      await sql.query(fix);
      successCount++;
      console.log('  ✓ Success\n');
    } catch (error) {
      errorCount++;
      console.error('  ✗ Error:', error.message);

      if (error.message.includes('does not exist')) {
        console.log('  (Table or column doesn\'t exist - skipping)\n');
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(console.error);
