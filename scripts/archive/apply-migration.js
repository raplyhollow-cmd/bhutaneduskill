const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);
const migration = fs.readFileSync('drizzle/0006_thankful_masque.sql', 'utf8');
const statements = migration.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);

(async () => {
  console.log('Applying migration 0006...');
  for (const stmt of statements) {
    try {
      // Use tagged template syntax
      await sql.query(stmt);
      console.log('✓', stmt.substring(0, 60) + '...');
    } catch (e) {
      console.error('✗ Error:', e.message);
    }
  }
  console.log('Migration complete!');
  process.exit(0);
})();
