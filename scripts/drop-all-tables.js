/**
 * Clean Slate: Drop all tables
 * Run this before db:push for a fresh start
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function dropAllTables() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Getting list of all tables...\n');

  // Get all tables in public schema
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  console.log(`Found ${tables.length} tables to drop:\n`);

  for (const table of tables) {
    const tableName = table.table_name;
    try {
      await sql.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      console.log(`  ✓ Dropped ${tableName}`);
    } catch (error) {
      console.error(`  ✗ Error dropping ${tableName}: ${error.message}`);
    }
  }

  console.log(`\n✓ Clean slate complete! All tables dropped.`);
  console.log(`Now run 'npm run db:push' to recreate tables with correct types.`);
}

dropAllTables();