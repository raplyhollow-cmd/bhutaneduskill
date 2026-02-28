/**
 * Fix weekly_menu column type in hostel_mess table
 * Converts from text to json with proper casting
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function fixWeeklyMenuColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Fixing weekly_menu column type in hostel_mess table...');

    await sql`
      ALTER TABLE "hostel_mess"
      ALTER COLUMN "weekly_menu"
      SET DATA TYPE json
      USING COALESCE(weekly_menu::json, '{}'::json)
    `;

    console.log('✓ Successfully fixed weekly_menu column type');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error fixing weekly_menu column:', error.message);
    process.exit(1);
  }
}

fixWeeklyMenuColumn();