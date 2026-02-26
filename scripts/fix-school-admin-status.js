/**
 * Fix school-admin onboarding status
 * Changes pending_enrollment to pending_approval for proper routing
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function fixStatus() {
  const clerkUserId = 'user_3A1LFzPZsyh05g8OvjThEjNN0Zm';
  console.log('=== Fixing School Admin Status ===\n');
  console.log('User:', clerkUserId);

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Update the onboarding_status from pending_enrollment to pending_approval
    const result = await sql`
      UPDATE users
      SET onboarding_status = 'pending_approval',
          updated_at = NOW()
      WHERE clerk_user_id = ${clerkUserId}
      RETURNING id, type, email, onboarding_status
    `;

    if (result.length > 0) {
      console.log('\n✅ Status updated successfully:');
      console.log('   ID:', result[0].id);
      console.log('   Type:', result[0].type);
      console.log('   Email:', result[0].email);
      console.log('   New Status:', result[0].onboarding_status);
      console.log('\n   The user will now be redirected to /pending-approval page');
    } else {
      console.log('\n❌ User not found');
    }

    // Also check if there's a school_admin_applications record
    const apps = await sql`
      SELECT id, status, payment_status
      FROM school_admin_applications
      WHERE user_id = (SELECT id FROM users WHERE clerk_user_id = ${clerkUserId})
    `;

    if (apps.length > 0) {
      console.log('\n📋 Application exists:');
      console.log('   Application ID:', apps[0].id);
      console.log('   Status:', apps[0].status);
      console.log('   Payment Status:', apps[0].payment_status);
    } else {
      console.log('\n⚠️  No application record found - creating one...');

      // Create application record
      const userId = (await sql`SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}`)[0].id;

      await sql`
        INSERT INTO school_admin_applications (id, user_id, school_id, status, payment_status, applied_at, created_at, updated_at)
        VALUES (
          'sa_app_' || substr(md5(random()::text), 1, 12),
          ${userId},
          (SELECT school_id FROM users WHERE clerk_user_id = ${clerkUserId}),
          'pending_approval',
          'pending',
          NOW(),
          NOW(),
          NOW()
        )
      `;
      console.log('   ✅ Application record created');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

fixStatus().then(() => {
  console.log('\n=== Complete ===');
  process.exit(0);
});
