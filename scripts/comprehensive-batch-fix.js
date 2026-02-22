/**
 * COMPREHENSIVE BATCH FIX - Scan ALL columns and fix in batch
 * This will find EVERY column that needs type conversion and fix them all at once
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

async function comprehensiveBatchFix() {
  console.log('=== COMPREHENSIVE BATCH FIX ===\n');
  console.log('Scanning ALL columns in database...\n');

  // Get ALL columns except those already JSON or jsonb
  const result = await sql.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type NOT IN ('json', 'jsonb', 'integer', 'bigint', 'decimal', 'numeric', 'boolean', 'timestamp', 'date', 'time')
    ORDER BY table_name, ordinal_position;
  `);

  console.log(`Found ${result.length} non-primitive columns to analyze...\n`);

  // Build fix statements
  const batchStatements = [];
  const skipColumns = new Set([
    'id', 'name', 'title', 'description', 'email', 'phone', 'type', 'status',
    'created_at', 'updated_at', 'deleted_at', 'user_id', 'school_id', 'tenant_id',
    'parent_id', 'code', 'slug', 'address', 'city', 'country', 'zip', 'state',
    'first_name', 'last_name', 'full_name', 'username', 'password', 'avatar',
    'role', 'active', 'verified', 'blocked', 'suspended', 'cancelled',
    'start_date', 'end_date', 'due_date', 'issue_date', 'birth_date', 'joined_at',
    'contact_email', 'contact_phone', 'emergency_contact_name', 'emergency_contact_phone',
    'emergency_contact_relation', 'parent_contact_name', 'parent_contact_phone',
    'permission_id', 'asset_tag', // These are actual IDs, not JSON
    'scheduled_date', 'scheduled_start', 'scheduled_end',
    'qr_code_data', 'special_needs_details', 'property_details',
    'vendor_contact', 'vendor_contact_person', 'contact_person',
    'disbursement_schedule', 'scholarship_documents', 'supporting_documents',
    'additional_requirements', 'documents', 'min_qualification',
    'course_id', 'parent_id', 'teacher_id', 'class_id', 'section',
    'room_name', 'teacher_name', 'homeroom_teacher_name', 'class_teacher_name',
    'class_teacher_id', 'homeroom_teacher_id', 'roll_number', 'emergency_contact',
    'emergency_contact_id', 'emergency_contact_name', 'emergency_contact_email',
    'emergency_contact_phone', 'emergency_contact_relation',
    'parent_contact', 'guardian_contact', 'guardian_name', 'guardian_email',
    'guardian_phone', 'guardian_address', 'guardian_relation',
    'counselor_id', 'response_notes', 'parent_response', 'reason_details',
    'violation_details', 'bed_details', 'warden_contact', 'room_number',
    'meeting_notes', 'action_items', 'milestone_description', 'content',
    'config', 'context', 'details', 'info', 'data',
    'contact', 'note',
  ]);

  for (const row of result) {
    const table = row.table_name;
    const column = row.column_name;
    const key = `${table}.${column}`;

    if (skipColumns.has(column)) {
      continue;
    }

    // Check if this should be JSON based on naming
    const shouldBeJson =
      column.includes('_data') ||
      column.includes('_meta') ||
      column.includes('_config') ||
      column.includes('_content') ||
      column.includes('_info') ||
      column.includes('_detail') ||
      column.includes('_setting') ||
      column.includes('_option') ||
      column.includes('_tag') ||
      column.includes('_item') ||
      column.includes('_list') ||
      column.includes('_array') ||
      column.includes('_schedule') ||
      column.includes('_result') ||
      column.includes('_response') ||
      column.includes('_score') ||
      column.includes('_value') ||
      column.includes('_goal') ||
      column.includes('_milestone') ||
      column.includes('_criter') ||
      column.includes('_requirement') ||
      column.includes('_qualification') ||
      column.includes('_document') ||
      column.includes('_attachment') ||
      column.includes('_permission') ||
      column.includes('_issue') ||
      column.includes('_weakness') ||
      column.includes('_strength') ||
      column.includes('_skill') ||
      column.includes('_program') ||
      column.includes('_course') ||
      column.includes('_subject') ||
      column.includes('_grade') ||
      column.includes('_class') ||
      column.includes('_student') ||
      column.includes('_teacher') ||
      column.includes('_parent') ||
      column.includes('_child') ||
      column.includes('_contact') && !column.includes('_email') && !column.includes('_phone') ||
      column.includes('_layout') ||
      column.includes('_color') ||
      column.includes('_section') ||
      column.includes('_signature') ||
      column.includes('_break') ||
      column.includes('_working_day') ||
      column.includes('_period') ||
      column.includes('_term') ||
      column.includes('_rub') ||
      column.includes('_holiday') ||
      column.includes('_observed') ||
      column.includes('_exchange') ||
      column.includes('_translation') ||
      column.includes('_variable') ||
      column.includes('_channel') ||
      column.includes('_header') ||
      column.includes('_property') ||
      column.includes('_attribute') ||
      column.includes('_parameter') ||
      column.includes('_threshold') ||
      column.includes('_element') ||
      column.includes('_component') ||
      column.includes('_widget');

    if (shouldBeJson) {
      const dataType = row.data_type;
      const udtName = row.udt_name;
      const hasDefault = row.column_default !== null;

      // Handle user-defined types (arrays, enums, etc.)
      if (dataType === 'ARRAY' || udtName === '_text') {
        // Text array type
        batchStatements.push(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING json_build_array("${column}");`);
      } else if (dataType === 'USER-DEFINED') {
        // Check if it has a default first
        if (hasDefault) {
          batchStatements.push(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`);
        }
        batchStatements.push(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING COALESCE("${column}"::text::json, '[]'::json);`);
        batchStatements.push(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::json;`);
      } else {
        // Regular text type
        batchStatements.push(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING COALESCE("${column}"::json, '[]'::json);`);
      }
    }
  }

  console.log(`Generated ${batchStatements.length} fix statements...\n`);

  // Execute all fixes
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < batchStatements.length; i++) {
    const fix = batchStatements[i];
    try {
      // Extract table/column for display
      const match = fix.match(/"([^"]+)"/);
      const table = match ? match[1] : 'unknown';
      // Find column name after ALTER COLUMN
      const colMatch = fix.match(/ALTER COLUMN "([^"]+)"/);
      const column = colMatch ? colMatch[1] : 'unknown';

      process.stdout.write(`\r[${i + 1}/${batchStatements.length}] ${table}.${column}...`);

      await sql.query(fix);
      successCount++;
    } catch (error) {
      if (error.message.includes('already') || error.message.includes('42801')) {
        skipCount++;
      } else if (error.message.includes('does not exist')) {
        skipCount++;
      } else {
        errorCount++;
        console.log(`\n✗ Error: ${error.message.substring(0, 150)}`);
      }
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`\n=== DONE ===`);
}

comprehensiveBatchFix().catch(console.error);
