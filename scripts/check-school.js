require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

(async () => {
  const sql = neon(process.env.DATABASE_URL);

  const user = await sql`SELECT id, school_id FROM users WHERE clerk_user_id = 'user_3A1LFzPZsyh05g8OvjThEjNN0Zm'`;
  console.log('User school_id:', user[0].school_id);

  const schools = await sql`SELECT id, name, code FROM schools LIMIT 5`;
  console.log('Schools in DB:');
  schools.forEach(s => console.log('  -', s.name, '(', s.id, ')'));
})();
