/**
 * Fix hostel_facilities.rules column type from text to json
 */

const { neon } = require('@neondatabase/serverless');

async function fixRulesColumn() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Fixing hostel_facilities.rules column type...');

    // Check current column type
    const columnInfo = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'hostel_facilities'
      AND column_name = 'rules'
    `;
    console.log('Current column type:', columnInfo[0]?.data_type || 'not found');

    // For empty or invalid JSON, set to NULL first
    await sql`
      UPDATE hostel_facilities
      SET rules = NULL
      WHERE rules IS NOT NULL
      AND (rules = '' OR rules::text = '[]'::text OR rules::text = '{}'::text)
    `;

    // Now alter the column type with explicit USING clause
    await sql`
      ALTER TABLE hostel_facilities
      ALTER COLUMN rules
      TYPE json USING CASE
        WHEN rules IS NULL THEN NULL
        WHEN rules = '' THEN NULL
        ELSE rules::json
      END
    `;

    console.log('✅ Successfully changed hostel_facilities.rules to json type');

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Try alternative: drop and recreate column
    if (error.message.includes('cannot be cast') || error.message.includes('invalid input')) {
      console.log('Trying alternative approach via column recreation...');

      try {
        // Create new column
        await sql`ALTER TABLE hostel_facilities ADD COLUMN IF NOT EXISTS rules_new json`;
        console.log('Added rules_new column');

        // Copy data with valid JSON only
        await sql`
          UPDATE hostel_facilities
          SET rules_new = CASE
            WHEN rules IS NULL THEN NULL
            WHEN rules = '' THEN NULL
            ELSE rules::json
          END
        `;
        console.log('Copied valid data');

        // Drop old column
        await sql`ALTER TABLE hostel_facilities DROP COLUMN rules`;
        console.log('Dropped old rules column');

        // Rename new column
        await sql`ALTER TABLE hostel_facilities RENAME COLUMN rules_new TO rules`;
        console.log('Renamed rules_new to rules');

        console.log('✅ Fixed via column recreation');
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError.message);
        throw retryError;
      }
    } else {
      throw error;
    }
  }
}

fixRulesColumn()
  .then(() => {
    console.log('\n✨ Done! You can now run: npm run db:push');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Fix failed:', err);
    process.exit(1);
  });
