import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Check if we're using Turso (production) or local SQLite
const isProduction = !!process.env.TURSO_DATABASE_URL?.includes("libsql:") ||
                    !!process.env.TURSO_DATABASE_URL?.includes("https:") ||
                    !!process.env.TURSO_DATABASE_URL?.includes("wss:");

if (isProduction) {
  // Use Turso for production
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  var db = drizzleLibsql(client, { schema });
} else {
  // Use better-sqlite3 for local development
  const sqlite = new Database(process.env.TURSO_DATABASE_URL || "local.db");
  var db = drizzle(sqlite, { schema });
}

export { db };
