/**
 * Cleanup Test School Admin Applications
 *
 * This script removes test/demo entries from school_admin_applications
 * that were created during development.
 *
 * Usage: node scripts/cleanup-test-applications.js
 */

const { neon } = require('@neondatabase/serverless');

// Load environment variables
require('dotenv').config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

// Create database connection
const sql = neon(process.env.DATABASE_URL);

async function cleanupApplications() {
  try {
    console.log('🔍 Checking school_admin_applications table...\n');

    // Get all applications with their school and user details
    const applications = await sql`
      SELECT
        saa.id,
        saa.status,
        saa.created_at,
        u.name as user_name,
        u.email as user_email,
        s.name as school_name,
        s.code as school_code
      FROM school_admin_applications saa
      LEFT JOIN users u ON saa.user_id = u.id
      LEFT JOIN schools s ON saa.school_id = s.id
      ORDER BY saa.created_at DESC
    `;

    console.log(`Found ${applications.length} applications:\n`);

    if (applications.length === 0) {
      console.log('✅ No applications found. Table is clean.');
      return;
    }

    // Display each application
    applications.forEach((app, i) => {
      console.log(`${i + 1}. ${app.school_name || 'Unknown School'} (${app.school_code || 'N/A'})`);
      console.log(`   User: ${app.user_name || 'Unknown'} (${app.user_email || 'N/A'})`);
      console.log(`   Status: ${app.status}`);
      console.log(`   ID: ${app.id}`);
      console.log('');
    });

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Delete ALL applications? (yes/no): ', async (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'yes') {
        console.log('\n🗑️  Deleting applications...');

        const result = await sql`DELETE FROM school_admin_applications`;

        console.log(`✅ Deleted ${result.count} applications`);
        console.log('\nThe table is now clean. New applications will be created when school-admins sign up.');
      } else {
        console.log('❌ Cancelled. No changes made.');
      }

      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupApplications();
