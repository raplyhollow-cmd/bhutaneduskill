/**
 * Check subjects table constraints
 */
require("dotenv/config");
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    // Check constraints
    const constraints = await sql`
      SELECT
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'subjects'
    `;
    console.log("=== SUBJECTS TABLE CONSTRAINTS ===");
    constraints.forEach(c => console.log(`  ${c.constraint_name}: ${c.constraint_type}`));

    // Check unique constraints
    const uniqueCols = await sql`
      SELECT
        constraint_name,
        column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'subjects'
      AND constraint_name LIKE '%unique%'
    `;
    console.log("\n=== UNIQUE COLUMNS ===");
    uniqueCols.forEach(c => console.log(`  ${c.constraint_name}: ${c.column_name}`));

    // Check indexes
    const indexes = await sql`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'subjects'
    `;
    console.log("\n=== INDEXES ===");
    indexes.forEach(i => console.log(`  ${i.indexname}`));

    // Check if any subjects exist
    const existing = await sql`SELECT school_id, code FROM subjects LIMIT 10`;
    console.log("\n=== EXISTING SUBJECTS (if any) ===");
    if (existing.length === 0) {
      console.log("  No subjects found");
    } else {
      existing.forEach(s => console.log(`  ${s.school_id}: ${s.code}`));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
