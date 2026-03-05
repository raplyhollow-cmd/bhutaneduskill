/**
 * DEBUG AUTH SCRIPT
 *
 * Checks database and Clerk to diagnose auth issues.
 * Usage: npx tsx scripts/debug-auth.ts <email>
 *
 * Example: npx tsx scripts/debug-auth.ts raplyhollow@gmail.com
 */

import { config } from "dotenv";
import { resolve } from "path";

// Preload .env before any other imports
config({
  path: resolve(__dirname, "../.env"),
  override: true
});

const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found in environment");
  process.exit(1);
}

// Now use require for dynamic imports after env is loaded
const { db } = require("../src/lib/db");
const { users } = require("../src/lib/db/schema");
const { eq, sql, like } = require("drizzle-orm");

const EMAIL = process.argv[2] || "raplyhollow@gmail.com";

async function debugAuth() {
  console.log("\n🔍 DEBUGGING AUTH FOR:", EMAIL);
  console.log("=" .repeat(60));

  // 1. Check database for user by email
  console.log("\n📊 DATABASE LOOKUP (by email):");
  console.log("-".repeat(60));

  const [userByEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, EMAIL))
    .limit(1);

  if (userByEmail) {
    console.log("✅ User found by email:");
    console.log("   ID:", userByEmail.id);
    console.log("   Email:", userByEmail.email);
    console.log("   Type:", userByEmail.type);
    console.log("   ClerkUserId:", userByEmail.clerkUserId || "NOT SET");
    console.log("   Name:", userByEmail.name);
    console.log("   SchoolId:", userByEmail.schoolId || "none");
  } else {
    console.log("❌ User NOT found by email:", EMAIL);
  }

  // 2. Check Clerk API for this email
  console.log("\n🔑 CLERK API LOOKUP:");
  console.log("-".repeat(60));

  try {
    // List users to find by email
    const listResponse = await fetch("https://api.clerk.com/v1/users", {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error("❌ Clerk API error:", listResponse.status, error);
    } else {
      const clerkData = await listResponse.json();
      const clerkUser = Array.isArray(clerkData)
        ? clerkData.find((u: any) => u.email_addresses?.some((e: any) => e.email_address === EMAIL))
        : clerkData.data?.find((u: any) => u.email_addresses?.some((e: any) => e.email_address === EMAIL));

      if (clerkUser) {
        console.log("✅ Clerk user found:");
        console.log("   Clerk ID:", clerkUser.id);
        console.log("   Email:", clerkUser.email_addresses?.[0]?.email_address);
        console.log("   First Name:", clerkUser.first_name || "none");
        console.log("   Last Name:", clerkUser.last_name || "none");
        console.log("   Created:", new Date(clerkUser.created_at).toISOString());
        console.log("   Public Metadata:", JSON.stringify(clerkUser.public_metadata || {}));
        console.log("   Unsafe Metadata:", JSON.stringify(clerkUser.unsafe_metadata || {}));
      } else {
        console.log("❌ Clerk user NOT found for:", EMAIL);
        console.log("   Total users in Clerk:", Array.isArray(clerkData) ? clerkData.length : clerkData.total_count || "unknown");
      }
    }
  } catch (error) {
    console.error("❌ Error fetching from Clerk:", error instanceof Error ? error.message : error);
  }

  // 3. If we have both, compare them
  if (userByEmail) {
    console.log("\n🔍 DATABASE QUERY TEST (searching by clerkUserId):");
    console.log("-".repeat(60));

    if (userByEmail.clerkUserId) {
      console.log("   Searching for clerkUserId:", userByEmail.clerkUserId);

      const [userByClerkId] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userByEmail.clerkUserId))
        .limit(1);

      if (userByClerkId) {
        console.log("✅ User found by clerkUserId!");
        console.log("   Same user?", userByEmail.id === userByClerkId.id);
      } else {
        console.log("❌ User NOT found by clerkUserId!");
        console.log("   This indicates a data inconsistency.");
      }
    } else {
      console.log("⚠️  No clerkUserId set in database - this is the problem!");
    }
  }

  // 4. List all users with their clerkUserIds for reference
  console.log("\n📋 ALL USERS IN DATABASE:");
  console.log("-".repeat(60));

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      type: users.type,
      clerkUserId: users.clerkUserId,
      name: users.name,
    })
    .from(users)
    .orderBy(sql`LOWER(${users.email})`)
    .limit(20);

  console.log(`Total users: ${allUsers.length}`);
  console.log("");

  for (const u of allUsers) {
    const clerkStatus = u.clerkUserId ? "✅" : "❌";
    console.log(`   ${clerkStatus} ${u.email} (${u.type})`);
    if (u.clerkUserId) {
      console.log(`      → clerkUserId: ${u.clerkUserId}`);
    } else {
      console.log(`      → clerkUserId: NOT SET`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Debug complete!");
}

debugAuth()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
