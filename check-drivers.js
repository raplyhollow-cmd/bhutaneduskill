require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function checkDriver() {
  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'drivers'
    AND column_name = 'emergency_contact'
  `;
  console.log('Drivers table emergency_contact:', columns);
  process.exit(0);
}

checkDriver();
