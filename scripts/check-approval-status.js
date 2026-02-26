require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

(async () => {
  const sql = neon(process.env.DATABASE_URL);
  const clerkUserId = 'user_3A1LFzPZsyh05g8OvjThEjNN0Zm';

  console.log('=== Checking Approval Status ===\n');

  // Check user status
  const user = await sql`
    SELECT id, type, onboarding_status, onboarding_complete, school_id
    FROM users
    WHERE clerk_user_id = ${clerkUserId}
  `;

  console.log('User Status:');
  console.log('  onboarding_status:', user[0].onboarding_status);
  console.log('  onboarding_complete:', user[0].onboarding_complete);
  console.log('  school_id:', user[0].school_id);

  // Check application status
  const apps = await sql`
    SELECT id, status, payment_status, reviewed_at, reviewed_by
    FROM school_admin_applications
    WHERE user_id = ${user[0].id}
  `;

  console.log('\nApplication Status:');
  if (apps.length > 0) {
    console.log('  status:', apps[0].status);
    console.log('  payment_status:', apps[0].payment_status);
    console.log('  reviewed_at:', apps[0].reviewed_at);
    console.log('  reviewed_by:', apps[0].reviewed_by);
  } else {
    console.log('  No application found');
  }

  // Check if user has school-admin role
  const roles = await sql`
    SELECT r.id, r.slug
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${user[0].id}
  `;

  console.log('\nUser Roles:');
  if (roles.length > 0) {
    roles.forEach(r => console.log('  -', r.slug));
  } else {
    console.log('  No roles assigned');
  }
})();
