const path = require("path");
const dotenv = require("dotenv");

// Load .env
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

  console.log("🔄 Force-syncing admin user clerkUserId...\n");

  // Direct update with explicit commit
  const result = await db
    .update(users)
    .set({
      clerkUserId: "user_3AIGWJY270XQMYtcwUP2wp9UGbC",
      updatedAt: new Date(),
    })
    .where(eq(users.email, "raplyhollow@gmail.com"))
    .returning();

  console.log("Update result:", result);

  // Verify the update
  const check = await db
    .select({
      email: users.email,
      clerkUserId: users.clerkUserId,
      type: users.type,
    })
    .from(users)
    .where(eq(users.email, "raplyhollow@gmail.com"))
    .limit(1);

  console.log("\n✅ Verified database state:");
  console.log(JSON.stringify(check[0], null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
