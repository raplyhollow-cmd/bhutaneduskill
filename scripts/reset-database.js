/**
 * FACTORY RESET SCRIPT - Keep Assessments Only
 *
 * This script resets the database to factory state while preserving:
 * - Assessments (assessment_types, questions, career_matches)
 * - Schema/Structure
 *
 * Usage:
 *   node scripts/reset-database.js
 *
 * WARNING: This will delete ALL data except assessments!
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔄 Factory Reset Script - Keep Assessments Only');
console.log('===========================================\n');

async function resetDatabase() {
  const sql = neon(DATABASE_URL);

  try {
    console.log('⚠️  WARNING: This will delete ALL data except assessments!');
    console.log('');

    // Delete in correct order to handle foreign keys
    // Start with tables that reference others, work backwards

    const steps = [
      // Clear assessments data first (keep assessment_types and questions)
      { name: 'User assessments', sql: sql`DELETE FROM assessments` },
      { name: 'Career matches', sql: sql`DELETE FROM career_matches` },

      // Classes (references users, schools)
      { name: 'Classes', sql: sql`DELETE FROM classes` },
      { name: 'Timetable entries', sql: sql`DELETE FROM timetable_entries` },

      // Student-related data
      { name: 'Exam results', sql: sql`DELETE FROM exam_results_enhanced` },
      { name: 'Enrollments', sql: sql`DELETE FROM enrollments` },
      { name: 'Homework submissions', sql: sql`DELETE FROM homework_submissions` },
      { name: 'Homework', sql: sql`DELETE FROM homework` },

      // Attendance & Leave
      { name: 'Leave balances', sql: sql`DELETE FROM leave_balances` },
      { name: 'Leave requests', sql: sql`DELETE FROM leave_requests` },
      { name: 'Attendance', sql: sql`DELETE FROM attendance` },

      // Fees
      { name: 'Fee payments', sql: sql`DELETE FROM fee_payments` },
      { name: 'Student fees', sql: sql`DELETE FROM student_fees` },

      // Counseling
      { name: 'Counseling notes', sql: sql`DELETE FROM counseling_notes` },
      { name: 'Counseling sessions', sql: sql`DELETE FROM counseling_sessions` },
      { name: 'Counselor interventions', sql: sql`DELETE FROM counselor_interventions` },
      { name: 'Counselor resources', sql: sql`DELETE FROM counselor_resources` },

      // Library
      { name: 'Library circulation', sql: sql`DELETE FROM library_circulation` },
      { name: 'Library books', sql: sql`DELETE FROM library_books` },

      // Transport
      { name: 'Transport allocations', sql: sql`DELETE FROM transport_allocations` },
      { name: 'Transport routes', sql: sql`DELETE FROM transport_routes` },

      // Tuition
      { name: 'Tuition enrollments', sql: sql`DELETE FROM tuition_enrollments` },
      { name: 'Tuition sessions', sql: sql`DELETE FROM tuition_sessions` },
      { name: 'Tuition courses', sql: sql`DELETE FROM tuition_courses` },

      // Inventory
      { name: 'Inventory items', sql: sql`DELETE FROM inventory_items` },

      // AI & Journal
      { name: 'AI chat history', sql: sql`DELETE FROM ai_chat_history` },
      { name: 'AI conversations', sql: sql`DELETE FROM ai_conversations` },
      { name: 'Mood history', sql: sql`DELETE FROM mood_history` },
      { name: 'Journal entries', sql: sql`DELETE FROM journal_entries` },
      { name: 'Journal prompts', sql: sql`DELETE FROM journal_prompts` },

      // RBAC
      { name: 'User roles', sql: sql`DELETE FROM user_roles` },

      // Notifications & Tickets
      { name: 'Notifications', sql: sql`DELETE FROM notifications` },
      { name: 'Support tickets', sql: sql`DELETE FROM support_tickets` },

      // Partners
      { name: 'Partners', sql: sql`DELETE FROM partners` },

      // NOW delete users (after all references are gone)
      { name: 'Users', sql: sql`DELETE FROM users` },

      // Schools & Tenants
      { name: 'Schools', sql: sql`DELETE FROM schools` },
      { name: 'Tenants', sql: sql`DELETE FROM tenants` },
    ];

    console.log('🗑️  Deleting data...\n');

    for (const step of steps) {
      try {
        await step.sql;
        console.log(`   ✅ ${step.name}`);
      } catch (error) {
        console.log(`   ⚠️  ${step.name} - ${error.message || 'skipped'}`);
      }
    }

    console.log('\n✅ Database reset complete!');
    console.log('\n📊 Preserved data:');
    console.log('   - assessment_types');
    console.log('   - questions');
    console.log('   - ecosystem_nodes');
    console.log('   - ecosystem_connections');

    console.log('\n🔐 Next steps:');
    console.log('   1. Create a new admin user:');
    console.log('      node scripts/make-platform-admin.js');
    console.log('   2. Or sign up at http://localhost:3003/signup');

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
