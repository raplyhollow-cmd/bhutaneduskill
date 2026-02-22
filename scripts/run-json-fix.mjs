import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

// Read the SQL file
const sqlContent = readFileSync("drizzle/fix-json-columns.sql", "utf8");

// Split into individual statements (handle DO $$ blocks specially)
const statements = [];

// First, extract DO $$ blocks
const doBlockRegex = /DO \$\$[\s\S]*?END \$\$/g;
let remaining = sqlContent;
let match;

while ((match = doBlockRegex.exec(remaining)) !== null) {
  statements.push(match[0]);
  remaining = remaining.substring(0, match.index) + remaining.substring(match.index + match[0].length);
  doBlockRegex.lastIndex = 0; // Reset for next search
}

// Now split remaining content by semi-colons
const remainingStatements = remaining
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));

statements.push(...remainingStatements);

console.log(`Found ${statements.length} statements to execute...`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i].trim();
  if (!stmt) continue;

  const preview = stmt.substring(0, 60).replace(/\n/g, " ");

  try {
    await sql.query(stmt);
    console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
    successCount++;
  } catch (err) {
    const msg = err.message || "";
    if (msg.includes("cannot be cast") || msg.includes("already exists")) {
      console.log(`⚠ [${i + 1}/${statements.length}] ${preview}...`);
      console.log(`   ${msg.substring(0, 100)}`);
      skipCount++;
    } else if (msg.includes("does not exist")) {
      console.log(`⊘ [${i + 1}/${statements.length}] Table doesn't exist: ${preview}...`);
      skipCount++;
    } else {
      console.log(`✗ [${i + 1}/${statements.length}] ${preview}...`);
      console.log(`   Error: ${msg.substring(0, 150)}`);
      errorCount++;
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`✓ Success: ${successCount}`);
console.log(`⚠ Skipped: ${skipCount}`);
console.log(`✗ Errors: ${errorCount}`);
console.log(`Total: ${statements.length}`);
