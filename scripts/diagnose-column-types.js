/**
 * Diagnose column types for problematic columns
 */
require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function diagnose() {
  const sql = neon(process.env.DATABASE_URL);

  const columns = [
    { table: 'schools', col: 'contact_email' },
    { table: 'schools', col: 'contact_phone' },
    { table: 'schools', col: 'tenant_id' },
    { table: 'schools', col: 'subscription_tier' },
  ];

  console.log('Column Type Diagnosis:\n');
  console.log('Table\t\tColumn\t\t\tDB Type\t\tExpected');
  console.log(''.padEnd(80, '-'));

  for (const { table, col } of columns) {
    const result = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = ${table}
      AND column_name = ${col}
    `;

    if (result.length > 0) {
      const dbType = result[0].data_type;
      const expected = 'text';
      const status = dbType === expected ? '✓' : '✗';
      console.log(`${table.padEnd(15)}${col.padEnd(20)}${dbType.padEnd(15)}${expected}\t${status}`);
    } else {
      console.log(`${table.padEnd(15)}${col.padEnd(20)}NOT FOUND`);
    }
  }

  // Also check if there are any json columns that might be typos
  console.log('\n\nAll JSON columns in schools table:');
  const jsonCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'schools'
    AND data_type IN ('json', 'jsonb')
    ORDER BY column_name
  `;

  if (jsonCols.length > 0) {
    jsonCols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
  } else {
    console.log('  (none)');
  }
}

diagnose().catch(console.error);
