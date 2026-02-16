/**
 * Database Configuration - Neon PostgreSQL Only
 *
 * Environment Variables:
 * - DATABASE_URL: Neon PostgreSQL connection string (required)
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Only use this file in server components or API routes
// For client components, use server actions instead

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
  throw new Error("DATABASE_URL must be a PostgreSQL connection string");
}

// Create Neon client
const neonClient = neon(databaseUrl, {
  fetchOptions: {
    cache: "no-store",
  },
});

// Create and export database instance
export const db = drizzle(neonClient, { schema });

/**
 * Get the current database type
 */
export function getDatabaseType(): "neon" | "postgresql" {
  return "neon";
}

// Export JSON parsing helpers
export * from "./json-helpers";
