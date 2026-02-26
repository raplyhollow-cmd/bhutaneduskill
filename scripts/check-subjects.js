/**
 * Check subjects table structure and data
 */
require("dotenv/config");
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    // Check subjects table structure
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'subjects'
      ORDER BY ordinal_position
    `;
    console.log("=== SUBJECTS TABLE COLUMNS ===");
    columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

    // Count subjects
    const count = await sql`SELECT COUNT(*) as count FROM subjects`;
    console.log("\n=== SUBJECTS COUNT ===");
    console.log(`  Total: ${count[0].count}`);

    // Sample subjects
    const samples = await sql`SELECT * FROM subjects LIMIT 5`;
    console.log("\n=== SAMPLE SUBJECTS ===");
    samples.forEach(s => console.log(`  ${s.code}: ${s.name} (Grade ${s.grade})`));
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
