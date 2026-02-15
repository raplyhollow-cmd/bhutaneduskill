import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SetupPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user exists in database
  const userRecord = await db
    .select({
      role: users.role,
      onboardingComplete: users.onboardingComplete,
    })
    .from(users)
    .where(eq(users.clerkUserId, user.id))
    .limit(1);

  const userData = userRecord[0];

  // If user not found in database, redirect to unified setup wizard
  if (!userData) {
    redirect("/setup/unified");
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
        redirect("/");
    }
  }

  // User exists but onboarding not complete - redirect to unified setup
  redirect("/setup/unified");
}
