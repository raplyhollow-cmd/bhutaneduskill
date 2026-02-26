const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

async function checkTeachers() {
  console.log('=== CHECKING TEACHER FLOW ===\n');

  // Check teacher applications
  const apps = await sql`
    SELECT
      ta.id,
      ta.status,
      ta.user_id,
      ta.school_id,
      ta.applied_at,
      ta.reviewed_at,
      u.name,
      u.email,
      u.onboarding_status
    FROM teacher_applications ta
    LEFT JOIN users u ON ta.user_id = u.id
    ORDER BY ta.applied_at DESC
    LIMIT 10
  `;

  console.log('Teacher Applications:', apps.length);
  apps.forEach(a => {
    console.log(`  - ${a.name} (${a.email})`);
    console.log(`    Status: ${a.status}`);
    console.log(`    Onboarding: ${a.onboarding_status}`);
    console.log(`    Applied: ${a.applied_at}`);
    if (a.reviewed_at) {
      console.log(`    Reviewed: ${a.reviewed_at}`);
    }
    console.log('');
  });

  // Check all users table teachers
  const teachers = await sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.type,
      u.school_id,
      u.onboarding_status,
      u.onboarding_complete
    FROM users u
    WHERE u.type = 'teacher'
    ORDER BY u.created_at DESC
    LIMIT 10
  `;

  console.log('All Teacher Users:', teachers.length);
  teachers.forEach(t => {
    console.log(`  - ${t.name} (${t.email})`);
    console.log(`    Status: ${t.onboarding_status}`);
    console.log(`    School: ${t.school_id}`);
    console.log('');
  });

  process.exit(0);
}

checkTeachers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
