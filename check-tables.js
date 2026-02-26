require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkTables() {
  try {
    console.log('Connected to:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('\n=== Tables in database ===');
    result.forEach(row => console.log(`- ${row.table_name}`));
    
    // Check specifically for wizard_progress and school_admin_applications
    const wizard = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wizard_progress'
      );
    `;
    console.log(`\nwizard_progress exists: ${wizard[0].exists}`);
    
    const schoolAdmin = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'school_admin_applications'
      );
    `;
    console.log(`school_admin_applications exists: ${schoolAdmin[0].exists}`);
    
    // Check users table structure for onboarding_status
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('onboarding_status', 'onboarding_complete')
      ORDER BY column_name;
    `;
    console.log('\n=== Users table columns ===');
    columns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkTables();
