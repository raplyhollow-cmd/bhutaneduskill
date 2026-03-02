/**
 * CREATE DEBUG TEACHER
 *
 * Run with: npx tsx scripts/create-debug-teacher.ts
 *
 * Creates a test teacher account for debugging purposes.
 * The teacher will be in "pending_enrollment" status and needs approval.
 */

import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

async function createDebugTeacher() {
  const clerkUserId = `debug_teacher_${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const now = new Date();

  const teacher = {
    id: userId,
    clerkUserId,
    type: "teacher" as const,
    role: "teacher" as const,
    name: "Debug Teacher",
    firstName: "Debug",
    lastName: "Teacher",
    email: `debug.teacher${Date.now()}@test.com`,
    phone: "+975-17-234567",
    profileImage: "",
    gender: "other",
    grade: 1,
    classGrade: null,
    section: null,
    rollNumber: null,
    address: "Test Address",
    city: "Thimphu",
    state: "Thimphu",
    postalCode: "11001",
    country: "Bhutan",
    parentContact: null,
    parentPhone: null,
    emergencyContact: null,
    bloodGroup: null,
    enrollmentDate: now.toISOString().split('T')[0],
    lastLogin: now.toISOString(),
    onboardingComplete: true,
    onboardingStatus: "pending_enrollment", // <-- PENDING STATUS
    isActive: true,
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

    // Insert new debug teacher
    await db.insert(users).values(teacher);
    console.log("✅ Debug teacher created!");
    console.log("\n📋 Teacher Details:");
    console.log("─────────────────────────────────────");
    console.log(`ID:              ${userId}`);
    console.log(`Clerk User ID:   ${clerkUserId}`);
    console.log(`Name:            ${teacher.name}`);
    console.log(`Email:           ${teacher.email}`);
    console.log(`Phone:           ${teacher.phone}`);
    console.log(`Status:          ${teacher.onboardingStatus} ⏳`);
    console.log("─────────────────────────────────────");
    console.log("\n📝 Next Steps:");
    console.log("1. Create a Clerk account with this Clerk User ID or use an existing one");
    console.log("2. Sign in at /sign-in");
    console.log("3. You'll be redirected to /pending-approval");
    console.log("4. Approve the teacher at /school-admin/teachers/pending");
    console.log("\n💡 Quick Test URL:");
    console.log(`   /teacher/dashboard (should redirect to /pending-approval)`);

  } catch (error) {
    console.error("❌ Error creating debug teacher:", error);
    process.exit(1);
  }
}

createDebugTeacher()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
