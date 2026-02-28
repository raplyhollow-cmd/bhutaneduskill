/**
 * Add missing columns to schools table
 */

const { neon } = require('@neondatabase/serverless');

async function addMissingColumns() {
  const sql = neon(process.env.DATABASE_URL);

  const columns = [
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS current_session_year text`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS fee_generation_date date`,
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS fee_generation_status text`,
  ];

  for (const columnSql of columns) {
    try {
      await sql[columnSql];
      console.log('✅ Executed:', columnSql.substring(0, 60) + '...');
    } catch (error) {
      console.log('⚠️  Skipped (may already exist):', error.message.substring(0, 80));
    }
  }

  console.log('\n✨ Done! Missing columns added to schools table');
}

addMissingColumns()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
