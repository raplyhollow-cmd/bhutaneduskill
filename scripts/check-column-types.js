require("dotenv/config");
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const columns = await sql`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'subjects'
    ORDER BY ordinal_position
  `;
  console.log("=== SUBJECTS TABLE COLUMN TYPES ===");
  columns.forEach(c => console.log(`  ${c.column_name}: ${c.udt_name}`));
})();
