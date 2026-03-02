/**
 * PARENT PORTAL LAYOUT
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

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAuth(['parent']);

  if ('error' in authResult) {
    // Check error type - 404 means user exists in Clerk but not in DB (needs setup)
    // 401 means not authenticated with Clerk at all
    if (authResult.status === 404 || authResult.error === "User not found") {
      // User authenticated with Clerk but no DB record - redirect to setup
      logger.security("user_no_db_record", { error: authResult.error });
      redirect("/setup/unified");
    }
    logger.security("unauthorized_parent_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { user } = authResult;

  // Get user data regardless of onboarding status
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Parent";
  const portalType = "parent" as const;

  // Parents don't need school approval, just onboarding
  const needsSetup = !user.onboardingComplete;

  // Use a client component wrapper to avoid Promise wrapper issues
  // ALWAYS render this - never return early to avoid hooks mismatch
  const ParentLayoutClient = dynamic(() => import("./parent-layout-client").then(mod => mod.ParentLayoutClient), {
    ssr: true,
  });

  return (
    <ParentLayoutClient userName={userName} portalType={portalType} needsSetup={needsSetup}>
      {children}
    </ParentLayoutClient>
  );
}
