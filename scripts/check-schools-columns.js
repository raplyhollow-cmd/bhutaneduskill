/**
 * Check which columns are missing from the schools table
 */

const { neon } = require('@neondatabase/serverless');

async function checkSchoolsColumns() {
  const sql = neon(process.env.DATABASE_URL);

  // Get all columns in schools table
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'schools'
    ORDER BY ordinal_position
  `;

  console.log('Schools table columns (' + columns.length + ' total):');
  columns.forEach((col) => {
    console.log(`  - ${col.column_name} (${col.data_type})`);
  });

  // Expected columns from schema
  const expected = [
    "id", "name", "code", "type", "address", "city", "state", "country", "postal_code",
    "phone", "email", "website", "logo", "established_year", "accreditation_status",
    "max_students", "campus_size", "facilities", "board", "principal_name",
    "principal_email", "principal_phone", "counselor_name", "counselor_email",
    "counselor_phone", "vice_principal_name", "school_type", "level", "contact_email",
    "contact_phone", "district_id", "tenant_id", "is_active", "subscription_status",
    "subscription_tier", "activated_at", "setup_complete", "setup_completed_at",
    "current_session_year", "fee_generation_date", "fee_generation_status",
    "created_at", "updated_at"
  ];

  const existing = columns.map(c => c.column_name);
  const missing = expected.filter(c => !existing.includes(c));

  if (missing.length > 0) {
    console.log('\n⚠️  Missing columns:');
    missing.forEach(col => console.log(`  - ${col}`));
  } else {
    console.log('\n✅ All expected columns exist');
  }
}

checkSchoolsColumns()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
