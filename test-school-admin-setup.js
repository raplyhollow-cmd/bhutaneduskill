require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testSchoolAdminSetup() {
  try {
    console.log('Testing school-admin setup flow...\n');
    
    // 1. Check if we can select from users table
    console.log('1. Testing users table access...');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`   ✓ Users table accessible (${userCount[0].count} rows)\n`);
    
    // 2. Check wizard_progress structure
    console.log('2. Checking wizard_progress structure...');
    const wizardColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wizard_progress'
      ORDER BY ordinal_position;
    `;
    console.log('   Columns:', wizardColumns.map(c => c.column_name).join(', '));
    
    // 3. Check school_admin_applications structure  
    console.log('\n3. Checking school_admin_applications structure...');
    const appColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'school_admin_applications'
      ORDER BY ordinal_position;
    `;
    console.log('   Columns:', appColumns.map(c => c.column_name).join(', '));
    
    // 4. Test inserting into wizard_progress (what the API does)
    console.log('\n4. Testing wizard_progress insert...');
    const testId = 'test_' + Date.now();
    const testUserId = 'test_user_' + Date.now();
    
    try {
      await sql`
        INSERT INTO wizard_progress (id, user_id, current_step, completed_steps, data, is_completed, last_updated, created_at, updated_at)
        VALUES (${testId}, ${testUserId}, '1', '[]'::jsonb, '{}'::jsonb, false, NOW(), NOW(), NOW())
      `;
      console.log('   ✓ wizard_progress insert works');
      
      await sql`DELETE FROM wizard_progress WHERE id = ${testId}`;
      console.log('   ✓ wizard_progress delete works\n');
    } catch (err) {
      console.error('   ✗ wizard_progress insert failed:', err.message);
      console.error('   Error detail:', err);
    }
    
    // 5. Test inserting into school_admin_applications
    console.log('5. Testing school_admin_applications insert...');
    const appId = 'sa_app_test_' + Date.now();
    try {
      await sql`
        INSERT INTO school_admin_applications (id, user_id, school_id, status, payment_status, applied_at, created_at, updated_at)
        VALUES (${appId}, ${testUserId}, 'test_school', 'pending_approval', 'pending', NOW(), NOW(), NOW())
      `;
      console.log('   ✓ school_admin_applications insert works');
      
      await sql`DELETE FROM school_admin_applications WHERE id = ${appId}`;
      console.log('   ✓ school_admin_applications delete works\n');
    } catch (err) {
      console.error('   ✗ school_admin_applications insert failed:', err.message);
      console.error('   Error detail:', err);
    }
    
    // 6. Check schools table for code column
    console.log('6. Checking schools table structure (for code lookup)...');
    const schoolColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'schools'
      AND column_name = 'code';
    `;
    if (schoolColumns.length > 0) {
      console.log(`   ✓ schools.code exists (${schoolColumns[0].data_type})`);
    } else {
      console.log('   ✗ schools.code does NOT exist');
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error('Stack:', error.stack);
  }
  process.exit(0);
}

testSchoolAdminSetup();
