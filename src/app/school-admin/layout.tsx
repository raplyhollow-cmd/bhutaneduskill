/**
 * SCHOOL ADMIN PORTAL LAYOUT
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

export default async function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAuth(['school-admin']);

  if ('error' in authResult) {
    // Check error type - 404 means user exists in Clerk but not in DB (needs setup)
    // 401 means not authenticated with Clerk at all
    if (authResult.status === 404 || authResult.error === "User not found") {
      // User authenticated with Clerk but no DB record - redirect to setup
      logger.security("user_no_db_record", { error: authResult.error });
      redirect("/setup/unified");
    }
    logger.security("unauthorized_school_admin_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { user } = authResult;

  // Get user data regardless of onboarding status
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "School Admin";
  const portalType = "school-admin" as const;
  const schoolId = user?.schoolId || null;

  // School admins need to complete setup AND be approved
  // If they're pending_approval or pending_enrollment, they've completed setup but need platform admin approval
  // FIX: Use !== true to handle null/undefined correctly (null means incomplete)
  const needsSetup = user.onboardingComplete !== true &&
    user.onboardingStatus !== "pending_approval" &&
    user.onboardingStatus !== "pending_enrollment";
  const isPendingApproval = user.onboardingStatus === "pending_approval" || user.onboardingStatus === "pending_enrollment";

  // Use a client component wrapper to avoid Promise wrapper issues
  // ALWAYS render this - never return early to avoid hooks mismatch
  const SchoolAdminLayoutClient = dynamic(() => import("./school-admin-layout-client").then(mod => mod.SchoolAdminLayoutClient), {
    ssr: true,
  });

  return (
    <SchoolAdminLayoutClient userName={userName} portalType={portalType} needsSetup={needsSetup} isPendingApproval={isPendingApproval} schoolId={schoolId}>
      {children}
    </SchoolAdminLayoutClient>
  );
}
