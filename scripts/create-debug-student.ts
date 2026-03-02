/**
 * CREATE DEBUG STUDENT
 *
 * Run with: npx tsx scripts/create-debug-student.ts
 *
 * Creates a test student account for debugging purposes.
 * The student will be in "pending_enrollment" status and needs approval.
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

async function createDebugStudent() {
  const clerkUserId = `debug_${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const now = new Date();

  const student = {
    id: userId,
    clerkUserId,
    type: "student" as const,
    role: "student" as const,
    name: "Debug Student",
    firstName: "Debug",
    lastName: "Student",
    email: `debug${Date.now()}@test.com`,
    phone: "+975-17-123456",
    profileImage: "",
    gender: "other",
    grade: 10,
    classGrade: 10,
    section: "A",
    rollNumber: "DEBUG001",
    address: "Test Address",
    city: "Thimphu",
    state: "Thimphu",
    postalCode: "11001",
    country: "Bhutan",
    parentContact: "Debug Parent",
    parentPhone: "+975-17-654321",
    emergencyContact: "Debug Parent",
    bloodGroup: "O+",
    enrollmentDate: now.toISOString().split('T')[0],
    lastLogin: now.toISOString(),
    onboardingComplete: true,
    onboardingStatus: "pending_enrollment", // <-- PENDING STATUS
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existing.length > 0) {
      console.log("❌ User already exists:", existing[0].id);
      console.log("Deleting existing user...");

      await db.delete(users).where(eq(users.id, existing[0].id));
      console.log("✅ Deleted existing user");
    }

    // Insert new debug student
    await db.insert(users).values(student);
    console.log("✅ Debug student created!");
    console.log("\n📋 Student Details:");
    console.log("─────────────────────────────────────");
    console.log(`ID:              ${userId}`);
    console.log(`Clerk User ID:   ${clerkUserId}`);
    console.log(`Name:            ${student.name}`);
    console.log(`Email:           ${student.email}`);
    console.log(`Grade:           ${student.grade}-${student.section}`);
    console.log(`Status:          ${student.onboardingStatus} ⏳`);
    console.log("─────────────────────────────────────");
    console.log("\n📝 Next Steps:");
    console.log("1. Create a Clerk account with this Clerk User ID or use an existing one");
    console.log("2. Sign in at /sign-in");
    console.log("3. You'll be redirected to /pending-approval");
    console.log("4. Approve the student at /school-admin/students/pending");
    console.log("\n💡 Quick Test URL:");
    console.log(`   /student/dashboard (should redirect to /pending-approval)`);

  } catch (error) {
    console.error("❌ Error creating debug student:", error);
    process.exit(1);
  }
}

createDebugStudent()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });