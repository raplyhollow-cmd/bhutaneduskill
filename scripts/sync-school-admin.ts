const path = require("path");
const dotenv = require("dotenv");

// Load .env
for (const envPath of [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
]) {
  dotenv.config({ path: envPath });
}

async function main() {
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  console.log("🔄 Syncing school-admin...\n");

  // Check current state
  const current = await db
    .select({
      email: users.email,
      clerkUserId: users.clerkUserId,
      type: users.type,
    })
    .from(users)
    .where(eq(users.email, "bsptours.treks@gmail.com"))
    .limit(1);

  console.log("Current:", current[0]);

  // Update with known correct Clerk ID from earlier sync
  const correctId = "user_3ALmUduiTEkfSUK1S1mZRWh0C4W";

  if (current[0].clerkUserId !== correctId) {
    const result = await db
      .update(users)
      .set({
        clerkUserId: correctId,
        updatedAt: new Date(),
      })
      .where(eq(users.email, "bsptours.treks@gmail.com"))
      .returning();

    console.log("\n✅ Updated database");
    console.log("New clerkUserId:", correctId);
  } else {
    console.log("✅ Already in sync");
  }

  // Verify
  const verified = await db
    .select({
      email: users.email,
      clerkUserId: users.clerkUserId,
    })
    .from(users)
    .where(eq(users.email, "bsptours.treks@gmail.com"))
    .limit(1);

  console.log("\n✅ Verified:", verified[0]);

  process.exit(0);
}

main().catch(console.error);
