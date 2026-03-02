/**
 * DEBUG SCRIPT: User Missing from Database
 *
 * This script helps debug and fix the issue where a user exists in Clerk
 * but not in the local database, causing "Failed query" errors.
 *
 * Run: npx tsx scripts/debug-user-missing.ts <clerk-user-id>
 *
 * Example: npx tsx scripts/debug-user-missing.ts user_3ALmUduiTEkfSUK1S1mZRWh0C4W
 */

import { createClerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const clerkUserId = process.argv[2];

if (!clerkUserId) {
  console.error("❌ Error: Clerk User ID is required");
  console.log("Usage: npx tsx scripts/debug-user-missing.ts <clerk-user-id>");
  console.log("Example: npx tsx scripts/debug-user-missing.ts user_3ALmUduiTEkfSUK1S1mZRWh0C4W");
  process.exit(1);
}

console.log(`\n🔍 Debugging Clerk User: ${clerkUserId}\n`);

async function main() {
  try {
    // Step 1: Check if user exists in local database
    console.log("Step 1: Checking local database...");
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (dbUser) {
      console.log("✅ User FOUND in database:");
      console.log(`   - ID: ${dbUser.id}`);
      console.log(`   - Type: ${dbUser.type}`);
      console.log(`   - Name: ${dbUser.firstName} ${dbUser.lastName}`);
      console.log(`   - School ID: ${dbUser.schoolId || "NOT SET"}`);
      console.log(`   - Onboarding Status: ${dbUser.onboardingStatus || "NOT SET"}`);
      console.log(`   - Created: ${dbUser.createdAt}`);

      // Check if school exists
      if (dbUser.schoolId) {
        const [school] = await db
          .select()
          .from(schools)
          .where(eq(schools.id, dbUser.schoolId))
          .limit(1);

        if (school) {
          console.log(`   - School: ${school.name}`);
        } else {
          console.log(`   - ⚠️  School NOT FOUND in database!`);
          console.log(`   - This may cause errors when trying to create classes.`);
        }
      } else {
        console.log(`   - ⚠️  No schoolId set! User needs to be assigned to a school.`);
      }

      console.log("\n✅ User exists in database. The issue may be elsewhere.");
    } else {
      console.log("❌ User NOT FOUND in database");
      console.log("   This is causing the 'Failed query' error!\n");

      // Step 2: Get user info from Clerk
      console.log("Step 2: Fetching user from Clerk...");
      const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

      let clerkUser;
      try {
        clerkUser = await clerkClient.users.getUser(clerkUserId);
        console.log("✅ User found in Clerk:");
        console.log(`   - Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
        console.log(`   - Name: ${clerkUser.firstName} ${clerkUser.lastName}`);
        console.log(`   - Created: ${clerkUser.createdAt}`);

        // Check public metadata
        console.log("\n   Clerk Public Metadata:");
        console.log("  ", JSON.stringify(clerkUser.publicMetadata, null, 2));
      } catch (clerkError) {
        console.log("❌ User NOT found in Clerk either!");
        console.log(`   Error: ${clerkError}`);
        process.exit(1);
      }

      // Step 3: Determine user type
      const userType = (clerkUser.publicMetadata?.userType as string) || "school-admin";
      console.log(`\n   Inferred user type: ${userType}`);

      // Step 4: Ask if user wants to create the database record
      console.log("\n⚠️  RECOMMENDATION:");
      console.log("   The user needs to be created in the database.");
      console.log("   Options:");
      console.log("   1. Go through the setup flow: /setup/school-admin");
      console.log("   2. Run the auto-fix below (if you have a school ID)\n");

      // Step 5: Try to find a school to assign
      console.log("Step 3: Looking for schools to assign...");
      const allSchools = await db
        .select()
        .from(schools)
        .limit(10);

      if (allSchools.length === 0) {
        console.log("❌ No schools found in database!");
        console.log("   You need to create a school first.");
      } else {
        console.log(`✅ Found ${allSchools.length} school(s):`);
        allSchools.forEach((school, idx) => {
          console.log(`   ${idx + 1}. ${school.name} (ID: ${school.id})`);
        });

        // Use first school as default
        const defaultSchool = allSchools[0];
        console.log(`\n🔧 Auto-fix: Creating database record for user...`);
        console.log(`   Assigning to school: ${defaultSchool.name}`);

        const now = new Date().toISOString();
        const newUserId = `user-${nanoid()}`;

        await db.insert(users).values({
          id: newUserId,
          clerkUserId: clerkUserId,
          type: userType,
          role: userType,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          phone: "",
          country: "Bhutan",
          grade: 0,
          enrollmentDate: now.split("T")[0],
          schoolId: defaultSchool.id,
          isActive: true,
          emailVerified: !!clerkUser.emailAddresses[0]?.verification?.status,
          onboardingComplete: userType === "admin",
          onboardingStatus: userType === "admin" ? "complete" : "restricted",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log("\n✅ SUCCESS! User record created:");
        console.log(`   - Database ID: ${newUserId}`);
        console.log(`   - Clerk User ID: ${clerkUserId}`);
        console.log(`   - Type: ${userType}`);
        console.log(`   - School: ${defaultSchool.name}`);
        console.log(`   - School ID: ${defaultSchool.id}`);
        console.log("\n✨ The user should now be able to access the system.");
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
