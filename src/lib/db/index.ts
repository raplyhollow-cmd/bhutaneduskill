/**
 * Database Configuration
 *
 * Supports:
 * - Local Development: SQLite (better-sqlite3)
 * - Production: Neon PostgreSQL
 *
 * Environment Variables:
 * - DATABASE_URL: Neon PostgreSQL connection string (production)
 * - (no env): Uses local SQLite file "local.db"
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Determine database type
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

let db: ReturnType<typeof drizzle<typeof schema>>;

if (databaseUrl && isProduction) {
  // PRODUCTION: Use Neon PostgreSQL
  console.log("🔌 Using Neon PostgreSQL (production)");

  const neonClient = neon(databaseUrl, {
    fetchOptions: {
      cache: "no-store",
    },
  });

  db = drizzleNeon(neonClient, { schema });
} else if (databaseUrl && databaseUrl.startsWith("postgres")) {
  // PRODUCTION: Direct PostgreSQL connection (alternative)
  console.log("🔌 Using PostgreSQL (production)");

  const neonClient = neon(databaseUrl);
  db = drizzleNeon(neonClient, { schema });
} else {
  // LOCAL: Use SQLite
  console.log("📁 Using SQLite (local development)");

  const sqlite = new Database(process.env.DATABASE_LOCAL_PATH || "local.db");

  // Enable foreign keys
  sqlite.pragma("foreign_keys = ON");

  db = drizzle(sqlite, { schema });
}

export { db };

/**
 * Helper function to check database type
 */
export function getDatabaseType(): "sqlite" | "neon" | "postgresql" {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    if (databaseUrl.includes("neon.tech") || databaseUrl.includes("postgres")) {
      return "neon";
    }
  }

  return "sqlite";
}

/**
 * Helper for boolean conversion (SQLite uses integers)
 */
export function toBoolean(value: number | string | boolean | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value === "1" || value.toLowerCase() === "true";
  return false;
}

/**
 * Helper for boolean storage (SQLite uses integers)
 */
export function fromBoolean(value: boolean | null | undefined): number {
  return value ? 1 : 0;
}
