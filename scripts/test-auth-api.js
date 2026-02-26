// Test what the auth API would return for this user
require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

(async () => {
  const sql = neon(process.env.DATABASE_URL);
  const clerkUserId = 'user_3A1LFzPZsyh05g8OvjThEjNN0Zm';

  console.log('=== Simulating /api/auth/set-role ===\n');

  // This is what the API does
  const userRecords = await sql`
    SELECT
      id,
      type,
      school_id,
      first_name,
      last_name,
      onboarding_status
    FROM users
    WHERE clerk_user_id = ${clerkUserId}
    LIMIT 1
  `;

  if (userRecords.length === 0) {
    console.log('Result: needsSetup: true (user not found)');
    return;
  }

  const user = userRecords[0];

  console.log('User found:', user.first_name, user.last_name);
  console.log('Type:', user.type);
  console.log('Onboarding Status:', user.onboarding_status);

  // Simulate the logic from set-role route
  if (user.type === 'school-admin' &&
      (user.onboarding_status === 'pending_approval' || user.onboarding_status === 'pending_enrollment')) {
    console.log('\nResult: awaitingApproval: true, needsSetup: true');
  } else if (user.type) {
    console.log('\nResult: userType:', user.type, ', needsSetup: false ✅');
  } else {
    console.log('\nResult: needsSetup: true (no type)');
  }
})();
