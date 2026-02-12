import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";
import { promises as fs } from "fs";
import path from "path";

export async function runMigrations() {
  console.log("Running migrations...");

  try {
    await migrate(db as any, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("Migrations completed!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
