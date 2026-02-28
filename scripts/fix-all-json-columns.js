/**
 * Comprehensive fix for ALL text columns that should be json
 * Scans database schema and fixes all mismatches at once
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

// From schema files - all tables that have json columns
const jsonColumns = {
  // Transport schema
  transport_routes: ['stops'],
  bus_attendance: ['pickup_location', 'drop_location'],
  transport_incidents: ['students_involved'],

  // Billing schema
  subscription_plans: ['features', 'metadata'],
  invoices: ['payment_details', 'line_items'],
  discount_codes: ['applicable_plans'],
  payments: ['metadata'],

  // BCSE schema
  bcse_registrations: ['subjects', 'documents'],
  bcse_results: ['subject_results'],
  bcse_sync_logs: ['error_details', 'request_data'],
  bcse_performance_tracking: ['subject_breakdown'],

  // Hostel schema (already fixed but include for safety)
  hostel_mess: ['weekly_menu', 'cooks'],
  hostel_rooms: ['bed_details'],
  room_inspections: ['findings', 'prohibited_items', 'photo_urls'],
  hostel_facilities: ['available_days', 'equipment', 'rules'],
  hostel_complaints: ['photo_urls'],
  hostel_visitors: ['items_brought'],

  // Library schema
  books: ['subjects', 'tags'],
  library_circulation: ['metadata'],

  // Assessment schema
  assessment_questions: ['question_data', 'options'],
  assessments: ['metadata'],

  // Main schema
  announcements: ['target_class_ids', 'target_user_ids'],
  homework: ['assigned_students'],
  classes: ['students', 'schedule'],
  users: ['interests'],
  schools: ['facilities', 'metadata'],

  // Counselor schema
  counselor_resources: ['tags', 'related_topics'],
  digital_resources: ['tags', 'download_history'],

  // Medical
  medical_records: ['allergies', 'medications'],

  // Career
  careers: ['skills', 'education_paths', 'related_careers'],
  career_matches: ['recommendations'],

  // AI
  ai_interactions: ['interaction_data', 'metadata'],

  // Students
  students: ['metadata'],
  teachers: ['metadata', 'qualifications'],
};

async function fixAllJsonColumns() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Scanning for text columns that should be json...\n');

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const [table, columns] of Object.entries(jsonColumns)) {
    for (const column of columns) {
      try {
        // Check current type
        const result = await sql\`
          SELECT data_type
          FROM information_schema.columns
          WHERE table_name = \${table}
          AND column_name = \${column}
        \`;

        if (result.length === 0) {
          console.log(\`⊙ Skip: \${table}.\${column} (table/column doesn't exist)\`);
          skipped++;
          continue;
        }

        const currentType = result[0].data_type;

        if (currentType === 'json') {
          console.log(\`✓ Already json: \${table}.\${column}\`);
          skipped++;
          continue;
        }

        if (currentType !== 'text') {
          console.log(\`⊙ Skip: \${table}.\${column} (is \${currentType}, not text)\`);
          skipped++;
          continue;
        }

        // Fix it
        console.log(\`Fixing: \${table}.\${column} (\${currentType} → json)\`);

        await sql.unsafe(\`
          ALTER TABLE "\${table}"
          ALTER COLUMN "\${column}"
          SET DATA TYPE json
          USING COALESCE(\${column}::json, '[]'::json)
        \`);

        console.log(\`  ✓ Fixed \${table}.\${column}\`);
        fixed++;

      } catch (error) {
        console.error(\`  ✗ Error \${table}.\${column}: \${error.message}\`);
        errors++;
      }
    }
  }

  console.log(\`\n=== Summary ===\`);
  console.log(\`Fixed: \${fixed}\`);
  console.log(\`Skipped: \${skipped}\`);
  console.log(\`Errors: \${errors}\`);

  if (fixed > 0) {
    console.log(\`\n✓ All JSON columns fixed! Now run 'npm run db:push'\`);
  }
}

fixAllJsonColumns();
