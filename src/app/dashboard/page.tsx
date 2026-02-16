import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Intelligent Post-Authentication Router
 *
 * This server component acts as the central routing hub after a user signs in.
 * It looks up the user in the database by their Clerk ID and redirects them
 * to the appropriate portal based on their user type.
 *
 * If the user is not found in the database (new user who just signed up via Clerk),
 * they are redirected to the unified setup wizard.
 */
export default async function DashboardPage() {
  // Get the current Clerk user
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Look up the user in the database by clerkUserId
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUser.id))
    .limit(1);

  const user = userRecords[0];

  // If user not found in database, redirect to unified setup
  if (!user) {
    redirect("/setup/unified");
  }

  // Redirect based on user type
  switch (user.type) {
    case "student":
      redirect("/student/dashboard");
    case "teacher":
      redirect("/teacher/dashboard");
    case "parent":
      redirect("/parent/dashboard");
    case "counselor":
      redirect("/counselor/dashboard");
    case "school-admin":
      redirect("/school-admin/dashboard");
    case "admin":
      redirect("/admin");
    case "ministry":
      redirect("/ministry/dashboard");
    default:
      // Unknown user type - send to setup
      redirect("/setup/unified");
  }
}
