/**
 * Create Platform Admin User with RBAC
 *
 * Usage:
 *   node scripts/create-platform-admin.js "email" "firstName" "lastName"
 *
 * Example:
 *   node scripts/create-platform-admin.js "raplyhollow@gmail.com" "Rajiv" "Pradhan"
 */

const { neon } = require('@neondatabase/serverless');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Get command line arguments
const email = process.argv[2];
const firstName = process.argv[3] || 'Admin';
const lastName = process.argv[4] || 'User';

if (!email) {
  console.log('Usage: node scripts/create-platform-admin.js "email" "firstName" "lastName"');
  console.log('Example: node scripts/create-platform-admin.js "raplyhollow@gmail.com" "Rajiv" "Pradhan"');
  process.exit(1);
}

async function createPlatformAdmin() {
  const sql = neon(DATABASE_URL);

  try {
    console.log('🔐 Creating Platform Admin User');
    console.log('================================\n');
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}\n`);

    // Generate unique IDs
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    // Check if user already exists
    const existing = await sql`
      SELECT id, email FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      console.log('⚠️  User with this email already exists!');
      console.log(`   User ID: ${existing[0].id}`);
      console.log(`   Email: ${existing[0].email}`);

      // Update existing user to platform admin
      await sql`
        UPDATE users
        SET type = 'admin',
            role = 'platform_admin',
            is_active = true,
            updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;

      // Add/update admin role in user_roles
      try {
        await sql`
          INSERT INTO user_roles (user_id, role, created_at, updated_at)
          VALUES (${existing[0].id}, 'platform_admin', NOW(), NOW())
          ON CONFLICT (user_id) DO UPDATE SET role = 'platform_admin', updated_at = NOW()
        `;
        console.log('   ✅ Updated to platform admin');
      } catch (err) {
        console.log('   ⚠️  Could not update user_roles');
      }

      console.log('\n✅ Existing user updated to platform admin!');
      console.log('\n🔑 They can sign in at: http://localhost:3003/signin');
      process.exit(0);
    }

    // Create the user with all required fields
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
        ${userId},
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

    console.log('   ✅ User created in database');

    // Add to user_roles for RBAC
    try {
      await sql`
        INSERT INTO user_roles (user_id, role, created_at, updated_at)
        VALUES (${userId}, 'platform_admin', NOW(), NOW())
      `;
      console.log('   ✅ Added to user_roles');
    } catch (err) {
      console.log('   ⚠️  user_roles table might not exist');
    }

    // Grant all permissions
    const permissions = [
      'users.read', 'users.write', 'users.delete',
      'schools.read', 'schools.write', 'schools.delete',
      'schools.create', 'schools.update',
      'assessments.read', 'assessments.write', 'assessments.delete',
      'classes.read', 'classes.write', 'classes.delete',
      'homework.read', 'homework.write', 'homework.delete',
      'attendance.read', 'attendance.write', 'attendance.delete',
      'fees.read', 'fees.write', 'fees.delete',
      'reports.read', 'reports.write',
      'settings.read', 'settings.write',
      'counseling.read', 'counseling.write',
      'library.read', 'library.write',
      'transport.read', 'transport.write',
      'inventory.read', 'inventory.write',
      'system.admin',
    ];

    let permissionsAdded = 0;
    for (const permission of permissions) {
      try {
        await sql`
          INSERT INTO permissions (user_id, permission, created_at)
          VALUES (${userId}, ${permission}, NOW())
        `;
        permissionsAdded++;
      } catch (err) {
        // Permission table might not exist
      }
    }
    if (permissionsAdded > 0) {
      console.log(`   ✅ Added ${permissionsAdded} permissions`);
    }

    console.log('\n✅ Platform admin user created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Role: platform_admin`);
    console.log(`   Type: admin`);
    console.log('\n🔑 Next steps:');
    console.log(`   1. Go to Clerk Dashboard (https://dashboard.clerk.com)`);
    console.log(`   2. Create a user with email: ${email}`);
    console.log(`   3. Set a password for the user`);
    console.log(`   4. Sign in at: http://localhost:3003/signin`);
    console.log('\n💡 Note: The user is already created in the database.');
    console.log('   You just need to create the matching Clerk user for authentication.');

  } catch (error) {
    console.error('\n❌ Error creating platform admin:', error);
    process.exit(1);
  }
}

// Run the script
createPlatformAdmin()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
