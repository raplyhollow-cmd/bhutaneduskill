import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  // For local development with SQLite
  dialect: "sqlite",
  // For production with Neon, you'll use a different config
  // See: https://neon.tech/docs/guides/drizzle
} satisfies Config;

// Note: For Neon production migrations, use:
// npx drizzle-kit push:pg --config=drizzle.config.prod.ts
//
// Create drizzle.config.prod.ts:
// import type { Config } from "drizzle-kit";
//
// export default {
//   schema: "./src/lib/db/schema.ts",
//   out: "./drizzle",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL!,
//   },
// } satisfies Config;
