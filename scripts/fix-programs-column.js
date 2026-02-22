/**
 * Fix programs column in careers table
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixPrograms() {
  console.log('=== Fixing rub_programs column in careers table ===\n');

  try {
    console.log('Changing careers.rub_programs type...');
    await sql.query(`ALTER TABLE "careers" ALTER COLUMN "rub_programs" SET DATA TYPE json USING COALESCE(rub_programs::json, '[]'::json);`);
    console.log('  ✓ Success\n');
    console.log('=== FIXED ===');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.message.includes('does not exist')) {
      console.log('  (Column may not exist in this table)');
    }
  }
}

fixPrograms().catch(console.error);