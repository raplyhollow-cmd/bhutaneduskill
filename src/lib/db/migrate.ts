import { logger } from "@/lib/logger";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";
import { promises as fs } from "fs";
import path from "path";

// Extended type for database connection with migration support
type MigratableDatabase = {
  connection: unknown;
  dialect: "libsql" | "postgresql" | "mysql" | "better-sqlite";
};

export async function runMigrations() {
  logger.debug("Running migrations...");

  try {
    await migrate(db as any, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    logger.debug("Migrations completed!");
  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
