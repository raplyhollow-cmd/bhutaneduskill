/**
 * Check user approval status
 */
require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkUserStatus() {
  const sql = neon(process.env.DATABASE_URL);

  // Check user status
  const users = await sql`
    SELECT id, clerk_user_id, type, first_name, last_name, email,
           onboarding_complete, onboarding_status, school_id
    FROM users
    WHERE email = 'raplyhollow2@gmail.com'
    LIMIT 1
  `;

  console.log('USER:');
  console.log(users[0]);

  // Check application status
  if (users[0]) {
    const applications = await sql`
      SELECT id, user_id, school_id, status, payment_status, reviewed_by, reviewed_at
      FROM school_admin_applications
      WHERE user_id = ${users[0].id}
      LIMIT 1
    `;
    console.log('\nAPPLICATION:');
    console.log(applications[0]);
  }

  process.exit(0);
}

checkUserStatus().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
