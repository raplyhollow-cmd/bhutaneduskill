/**
 * Fix target_audience column - needs default value handling
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixTargetAudience() {
  console.log('=== Fixing target_audience column ===\n');

  try {
    // Step 1: Drop the default first
    console.log('Step 1: Dropping default value...');
    await sql.query(`ALTER TABLE "notifications" ALTER COLUMN "target_audience" DROP DEFAULT;`);
    console.log('  ✓ Default dropped\n');

    // Step 2: Now change the type
    console.log('Step 2: Changing column type...');
    await sql.query(`ALTER TABLE "notifications" ALTER COLUMN "target_audience" SET DATA TYPE json USING COALESCE(target_audience::text::json, '[]'::json);`);
    console.log('  ✓ Type changed to json\n');

    // Step 3: Set a new default if needed
    console.log('Step 3: Setting new default...');
    await sql.query(`ALTER TABLE "notifications" ALTER COLUMN "target_audience" SET DEFAULT '[]'::json;`);
    console.log('  ✓ Default set to []::json\n');

    console.log('=== SUCCESS ===');
  } catch (error) {
    console.error(`=== ERROR ===`);
    console.error(error.message);

    // If it's already json, that's fine
    if (error.message.includes('already') || error.message.includes('type json')) {
      console.log('\n(Column is already JSON - no fix needed)');
    }
  }
}

fixTargetAudience().catch(console.error);