/**
 * STUDENT PORTAL LAYOUT
 *
 * Uses the unified portal components with consistent navigation.
 *
 * CRITICAL: Always render the same component structure to avoid hooks mismatch errors.
 * Redirect logic is handled in the client component, not here.
 */

// Dynamic import to avoid "use server" / "use client" conflict
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // First check if user is authenticated (without role restriction)
  const authResult = await requireAuth([]);

  if ('error' in authResult) {
    // Check error type - 404 means user exists in Clerk but not in DB (needs setup)
    // 401 means not authenticated with Clerk at all
    if (authResult.status === 404 || authResult.error === "User not found") {
      // User authenticated with Clerk but no DB record - redirect to setup
      logger.security("user_no_db_record", { error: authResult.error });
      redirect("/setup/unified");
    }
    // User is not authenticated at all
    logger.security("unauthenticated_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { user } = authResult;

  // Check if user has the correct role
  if (user.type !== 'student') {
    // User is authenticated but has the wrong role
    // Redirect them to their correct portal instead of /sign-in to avoid loop
    logger.security("wrong_portal_access_attempt", {
      expected: "student",
      actual: user.type,
      userId: user.id
    });
    redirect(`/${user.type}`);
  }

  // Get user data regardless of onboarding status
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Student";
  const portalType = "student" as const;

  // Students need to complete setup AND be approved by school admin
  // If they're pending_approval or pending_enrollment, they've completed setup but need approval
  const needsSetup = !user.onboardingComplete &&
    user.onboardingStatus !== "pending_approval" &&
    user.onboardingStatus !== "pending_enrollment";
  const isPendingApproval = user.onboardingStatus === "pending_approval" || user.onboardingStatus === "pending_enrollment";

  // Use a client component wrapper to avoid Promise wrapper issues
  // ALWAYS render this - never return early to avoid hooks mismatch
  const StudentLayoutClient = dynamic(() => import("./student-layout-client").then(mod => mod.StudentLayoutClient), {
    ssr: true,
  });

  return (
    <StudentLayoutClient userName={userName} portalType={portalType} needsSetup={needsSetup} isPendingApproval={isPendingApproval}>
      {children}
    </StudentLayoutClient>
  );
}
