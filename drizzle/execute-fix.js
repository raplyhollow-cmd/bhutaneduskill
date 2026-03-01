import { neon } from "@neondatabase/serverless";
import * as sql from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const sqlContent = sql.readFileSync("drizzle/fix-json-columns.sql", "utf8");
const client = neon(process.env.DATABASE_URL || "");

async function executeSQL() {
  console.log("Executing SQL fixes...");

  // Split by semicolon and execute each statement
  const statements = sqlContent
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    try {
      // Neon HTTP client doesn't support arbitrary SQL execution
      // We can only use prepared queries through the ORM
      console.log("Skipping (Neon HTTP doesn't support arbitrary SQL):", statement.substring(0, 50));
    } catch (e) {
      console.error("Error:", e.message);
    }
  }

  console.log("\nNote: Neon HTTP driver doesn't support arbitrary SQL execution.");
  console.log("The SQL fixes must be applied via:");
  console.log("1. Neon Console: https://console.neon.tech/");
  console.log("2. Or use psql with your DATABASE_URL");

  process.exit(0);
}

executeSQL();