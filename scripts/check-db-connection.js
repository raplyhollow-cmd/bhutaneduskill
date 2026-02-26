/**
 * Database Connection Diagnostic Script
 * Run with: node scripts/check-db-connection.js
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkDatabase() {
  console.log('=== Database Connection Check ===\n');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in .env file');
    return;
  }

  console.log('✅ DATABASE_URL is set');
  console.log('   URL:', dbUrl.replace(/:[^:]*@/, ':****@'));

  try {
    const sql = neon(dbUrl);

    console.log('\n🔍 Testing database connection...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully');
    console.log('   Server time:', result[0].current_time);

    console.log('\n🔍 Checking if users table exists...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users'
    `;

    if (tables.length > 0) {
      console.log('✅ users table exists');
    } else {
      console.error('❌ users table does NOT exist');
      console.log('   You need to run: npm run db:push');
    }

    console.log('\n🔍 Checking users table columns...');
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    if (columns.length > 0) {
      console.log(`✅ Found ${columns.length} columns in users table:`);
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n🔍 Checking for school_admin_applications table...');
    const appTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'school_admin_applications'
    `;

    if (appTables.length > 0) {
      console.log('✅ school_admin_applications table exists');
    } else {
      console.warn('⚠️  school_admin_applications table does NOT exist');
    }

    console.log('\n🔍 Counting users in database...');
    const count = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`✅ Total users: ${count[0].count}`);

  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
  }
}

checkDatabase().then(() => {
  console.log('\n=== Check Complete ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
