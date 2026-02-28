require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function fixSchoolsSchema() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Fixing schools table schema...\n');

  const fixes = [
    'ALTER TABLE schools ALTER COLUMN contact_email TYPE text USING contact_email::text',
    'ALTER TABLE schools ALTER COLUMN contact_phone TYPE text USING contact_phone::text',
    'ALTER TABLE schools ALTER COLUMN tenant_id TYPE text USING tenant_id::text',
    'ALTER TABLE schools ALTER COLUMN subscription_tier TYPE text USING subscription_tier::text',
  ];

  for (const fix of fixes) {
    try {
      await sql.unsafe(fix);
      console.log('✓', fix);
    } catch (err) {
      console.log('✗', fix);
      console.log('  Error:', err.message);
    }
  }

  console.log('\nDone! Verifying...\n');
  
  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'schools' 
    AND column_name IN ('contact_email', 'contact_phone', 'tenant_id', 'subscription_tier')
  `;
  
  cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
}

fixSchoolsSchema().catch(console.error);
