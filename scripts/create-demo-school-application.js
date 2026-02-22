/**
 * Create Demo School Admin Application
 *
 * This script creates a demo school admin application for testing
 * the platform admin approval workflow.
 *
 * Usage: node scripts/create-demo-school-application.js
 */

const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

// Load environment variables
require('dotenv').config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

// Create database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function createDemoApplication() {
  try {
    console.log('🔍 Checking for existing demo data...');

    // Check if demo school exists
    const existingSchools = await sql`
      SELECT id, name, code FROM schools WHERE code = 'DEMO2025'
    `;

    let schoolId;
    if (existingSchools.length > 0) {
      schoolId = existingSchools[0].id;
      console.log(`✅ Found existing demo school: ${existingSchools[0].name}`);
    } else {
      // Create demo school - using all required fields from schema
      const schoolIdValue = 'school_demo_' + Date.now();
      const [newSchool] = await sql`
        INSERT INTO schools (
          id, name, code, type, address, city, state, country, postal_code,
          phone, email, website, logo, established_year, accreditation_status,
          max_students, campus_size, board, principal_name, principal_email,
          principal_phone, counselor_name, counselor_email, counselor_phone,
          vice_principal_name, is_active, created_at, updated_at
        )
        VALUES (
          ${schoolIdValue},
          'Demo International School',
          'DEMO2025',
          'private',
          '123 Education Street',
          'Thimphu',
          'Thimphu',
          'Bhutan',
          '11001',
          '+975 2 345 678',
          'info@demoschool.bt',
          'https://demoschool.bt',
          'https://demoschool.bt/logo.png',
          2005,
          'accredited',
          500,
          '5 acres',
          'BCSE',
          'Dr. Karma Wangchuk',
          'principal@demoschool.bt',
          '+975 17 234 567',
          'Ms. Tashi Deki',
          'counselor@demoschool.bt',
          '+975 17 345 678',
          'Mrs. Pema Lhamo',
          true,
          NOW(),
          NOW()
        )
        RETURNING id, name, code
      `;
      schoolId = newSchool.id;
      console.log(`✅ Created demo school: ${newSchool.name} (${newSchool.code})`);
    }

    // Check if demo user exists
    const existingUsers = await sql`
      SELECT id, name, email FROM users WHERE email = 'demo-admin@eduskill.bt'
    `;

    let userId;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`✅ Found existing demo user: ${existingUsers[0].name}`);
    } else {
      // Create demo user
      const userIdValue = 'user_demo_' + Date.now();
      const clerkIdValue = 'demo_clerk_' + Date.now();
      const [newUser] = await sql`
        INSERT INTO users (
          id, clerk_user_id, type, role, name, first_name, last_name, email, phone,
          school_id, profile_image, date_of_birth, gender, grade, section,
          roll_number, address, city, state, postal_code, country,
          parent_contact, parent_phone, emergency_contact, blood_group,
          enrollment_date, last_login, employee_id, subjects, email_verified,
          onboarding_complete, onboarding_status, is_active, created_at, updated_at
        )
        VALUES (
          ${userIdValue},
          ${clerkIdValue},
          'school-admin',
          'school-admin',
          'Demo School Admin',
          'Demo',
          'Admin',
          'demo-admin@eduskill.bt',
          '+975 17 123 456',
          ${schoolId},
          '',
          '1990-01-01',
          'other',
          0,
          '',
          '',
          '',
          'Thimphu',
          'Thimphu',
          '11001',
          'Bhutan',
          '',
          '',
          '',
          '',
          NOW(),
          NOW(),
          '',
          '',
          false,
          false,
          'pending_approval',
          true,
          NOW(),
          NOW()
        )
        RETURNING id, name, email
      `;
      userId = newUser.id;
      console.log(`✅ Created demo user: ${newUser.name} (${newUser.email})`);
    }

    // Update user's school_id if not set (for existing users)
    await sql`
      UPDATE users SET school_id = ${schoolId} WHERE id = ${userId}
    `;
    console.log(`✅ Linked user to school`);

    // Check if application already exists
    const existingApps = await sql`
      SELECT id, status FROM school_admin_applications
      WHERE user_id = ${userId} AND school_id = ${schoolId}
    `;

    if (existingApps.length > 0) {
      console.log(`⚠️  Application already exists with status: ${existingApps[0].status}`);
      console.log('   Deleting old application...');

      await sql`
        DELETE FROM school_admin_applications WHERE user_id = ${userId}
      `;
      console.log('✅ Old application deleted');
    }

    // Create demo school admin application
    const appIdValue = 'sa_app_demo_' + Date.now();
    const [newApp] = await sql`
      INSERT INTO school_admin_applications (
        id, user_id, school_id, status, payment_status, payment_amount,
        applied_at, created_at, updated_at, notes
      )
      VALUES (
        ${appIdValue},
        ${userId},
        ${schoolId},
        'pending_approval',
        'pending',
        10000,
        NOW(),
        NOW(),
        NOW(),
        'Demo application for testing approval workflow'
      )
      RETURNING id, status
    `;

    console.log('');
    console.log('🎉 Demo School Admin Application Created!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Application ID: ${newApp.id}`);
    console.log(`Status: ${newApp.status}`);
    console.log(`School: Demo International School (DEMO2025)`);
    console.log(`Admin: demo-admin@eduskill.bt`);
    console.log(`Payment: Nu. 10,000 (pending)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✨ You can now test the approval workflow at:');
    console.log('   /admin/school-admin-applications');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

createDemoApplication()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
