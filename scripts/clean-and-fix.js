/**
 * Clean and fix assessment_types.target_audience
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function cleanAndFix() {
  console.log('=== CLEANING AND FIXING assessment_types.target_audience ===\n');

  // First, see what data exists
  console.log('Checking existing data...');
  const data = await sql.query(`
    SELECT id, name, target_audience
    FROM assessment_types
    LIMIT 10;
  `);
  console.table(data);

  console.log('\nChecking unique values...');
  const unique = await sql.query(`
    SELECT DISTINCT target_audience
    FROM assessment_types;
  `);
  console.table(unique);

  // Update all invalid values to empty array
  console.log('\nCleaning data...');
  await sql.query(`
    UPDATE assessment_types
    SET target_audience = '[]'
    WHERE target_audience IS NULL
       OR target_audience = ''
       OR target_audience::text = 'none'
       OR target_audience::text LIKE '%all%'
       OR target_audience::text NOT LIKE '{%';
  `);

  console.log('Data cleaned. Now converting...');

  try {
    await sql.query(`
      ALTER TABLE assessment_types ALTER COLUMN target_audience SET DATA TYPE json
      USING target_audience::json;
    `);
    console.log('✓ Fixed!');
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }
}

cleanAndFix().catch(console.error);