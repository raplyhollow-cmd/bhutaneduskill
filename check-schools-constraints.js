require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkSchoolsConstraints() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('\n=== SCHOOLS TABLE COLUMNS ===\n');
  const cols = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'schools'
    ORDER BY ordinal_position
  `;
  
  cols.forEach((c, i) => {
    console.log(`${i + 1}. ${c.column_name}: ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default || 'none'}`);
  });

  console.log('\n=== NOT NULL COLUMNS (no default) ===\n');
  const notNullCols = cols.filter(c => c.is_nullable === 'NO' && !c.column_default);
  notNullCols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
}

checkSchoolsConstraints().catch(console.error);
