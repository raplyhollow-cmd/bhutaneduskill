require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkTableColumns() {
  const sql = neon(process.env.DATABASE_URL);

  const tables = ['announcements', 'homework'];

  for (const table of tables) {
    const cols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = ${table}
      ORDER BY ordinal_position
    `;
    console.log(`\n${table} table:`);
    cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
  }
}

checkTableColumns().catch(console.error);