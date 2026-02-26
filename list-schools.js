const fs = require('fs');
const path = require('path');

// Read the .env file
const envPath = path.join(__dirname, '.env');
let DATABASE_URL = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  DATABASE_URL = envContent.split('\n')
    .find(line => line.startsWith('DATABASE_URL='))
    ?.replace('DATABASE_URL=', '') || '';
}

const { neon, neonConfig } = require('@neondatabase/serverless');
const sql = neon(DATABASE_URL, neonConfig);

async function main() {
  console.log('=== All Schools ===');
  const schools = await sql`
    SELECT id, name, code FROM schools ORDER BY created_at DESC LIMIT 10
  `;

  console.log('Schools:', schools);

  console.log('\n=== Your School Admin User ===');
  const schoolAdmins = await sql`
    SELECT id, name, email, school_id FROM users WHERE type = 'school-admin' LIMIT 5
  `;
  console.log('School admins:', schoolAdmins);
}

main().catch(console.error);
