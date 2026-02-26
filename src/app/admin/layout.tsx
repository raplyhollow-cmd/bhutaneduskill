/**
 * PLATFORM ADMIN LAYOUT
 *
 * Uses the unified portal components directly without the Promise wrapper
 * that was causing the React hooks error.
 */

// Dynamic import to avoid "use server" / "use client" conflict
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAuth(['admin']);

  if ('error' in authResult) {
    logger.security("unauthorized_admin_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { user } = authResult;

  // Platform admins bypass setup check
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Admin";
  const portalType = "admin" as const;

  // Use a client component wrapper to avoid Promise wrapper issues
  const AdminLayoutClient = dynamic(() => import("./admin-layout-client").then(mod => mod.AdminLayoutClient), {
    ssr: true,
  });

  return (
    <AdminLayoutClient userName={userName} portalType={portalType}>
      {children}
    </AdminLayoutClient>
  );
}
