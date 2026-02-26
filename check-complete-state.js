const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

async function checkEverything() {
  console.log('=== COMPLETE SYSTEM CHECK ===\n');

  // 1. Check Schools
  const schools = await sql`SELECT id, name, code FROM schools LIMIT 5`;
  console.log('Schools:', schools.length);
  schools.forEach(s => console.log(`  - ${s.name} (${s.code})`));
  console.log('');

  // 2. Check Classes
  const classes = await sql`
    SELECT id, name, grade, section, room_number, class_teacher_name
    FROM classes
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log('Classes:', classes.length);
  classes.forEach(c => {
    console.log(`  - ${c.name} (${c.grade} - ${c.section})`);
    console.log(`    Room: ${c.room_number}`);
    console.log(`    Class Teacher: ${c.class_teacher_name || 'None'}`);
    console.log('');
  });

  // 3. Check Teachers
  const teachers = await sql`
    SELECT id, name, email, onboarding_status, employee_id
    FROM users
    WHERE type = 'teacher'
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Teachers:', teachers.length);
  teachers.forEach(t => {
    console.log(`  - ${t.name} (${t.email})`);
    console.log(`    Status: ${t.onboarding_status}`);
    console.log(`    Employee ID: ${t.employee_id || 'None'}`);
    console.log('');
  });

  // 4. Check Subjects
  const subjects = await sql`
    SELECT id, name, code, grade, type
    FROM subjects
    ORDER BY grade, name
    LIMIT 10
  `;
  console.log('Subjects:', subjects.length);
  subjects.forEach(s => {
    console.log(`  - ${s.name} (${s.code})`);
    console.log(`    Grade: ${s.grade}, Type: ${s.type}`);
    console.log('');
  });

  // 5. Check Teacher Assignments
  const assignments = await sql`
    SELECT id, teacher_id, class_id, subject_id, role, is_primary
    FROM teacher_assignments
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log('Teacher Assignments:', assignments.length);
  assignments.forEach(a => {
    console.log(`  - ID: ${a.id}`);
    console.log(`    Teacher ID: ${a.teacher_id}`);
    console.log(`    Class ID: ${a.class_id}`);
    console.log(`    Subject ID: ${a.subject_id || 'None'}`);
    console.log(`    Role: ${a.role}`);
    console.log(`    Is Primary: ${a.is_primary}`);
    console.log('');
  });

  // 6. Check Students
  const students = await sql`
    SELECT id, name, email, class_id, onboarding_status
    FROM users
    WHERE type = 'student'
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Students:', students.length);
  students.forEach(s => {
    console.log(`  - ${s.name} (${s.email})`);
    console.log(`    Class ID: ${s.class_id || 'None'}`);
    console.log(`    Status: ${s.onboarding_status}`);
    console.log('');
  });

  process.exit(0);
}

checkEverything().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
