/**
 * Fix all JSON columns in hostel-related tables
 * Converts text columns to json with proper casting
 */

require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function fixHostelJsonColumns() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  const fixes = [
    // hostel_rooms table
    {
      table: 'hostel_rooms',
      column: 'bed_details',
      default: '[]',
    },
    // room_inspections table
    {
      table: 'room_inspections',
      column: 'findings',
      default: '[]',
    },
    {
      table: 'room_inspections',
      column: 'prohibited_items',
      default: '[]',
    },
    {
      table: 'room_inspections',
      column: 'photo_urls',
      default: '[]',
    },
    // hostel_facilities table
    {
      table: 'hostel_facilities',
      column: 'available_days',
      default: '[]',
    },
    {
      table: 'hostel_facilities',
      column: 'equipment',
      default: '[]',
    },
    {
      table: 'hostel_facilities',
      column: 'rules',
      default: '[]',
    },
    // hostel_mess table
    {
      table: 'hostel_mess',
      column: 'cooks',
      default: '[]',
    },
    // hostel_complaints table
    {
      table: 'hostel_complaints',
      column: 'photo_urls',
      default: '[]',
    },
    // hostel_visitors table
    {
      table: 'hostel_visitors',
      column: 'items_brought',
      default: '[]',
    },
  ];

  for (const fix of fixes) {
    try {
      console.log(`Fixing ${fix.table}.${fix.column}...`);
      await sql.unsafe(
        `ALTER TABLE "${fix.table}" ALTER COLUMN "${fix.column}" SET DATA TYPE json USING COALESCE(${fix.column}::json, '${fix.default}'::json)`
      );
      console.log(`  ✓ Fixed ${fix.table}.${fix.column}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⊙ Skipped ${fix.table}.${fix.column} (already json)`);
      } else if (error.message.includes('column cannot be cast')) {
        console.error(`  ✗ Failed ${fix.table}.${fix.column}: ${error.message}`);
      } else {
        console.log(`  ⊙ Skipped ${fix.table}.${fix.column}: ${error.message}`);
      }
    }
  }

  console.log('\n✓ Hostel JSON columns fix complete!');
  process.exit(0);
}

fixHostelJsonColumns();