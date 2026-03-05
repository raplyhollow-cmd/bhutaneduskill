const path = require("path");
const dotenv = require("dotenv");

// Load .env files
const envPaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

async function main() {
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const adminUsers = await db
    .select({
      email: users.email,
      type: users.type,
      onboardingStatus: users.onboardingStatus,
      clerkUserId: users.clerkUserId,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.email, "raplyhollow@gmail.com"))
    .limit(1);

  console.log("Admin user:", JSON.stringify(adminUsers[0], null, 2));
  process.exit(0);
}

main().catch(console.error);
