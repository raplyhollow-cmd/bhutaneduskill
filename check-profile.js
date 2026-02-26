require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name LIKE '%profile%'
  `;
  console.log('Profile columns:', columns);
  process.exit(0);
}
check();
