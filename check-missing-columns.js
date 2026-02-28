require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkColumns() {
  const sql = neon(process.env.DATABASE_URL);

  const needed = ['current_session_year', 'fee_generation_date', 'fee_generation_status', 'subscription_status', 'activated_at', 'setup_complete', 'setup_completed_at'];
  
  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'schools'
  `;
  
  const existing = cols.map(c => c.column_name);
  
  console.log('Missing columns:');
  needed.forEach(n => {
    const exists = existing.includes(n);
    console.log(`  ${n}: ${exists ? 'EXISTS' : 'MISSING'}`);
  });
}

checkColumns().catch(console.error);
