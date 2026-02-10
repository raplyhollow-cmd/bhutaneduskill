import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SetupPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user to determine their role
  const userRecord = await db
    .select({
      role: users.role,
      schoolId: users.schoolId,
      onboardingComplete: users.onboardingComplete,
    })
    .from(users)
    .where(eq(users.clerkId, user.id))
    .limit(1);

  const userData = userRecord[0];

  // If user not found in database, they need to complete registration first
  if (!userData) {
    redirect("/dashboard");
  }

  // If onboarding is complete, redirect to their dashboard
  if (userData.onboardingComplete) {
    switch (userData.role) {
      case "student":
        redirect("/student");
      case "teacher":
        redirect("/teacher");
      case "parent":
        redirect("/parent");
      case "counselor":
        redirect("/counselor");
      case "school_admin":
        redirect("/school-admin");
      case "admin":
        redirect("/admin");
      default:
        redirect("/dashboard");
    }
  }

  // Redirect to appropriate wizard based on role
  switch (userData.role) {
    case "school_admin":
      redirect("/setup/school");
    case "teacher":
      redirect("/setup/teacher");
    case "student":
      redirect("/setup/student");
    case "parent":
      redirect("/setup/parent");
    case "counselor":
      redirect("/setup/counselor");
    case "admin":
      redirect("/setup/admin");
    default:
      redirect("/dashboard");
  }
}
