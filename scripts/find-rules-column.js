const { neon } = require('@neondatabase/serverless');

async function findRulesColumn() {
  const sql = neon(process.env.DATABASE_URL);

  const result = await sql`
    SELECT table_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE column_name = 'rules'
    ORDER BY table_name
  `;

  console.log('Tables with "rules" column:');
  console.table(result);
}

findRulesColumn().catch(console.error);
