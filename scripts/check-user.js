/**
 * Check if user exists in database
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkUser() {
  const clerkUserId = 'user_3A1LFzPZsyh05g8OvjThEjNN0Zm';
  console.log('=== Checking User ===\n');
  console.log('Looking for Clerk User ID:', clerkUserId);

  try {
    const sql = neon(process.env.DATABASE_URL);

    const users = await sql`
      SELECT id, clerk_user_id, type, first_name, last_name, email, onboarding_status
      FROM users
      WHERE clerk_user_id = ${clerkUserId}
    `;

    if (users.length === 0) {
      console.log('\n❌ User NOT FOUND in database');
      console.log('   This user exists in Clerk but not in your database.');
      console.log('\n   This usually means:');
      console.log('   1. The user signed up via Clerk but the setup flow did not complete');
      console.log('   2. The database insert failed during signup');
      console.log('\n   Solution: Sign up again or manually create the user record');
    } else {
      console.log('\n✅ User FOUND in database:');
      console.log('   Database ID:', users[0].id);
      console.log('   Type:', users[0].type);
      console.log('   Name:', users[0].first_name, users[0].last_name);
      console.log('   Email:', users[0].email);
      console.log('   Onboarding Status:', users[0].onboarding_status);
    }

    console.log('\n🔍 All users in database:');
    const allUsers = await sql`
      SELECT id, clerk_user_id, type, email, onboarding_status
      FROM users
      LIMIT 10
    `;

    console.log(`   Found ${allUsers.length} users:`);
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.type} - ${u.email} (clerk_id: ${u.clerk_user_id})`);
      console.log(`      Status: ${u.onboarding_status || 'none'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUser();
