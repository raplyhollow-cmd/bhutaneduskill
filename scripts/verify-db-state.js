/**
 * Quick check if database tables were created successfully
 */
require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function verify() {
  const sql = neon(process.env.DATABASE_URL);

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  console.log(`✓ Database has ${tables.length} tables`);

  // Check for key tables
  const keyTables = ['users', 'schools', 'students', 'teachers', 'homework', 'subscriptions'];
  const missing = keyTables.filter(t => !tables.some(x => x.table_name === t));

  if (missing.length > 0) {
    console.log(`Missing key tables: ${missing.join(', ')}`);
  } else {
    console.log('✓ All key tables present');
  }

  // Check a JSON column type
  const columnType = await sql`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'homework'
    AND column_name = 'assigned_students'
  `;

  if (columnType.length > 0) {
    console.log(`✓ homework.assigned_students is ${columnType[0].data_type}`);
  }
}

verify().catch(console.error);