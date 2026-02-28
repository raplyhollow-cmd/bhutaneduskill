require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function addColumns() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Adding missing columns to schools table...\n');

  await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS current_session_year text`;
  console.log('✓ current_session_year');

  await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS fee_generation_date text`;
  console.log('✓ fee_generation_date');

  await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS fee_generation_status text DEFAULT 'pending'`;
  console.log('✓ fee_generation_status');

  console.log('\nDone!');
}

addColumns().catch(console.error);
