/**
 * CLERK SYNC VERIFICATION SCRIPT
 *
 * Monitors database for clerkUserId mismatches with Clerk API.
 * Detects:
 * - clerkUserId that doesn't start with 'user_' (Clerk pattern)
 * - clerkUserId that matches database id pattern (nanoid)
 * - clerkUserId that doesn't match Clerk API
 *
 * Usage: npx tsx scripts/verify-clerk-sync.ts
 *
 * Can be run periodically to check data integrity.
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
const { sql } = require("drizzle-orm");

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    verification: { status: string };
  }>;
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
}

interface UserIssue {
  email: string;
  type: string;
  dbClerkUserId: string;
  expectedClerkUserId: string | null;
  issue: string;
  severity: "critical" | "warning" | "info";
}

async function verifyClerkSync() {
  console.log("\n🔍 VERIFYING CLERK SYNC INTEGRITY...\n");
  console.log("=" .repeat(70));

  const issues: UserIssue[] = [];

  // 1. Fetch all users from Clerk
  console.log("\n📥 Fetching users from Clerk API...");

  let allClerkUsers: ClerkUser[] = [];
  let nextPage = "https://api.clerk.com/v1/users?limit=100";

  while (nextPage) {
    try {
      const response = await fetch(nextPage, {
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Clerk API error: ${response.status} ${error}`);
        break;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        allClerkUsers = [...allClerkUsers, ...data];
        nextPage = null;
      } else if (data.data && Array.isArray(data.data)) {
        allClerkUsers = [...allClerkUsers, ...data.data];
        nextPage = null;
        if (data.total_count && data.total_count - allClerkUsers.length > 0) {
          const url = new URL(nextPage);
          const offset = parseInt(url.searchParams.get("offset") || "0") + 100;
          nextPage = `https://api.clerk.com/v1/users?limit=100&offset=${offset}`;
        }
      } else {
        nextPage = null;
      }
    } catch (error) {
      console.error("❌ Error fetching from Clerk:", error);
      nextPage = null;
    }
  }

  console.log(`   Found ${allClerkUsers.length} users in Clerk`);

  // Create a map for quick lookup
  const clerkUserMap = new Map<string, ClerkUser>();
  for (const clerkUser of allClerkUsers) {
    const primaryEmail = clerkUser.email_addresses?.[0]?.email_address;
    if (primaryEmail) {
      clerkUserMap.set(primaryEmail.toLowerCase(), clerkUser);
    }
  }

  // 2. Fetch all users from database
  console.log("\n📊 Fetching users from database...");

  const dbUsers = await db
    .select({
      id: users.id,
      email: users.email,
      type: users.type,
      clerkUserId: users.clerkUserId,
      isActive: users.isActive,
    })
    .from(users)
    .orderBy(sql`LOWER(${users.email})`);

  console.log(`   Found ${dbUsers.length} users in database`);

  // 3. Compare and detect issues
  console.log("\n🔍 Analyzing data integrity...\n");

  for (const dbUser of dbUsers) {
    const clerkUser = clerkUserMap.get(dbUser.email.toLowerCase());

    // Check 1: clerkUserId pattern validation
    if (!dbUser.clerkUserId.startsWith("user_")) {
      issues.push({
        email: dbUser.email,
        type: dbUser.type,
        dbClerkUserId: dbUser.clerkUserId,
        expectedClerkUserId: clerkUser?.id || null,
        issue: "clerkUserId doesn't follow Clerk pattern (user_*)",
        severity: "critical",
      });
    }

    // Check 2: clerkUserId looks like database ID
    if (dbUser.clerkUserId === dbUser.id) {
      issues.push({
        email: dbUser.email,
        type: dbUser.type,
        dbClerkUserId: dbUser.clerkUserId,
        expectedClerkUserId: clerkUser?.id || null,
        issue: "clerkUserId is set to database id (should be Clerk ID)",
        severity: "critical",
      });
    }

    // Check 3: clerkUserId doesn't match Clerk API
    if (clerkUser && dbUser.clerkUserId !== clerkUser.id) {
      issues.push({
        email: dbUser.email,
        type: dbUser.type,
        dbClerkUserId: dbUser.clerkUserId,
        expectedClerkUserId: clerkUser.id,
        issue: "clerkUserId doesn't match Clerk API value",
        severity: "critical",
      });
    }

    // Check 4: User exists in DB but not in Clerk
    if (!clerkUser) {
      issues.push({
        email: dbUser.email,
        type: dbUser.type,
        dbClerkUserId: dbUser.clerkUserId,
        expectedClerkUserId: null,
        issue: "User exists in database but not in Clerk",
        severity: "warning",
      });
    }
  }

  // 4. Check for users in Clerk but not in DB
  for (const [email, clerkUser] of clerkUserMap) {
    const dbUser = dbUsers.find(u => u.email.toLowerCase() === email);
    if (!dbUser) {
      issues.push({
        email: email,
        type: "unknown",
        dbClerkUserId: "N/A",
        expectedClerkUserId: clerkUser.id,
        issue: "User exists in Clerk but not in database",
        severity: "warning",
      });
    }
  }

  // 5. Report results
  console.log("=" .repeat(70));
  console.log("\n📋 VERIFICATION RESULTS\n");
  console.log("=" .repeat(70));

  const criticalIssues = issues.filter(i => i.severity === "critical");
  const warningIssues = issues.filter(i => i.severity === "warning");
  const infoIssues = issues.filter(i => i.severity === "info");

  if (issues.length === 0) {
    console.log("\n✅ NO ISSUES FOUND!");
    console.log("   All clerkUserIds are properly synced with Clerk.\n");
  } else {
    console.log(`\n⚠️  FOUND ${issues.length} ISSUE(S):\n`);

    if (criticalIssues.length > 0) {
      console.log(`   🔴 CRITICAL: ${criticalIssues.length}`);
      for (const issue of criticalIssues) {
        console.log(`      - ${issue.email} (${issue.type})`);
        console.log(`        Issue: ${issue.issue}`);
        console.log(`        DB Value: ${issue.dbClerkUserId}`);
        if (issue.expectedClerkUserId) {
          console.log(`        Expected: ${issue.expectedClerkUserId}`);
        }
      }
    }

    if (warningIssues.length > 0) {
      console.log(`\n   🟡 WARNING: ${warningIssues.length}`);
      for (const issue of warningIssues) {
        console.log(`      - ${issue.email} (${issue.type}): ${issue.issue}`);
      }
    }

    if (infoIssues.length > 0) {
      console.log(`\n   🔵 INFO: ${infoIssues.length}`);
      for (const issue of infoIssues) {
        console.log(`      - ${issue.email}: ${issue.issue}`);
      }
    }

    console.log("\n" + "=".repeat(70));

    // Suggest fixes
    if (criticalIssues.length > 0) {
      console.log("\n🔧 SUGGESTED FIXES:");
      console.log("   1. Run: npx tsx scripts/fix-clerk-ids.ts");
      console.log("   2. Or manually fix with: npx tsx scripts/emergency-fix-admin-clerk-id.ts");
    }
  }

  // 6. Summary statistics
  console.log("\n📊 SUMMARY:\n");
  console.log(`   Clerk users:    ${allClerkUsers.length}`);
  console.log(`   Database users: ${dbUsers.length}`);
  console.log(`   Issues found:   ${issues.length}`);
  console.log(`   - Critical:     ${criticalIssues.length}`);
  console.log(`   - Warning:      ${warningIssues.length}`);
  console.log(`   - Info:         ${infoIssues.length}`);

  // Exit with error code if critical issues found
  if (criticalIssues.length > 0) {
    process.exit(1);
  }
}

verifyClerkSync()
  .then(() => {
    console.log("\n✨ Verification complete!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
