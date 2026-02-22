/**
 * PARENT PORTAL LAYOUT
 *
 * Uses the unified portal components for consistent authentication
 * and navigation across all portals.
 */

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
    logger.security("unauthorized_parent_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { user } = authResult;

  // Parent-specific setup check - redirect to setup if needed
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Parent";
  const portalType = "parent" as const;

  // Use a client component wrapper to avoid "use server" / "use client" conflict
  const ParentLayoutClient = (await import("./parent-layout-client")).ParentLayoutClient;

  return (
    <ParentLayoutClient userName={userName} portalType={portalType}>
      {children}
    </ParentLayoutClient>
  );
}
