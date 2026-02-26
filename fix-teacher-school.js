// Fix teacher school assignment
// Run with: node fix-teacher-school.js <schoolCode> <teacherEmail>

const fs = require('fs');
const path = require('path');

// Read the .env file to get DATABASE_URL
const envPath = path.join(__dirname, '.env');
let DATABASE_URL = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  DATABASE_URL = envContent.split('\n')
    .find(line => line.startsWith('DATABASE_URL='))
    ?.replace('DATABASE_URL=', '') || '';
}

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file');
  process.exit(1);
}

const { neon, neonConfig } = require('@neondatabase/serverless');
const sql = neon(DATABASE_URL, neonConfig);

async function main() {
  const schoolCode = process.argv[2] || 'yan-thi-2026';
  const teacherEmail = process.argv[3] || 'booksilverpine@gmail.com';

  console.log('Looking up school:', schoolCode);
  const schools = await sql`
    SELECT id, name, code FROM schools WHERE code = ${schoolCode}
  `;

  if (schools.length === 0) {
    console.error('School not found with code:', schoolCode);
    process.exit(1);
  }

  const school = schools[0];
  console.log('Found school:', school.name, 'ID:', school.id);

  console.log('\nLooking up teacher:', teacherEmail);
  const teachers = await sql`
    SELECT id, name, email, school_id, onboarding_status, type
    FROM users
    WHERE email = ${teacherEmail} AND type = 'teacher'
  `;

  if (teachers.length === 0) {
    console.error('Teacher not found with email:', teacherEmail);
    process.exit(1);
  }

  const teacher = teachers[0];
  console.log('Found teacher:', teacher.name, 'ID:', teacher.id);
  console.log('Current school_id:', teacher.school_id);
  console.log('Current onboarding_status:', teacher.onboarding_status);

  // Update teacher's school
  console.log('\nUpdating teacher with school...');
  await sql`
    UPDATE users
    SET school_id = ${school.id},
        onboarding_status = 'pending_enrollment',
        updated_at = NOW()
    WHERE id = ${teacher.id}
  `;

  console.log('✓ Teacher updated!');
  console.log('  - school_id:', school.id);
  console.log('  - onboardingStatus: pending_enrollment');

  console.log('\nDone! Teacher should now appear in /school-admin/teachers/pending');
}

main().catch(console.error);
