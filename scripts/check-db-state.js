/**
 * Check actual database state and compare with schema
 * This will tell us what's actually in the database vs what Drizzle thinks
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function checkDBState() {
  console.log('=== CHECKING DATABASE STATE ===\n');

  // Get all JSON columns in database
  const result = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name IN ('subjects', 'question_data', 'options', 'target_audience', 'related_issues', 'holland_codes', 'skills', 'rub_programs', 'programs', 'facilities', 'interests', 'emergency_contact', 'parent_contact', 'tags', 'strengths', 'weaknesses')
    ORDER BY table_name, column_name;
  `);

  console.log('Actual database state for key JSON columns:');
  console.table(result);

  // Check specifically for 'subjects' columns
  console.log('\n=== ALL "subjects" COLUMNS ===');
  const subjectsCols = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'subjects'
    ORDER BY table_name;
  `);
  console.table(subjectsCols);
}

checkDBState().catch(console.error);