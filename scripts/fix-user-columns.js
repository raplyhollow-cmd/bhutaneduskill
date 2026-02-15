const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const client = postgres(connectionString, { max: 1 });

async function runMigration() {
  try {
    console.log('Starting migration...');

    await client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" text`;
    console.log('✓ Added department column');

    await client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "school" text`;
    console.log('✓ Added school column');

    await client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" json`;
    console.log('✓ Added interests column');

    await client`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "goals" text`;
    console.log('✓ Added goals column');

    // Check if settings exists and drop it if needed
    const settingsExists = await client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'settings'
    `;

    if (settingsExists.length > 0) {
      console.log('Settings column already exists, type:', settingsExists[0].data_type);
      // Drop existing settings column
      await client`ALTER TABLE "users" DROP COLUMN "settings"`;
      console.log('✓ Dropped existing settings column');
    }

    // Add settings as json
    await client`ALTER TABLE "users" ADD COLUMN "settings" json`;
    console.log('✓ Added settings column (json type)');

    console.log('\nMigration completed successfully!');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    await client.end();
    process.exit(1);
  }
}

runMigration();
