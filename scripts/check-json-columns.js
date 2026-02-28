require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkJsonColumns() {
  const sql = neon(process.env.DATABASE_URL);

  const jsonCols = await sql`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type IN ('json', 'jsonb')
    ORDER BY table_name, column_name
  `;

  console.log(`✓ Found ${jsonCols.length} JSON columns\n`);

  // Check some key ones
  const keyChecks = [
    { table: 'announcements', col: 'target_class_ids' },
    { table: 'homework', col: 'assigned_students' },
    { table: 'hostel_mess', col: 'weekly_menu' },
    { table: 'subscription_plans', col: 'features' },
  ];

  for (const check of keyChecks) {
    const result = jsonCols.find(
      c => c.table_name === check.table && c.column_name === check.col
    );
    if (result) {
      console.log(`✓ ${check.table}.${check.col} → ${result.data_type}`);
    } else {
      console.log(`⊙ ${check.table}.${check.col} → not found or not json`);
    }
  }
}

checkJsonColumns().catch(console.error);