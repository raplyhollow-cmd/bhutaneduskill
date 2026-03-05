/**
 * Check for duplicate Clerk accounts for an email
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env"), override: true });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const EMAIL = process.argv[2] || "raplyhollow@gmail.com";

if (!CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY not set");
  process.exit(1);
}

(async () => {
  console.log("Searching Clerk API for email:", EMAIL);
  console.log("=" .repeat(60));

  let allUsers: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` }
      }
    );

    if (!response.ok) {
      console.error("API Error:", response.status);
      break;
    }

    const data = await response.json();
    allUsers = [...allUsers, ...(data.data || [])];

    if (!data.total_count || allUsers.length >= data.total_count) break;
    offset += limit;
  }

  console.log("Total users in Clerk:", allUsers.length);
  console.log("");

  const matchingUsers = allUsers.filter((u: any) =>
    u.email_addresses?.some((e: any) => e.email_address === EMAIL)
  );

  console.log(`Users matching ${EMAIL}:`, matchingUsers.length);
  console.log("");

  if (matchingUsers.length === 0) {
    console.log("No matching users found in Clerk!");
  } else {
    matchingUsers.forEach((u: any) => {
      console.log("Clerk ID:", u.id);
      console.log("Email:", u.email_addresses?.[0]?.email_address);
      console.log("Created:", new Date(u.created_at).toISOString());
      console.log("");
    });
  }

  // Check current database state
  const { db } = await import("../src/lib/db");
  const { users } = await import("../src/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, EMAIL))
    .limit(1);

  if (dbUser) {
    console.log("Database state:");
    console.log("  DB id:", dbUser.id);
    console.log("  clerkUserId:", dbUser.clerkUserId);
    console.log("");

    if (matchingUsers.length > 0) {
      const clerkIds = matchingUsers.map((u: any) => u.id);
      console.log("Match with Clerk IDs:");
      clerkIds.forEach((id: string) => {
        console.log(`  ${id} === ${dbUser.clerkUserId}: ${id === dbUser.clerkUserId ? "YES ✅" : "NO ❌"}`);
      });
    }
  } else {
    console.log("User not found in database!");
  }

  process.exit(0);
})();
