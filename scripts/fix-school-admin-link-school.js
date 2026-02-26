require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

(async () => {
  const sql = neon(process.env.DATABASE_URL);
  const clerkUserId = 'user_3A1LFzPZsyh05g8OvjThEjNN0Zm';

  console.log('=== Linking School Admin to School ===\n');

  // Link user to Yangchenphug High School
  const schoolId = 'school_1771662170149_0sraempoo';

  const user = await sql`
    UPDATE users
    SET school_id = ${schoolId},
        updated_at = NOW()
    WHERE clerk_user_id = ${clerkUserId}
    RETURNING id
  `;

  console.log('✅ User linked to school:', schoolId);
  console.log('   User DB ID:', user[0].id);

  // Now create the application record
  try {
    await sql`
      INSERT INTO school_admin_applications (id, user_id, school_id, status, payment_status, applied_at, created_at, updated_at)
      VALUES (
        'sa_app_' || substr(md5(random()::text), 1, 12),
        ${user[0].id},
        ${schoolId},
        'pending_approval',
        'pending',
        NOW(),
        NOW(),
        NOW()
      )
    `;
    console.log('✅ Application record created');
  } catch (err) {
    console.log('Note:', err.message);
  }

  console.log('\n=== Complete ===');
  console.log('The user should now be able to see their pending approval status.');
})();
