/**
 * Scan for columns that are JSON in DB but should be TEXT in schema
 * Compares schema definitions against actual database types
 */
require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read schema files to extract expected types
function getExpectedTypesFromSchemas() {
  const schemaDir = path.join(__dirname, '../src/lib/db');
  const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('-schema.ts') || f === 'schema.ts');

  const expected = {};
  // Text columns that should NOT be json
  const textColumnNames = [
    'contact_email', 'contact_phone', 'tenant_id', 'subscription_tier',
    'school_id', 'user_id', 'teacher_id', 'student_id', 'parent_id',
    'email', 'phone', 'name', 'code', 'status', 'type', 'tier',
    'first_name', 'last_name', 'middle_name', 'address', 'city',
    'country', 'zip_code', 'state', 'region', 'district',
    'description', 'notes', 'comments', 'reason', 'message',
    'title', 'subject', 'grade', 'class', 'section',
    'plan_id', 'plan_type', 'billing_cycle', 'currency',
    'payment_method', 'transaction_id', 'reference',
  ];

  for (const file of schemaFiles) {
    const content = fs.readFileSync(path.join(schemaDir, file), 'utf8');
    // Find text("column_name") patterns
    const textMatches = content.matchAll(/text\("([^"]+)"\)/g);
    for (const match of textMatches) {
      expected[match[1]] = 'text';
    }
  }

  return expected;
}

async function scanDatabase() {
  const sql = neon(process.env.DATABASE_URL);

  // Get all columns that are json/jsonb in the database
  const jsonColumns = await sql`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type IN ('json', 'jsonb')
    ORDER BY table_name, column_name
  `;

  console.log(`Found ${jsonColumns.length} JSON columns in database\n`);

  // Check which ones are commonly text column names
  const suspicious = [];
  const textColumnNames = [
    'email', 'phone', 'contact', 'name', 'code', 'status', 'type', 'tier',
    'id', '_id', 'tenant', 'school', 'user', 'teacher', 'student', 'parent',
    'plan', 'billing', 'currency', 'payment', 'transaction', 'reference',
    'first_name', 'last_name', 'middle_name', 'address', 'description',
    'notes', 'comments', 'reason', 'message', 'title', 'subject',
  ];

  for (const col of jsonColumns) {
    const colName = col.column_name.toLowerCase();
    const isSuspicious = textColumnNames.some(keyword => colName.includes(keyword));

    if (isSuspicious) {
      suspicious.push(col);
    }
  }

  if (suspicious.length > 0) {
    console.log(`⚠️  Found ${suspicious.length} SUSPICIOUS JSON columns (should probably be text):\n`);
    console.log('Table'.padEnd(30) + 'Column'.padEnd(25) + 'Current Type');
    console.log(''.padEnd(75, '-'));
    for (const col of suspicious) {
      console.log(`${col.table_name.padEnd(30)}${col.column_name.padEnd(25)}${col.data_type}`);
    }
  } else {
    console.log('✓ No suspicious JSON columns found');
  }

  // Specific check for the reported problem columns
  console.log('\n\n--- Specific check for reported problem columns ---\n');
  const problemColumns = [
    { table: 'schools', col: 'contact_email' },
    { table: 'schools', col: 'contact_phone' },
    { table: 'schools', col: 'tenant_id' },
    { table: 'schools', col: 'subscription_tier' },
  ];

  console.log('Table\t\tColumn\t\t\tDB Type\t\tExpected\tStatus');
  console.log(''.padEnd(85, '-'));

  for (const { table, col } of problemColumns) {
    const result = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = ${table}
      AND column_name = ${col}
    `;

    if (result.length > 0) {
      const dbType = result[0].data_type;
      const expected = 'text';
      const status = dbType === expected ? '✓ OK' : '✗ WRONG';
      console.log(`${table.padEnd(15)}${col.padEnd(20)}${dbType.padEnd(15)}${expected.padEnd(10)}${status}`);
    } else {
      console.log(`${table.padEnd(15)}${col.padEnd(20)}NOT FOUND`);
    }
  }
}

scanDatabase().catch(console.error);
