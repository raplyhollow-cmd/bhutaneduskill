import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'homework' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;

  console.log("homework table columns:");
  columns.forEach((c: any) => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));
}

main().catch(console.error);
