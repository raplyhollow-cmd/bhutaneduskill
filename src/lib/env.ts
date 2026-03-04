/**
 * Environment Variables Validation
 *
 * Uses Zod to validate all environment variables at startup.
 * This ensures missing or invalid env vars are caught early.
 *
 * Usage:
 *   import { env } from "@/lib/env"
 *   const dbUrl = env.DATABASE_URL
 */

import { z } from "zod";

const envSchema = z.object({
  // -----------------------------------------------------------------------------
  // Environment
  // -----------------------------------------------------------------------------
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // -----------------------------------------------------------------------------
  // Clerk Authentication
  // -----------------------------------------------------------------------------
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "Clerk publishable key is required"),
  CLERK_SECRET_KEY: z.string().min(1, "Clerk secret key is required"),

  // Clerk URLs (optional, with defaults)
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/"),

  // -----------------------------------------------------------------------------
  // Database
  // -----------------------------------------------------------------------------
  DATABASE_URL: z.string().url("Database URL must be a valid connection string"),

  // -----------------------------------------------------------------------------
  // AI Features
  // -----------------------------------------------------------------------------
  GEMINI_API_KEY: z.string().optional(),

  // -----------------------------------------------------------------------------
  // CORS
  // -----------------------------------------------------------------------------
  ALLOWED_ORIGINS: z.string().default("*"),

  // -----------------------------------------------------------------------------
  // App URL
  // -----------------------------------------------------------------------------
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3003"),

  // -----------------------------------------------------------------------------
  // NextAuth (Required for production)
  // -----------------------------------------------------------------------------
  NEXTAUTH_SECRET: z.string().optional().transform(val => {
    if (process.env.NODE_ENV === "production" && !val) {
      throw new Error("NEXTAUTH_SECRET is required in production. Generate one with: openssl rand -base64 32");
    }
    return val || "dev-secret-change-in-production";
  }),
  NEXTAUTH_URL: z.string().url().optional().transform(val => {
    if (process.env.NODE_ENV === "production" && !val) {
      throw new Error("NEXTAUTH_URL is required in production. Set it to your production domain.");
    }
    return val || "http://localhost:3003";
  }),

  // -----------------------------------------------------------------------------
  // Sentry (Optional)
  // -----------------------------------------------------------------------------
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("production"),

  // -----------------------------------------------------------------------------
  // Internal API (for service-to-service communication)
  // -----------------------------------------------------------------------------
  INTERNAL_API_KEY: z.string().optional().default("internal-dev-key-change-in-production"),
});

// Validate at import time - fail fast if env vars are missing
type EnvSchema = z.infer<typeof envSchema>;

// Parse with safe access - will throw in development, log in production
function validateEnv(): EnvSchema {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e) => e.path.join(".")).join(", ");
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\n` +
          `Please check your .env file against .env.example`
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 *
 * Import this instead of accessing process.env directly
 */
export const env = validateEnv();

// Type helper for accessing env vars
export type Env = typeof env;
