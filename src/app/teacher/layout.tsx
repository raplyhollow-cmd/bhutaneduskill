/**
 * TEACHER PORTAL LAYOUT
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

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAuth(['teacher']);

  if ('error' in authResult) {
    logger.security("unauthorized_teacher_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { user } = authResult;

  // Get user data regardless of onboarding status
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Teacher";
  const portalType = "teacher" as const;

  // Teachers need to complete setup AND be approved by school admin
  // If they're pending_approval or pending_enrollment, they've completed setup but need approval
  const needsSetup = !user.onboardingComplete &&
    user.onboardingStatus !== "pending_approval" &&
    user.onboardingStatus !== "pending_enrollment";
  const isPendingApproval = user.onboardingStatus === "pending_approval" || user.onboardingStatus === "pending_enrollment";

  // Use a client component wrapper to avoid Promise wrapper issues
  // ALWAYS render this - never return early to avoid hooks mismatch
  const TeacherLayoutClient = dynamic(() => import("./teacher-layout-client").then(mod => mod.TeacherLayoutClient), {
    ssr: true,
  });

  return (
    <TeacherLayoutClient userName={userName} portalType={portalType} needsSetup={needsSetup} isPendingApproval={isPendingApproval}>
      {children}
    </TeacherLayoutClient>
  );
}
