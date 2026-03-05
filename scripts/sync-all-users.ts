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

  // Fetch all users from Clerk via REST API
  const response = await fetch("https://api.clerk.com/v1/users", {
    headers: {
      "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const clerkUsers = await response.json();
  console.log(`📋 Found ${clerkUsers.data.length} users in Clerk\n`);

  let synced = 0;
  let skipped = 0;
  let notFound = 0;

  for (const clerkUser of clerkUsers.data) {
    const email = clerkUser.email_addresses.find(
      (e) => e.id === clerkUser.primary_email_address_id
    )?.email_address;

    if (!email) {
      skipped++;
      continue;
    }

    // Find and update
    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (dbUsers.length === 0) {
      notFound++;
      continue;
    }

    const dbUser = dbUsers[0];

    if (dbUser.clerkUserId === clerkUser.id) {
      skipped++;
    } else {
      await db
        .update(users)
        .set({
          clerkUserId: clerkUser.id,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email));

      console.log(`🔄 ${email}: ${dbUser.clerkUserId} → ${clerkUser.id}`);
      synced++;
    }
  }

  console.log(`\n✅ Synced: ${synced}, Skipped: ${skipped}, Not in DB: ${notFound}`);

  // Verify admin user
  const adminCheck = await db
    .select({
      email: users.email,
      clerkUserId: users.clerkUserId,
      type: users.type,
    })
    .from(users)
    .where(eq(users.email, "raplyhollow@gmail.com"))
    .limit(1);

  console.log("\n✅ Admin verified:", adminCheck[0]);

  process.exit(0);
}

main().catch(err => {
  console.error("❌", err);
  process.exit(1);
});
