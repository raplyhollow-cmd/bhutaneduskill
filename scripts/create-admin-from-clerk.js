/**
 * Create Platform Admin Using Clerk API
 *
 * Usage:
 *   node scripts/create-admin-from-clerk.js "email" "firstName" "lastName"
 */

const { neon } = require('@neondatabase/serverless');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!DATABASE_URL || !CLERK_SECRET_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const email = process.argv[2];
const firstName = process.argv[3] || 'Admin';
const lastName = process.argv[4] || 'User';

if (!email) {
  console.log('Usage: node scripts/create-admin-from-clerk.js "email" "firstName" "lastName"');
  process.exit(1);
}

async function createPlatformAdmin() {
  const sql = neon(DATABASE_URL);

  try {
    console.log('🔐 Creating Platform Admin User');
    console.log('================================\n');
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}\n`);

    // Step 1: Check if user exists in Clerk
    console.log('📧 Step 1: Checking Clerk for existing user...');
    const clerkCheckResponse = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let clerkUserId;
    const clerkUsers = await clerkCheckResponse.json();
    const existingClerkUser = clerkUsers.find(u => u.email_addresses?.[0]?.email_address === email);

    if (existingClerkUser) {
      console.log(`   ✅ Found existing Clerk user: ${existingClerkUser.id}`);
      clerkUserId = existingClerkUser.id;
    } else {
      console.log('   ℹ️  User not found in Clerk, creating...');
      const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!1Aa';

      const clerkCreateResponse = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_addresses: [{
            email_address: email,
            verification: { status: 'verified' }
          }],
          first_name: firstName,
          last_name: lastName,
          skip_password_requirements: true,
          password: password,
        }),
      });

      if (!clerkCreateResponse.ok) {
        const error = await clerkCreateResponse.json();
        console.error('   ❌ Failed to create Clerk user:', error);
        process.exit(1);
      }

      const newClerkUser = await clerkCreateResponse.json();
      clerkUserId = newClerkUser.id;
      console.log(`   ✅ Created Clerk user: ${clerkUserId}`);
      console.log(`   📧 Password: ${password} (save this!)`);
    }

    // Step 2: Check/create database user
    console.log('\n📊 Step 2: Checking database...');
    const existingDbUser = await sql`
      SELECT id, email, clerk_user_id, type, role FROM users
      WHERE clerk_user_id = ${clerkUserId}
      LIMIT 1
    `;

    if (existingDbUser.length > 0) {
      console.log(`   ✅ Found existing database user: ${existingDbUser[0].id}`);

      // Update to platform admin if needed
      if (existingDbUser[0].type !== 'admin') {
        await sql`
          UPDATE users
          SET type = 'admin',
              role = 'platform_admin',
              is_active = true,
              updated_at = NOW()
          WHERE id = ${existingDbUser[0].id}
        `;
        console.log('   ✅ Updated to platform admin');
      }

      console.log('\n✅ User is ready! Sign in at: http://localhost:3003/signin');
      process.exit(0);
    }

    // Step 3: Create new database user
    console.log('\n👤 Step 3: Creating database user...');
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    await sql`
      INSERT INTO users (
        id,
        clerk_user_id,
        type,
        role,
        name,
        first_name,
        last_name,
        email,
        phone,
        grade,
        section,
        country,
        enrollment_date,
        onboarding_status,
        is_active,
        email_verified,
        onboarding_complete,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${clerkUserId},
        'admin',
        'platform_admin',
        ${`${firstName} ${lastName}`},
        ${firstName},
        ${lastName},
        ${email},
        '',
        0,
        '',
        'Bhutan',
        ${now},
        'complete',
        true,
        true,
        true,
        ${now},
        ${now}
      )
    `;

    console.log(`   ✅ Created database user with Clerk ID: ${clerkUserId}`);
    console.log(`   ✅ Database User ID: ${userId}`);

    // Add to user_roles
    try {
      await sql`
        INSERT INTO user_roles (user_id, role, created_at, updated_at)
        VALUES (${userId}, 'platform_admin', NOW(), NOW())
      `;
      console.log('   ✅ Added to user_roles');
    } catch (err) {
      console.log('   ⚠️  user_roles table might not exist');
    }

    console.log('\n✅ Platform admin created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   Clerk User ID: ${clerkUserId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Role: platform_admin`);
    console.log('\n🔑 Sign in at: http://localhost:3003/signin');
    console.log(`   Will redirect to: http://localhost:3003/admin\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createPlatformAdmin()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
