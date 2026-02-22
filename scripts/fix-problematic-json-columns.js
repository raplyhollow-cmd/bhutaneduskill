/**
 * Fix the 4 remaining problematic JSON columns
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function fixProblematicColumns() {
  console.log('=== Fixing 4 problematic JSON columns ===\n');

  // These columns contain structured data that needs special handling
  const fixes = [
    // role_permissions.permission_id - just cast the text directly
    `ALTER TABLE "role_permissions" ALTER COLUMN "permission_id" SET DATA TYPE json;`,

    // schools.contact_email - keep as text (email is not JSON)
    // schools.contact_phone - keep as text (phone is not JSON)

    // users.emergency_contact - likely a JSON field stored incorrectly
    // users.parent_contact - same

    // For users columns, let's try to cast them properly
    `ALTER TABLE "users" ALTER COLUMN "emergency_contact" SET DATA TYPE json USING CASE
      WHEN emergency_contact IS NULL OR emergency_contact = '' THEN '{}'::json
      ELSE emergency_contact::json
    END;`,

    `ALTER TABLE "users" ALTER COLUMN "parent_contact" SET DATA TYPE json USING CASE
      WHEN parent_contact IS NULL OR parent_contact = '' THEN '{}'::json
      ELSE parent_contact::json
    END;`,
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    try {
      const tableName = fix.match(/"([^"]+)"/)?.[1];
      const columnName = fix.match(/ALTER COLUMN "([^"]+)"/)?.[1];

      console.log(`Fixing ${tableName}.${columnName}...`);
      await sql.query(fix);
      successCount++;
      console.log('  ✓');
    } catch (error) {
      errorCount++;
      console.log(`  ✗ ${error.message}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  // Check if schools.contact_email and contact_phone should be text (not JSON)
  console.log('\n=== Checking schools contact columns ===');
  const checkResult = await sql.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'schools'
    AND column_name IN ('contact_email', 'contact_phone')
  `);
  console.table(checkResult);
}

fixProblematicColumns().catch(console.error);
