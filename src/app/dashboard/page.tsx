"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * DASHBOARD REDIRECT PAGE
 *
 * This page redirects users to their role-specific dashboard.
 * After Clerk sign-in, users land here and get routed appropriately.
 */

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Fetch user role and redirect to appropriate dashboard
    const fetchRoleAndRedirect = async () => {
      try {
        const response = await fetch("/api/resources/users/actions?action=get-role", {
          credentials: "include",
        });
        const data = await response.json();

        if (data.userType) {
          // Map user types to their dashboard paths
          const dashboardPaths: Record<string, string> = {
            admin: "/admin",
            "school-admin": "/school-admin/dashboard",
            teacher: "/teacher/dashboard",
            student: "/student/dashboard",
            parent: "/parent/dashboard",
            counselor: "/counselor/dashboard",
            ministry: "/ministry",
          };

          const redirectPath = dashboardPaths[data.userType] || "/";
          router.push(redirectPath);
        } else if (data.needsSetup) {
          // User needs to complete setup
          router.push("/setup/unified");
        } else {
          // Fallback - no user type found
          router.push("/setup/unified");
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        // On error, redirect to setup
        router.push("/setup/unified");
      }
    };

    fetchRoleAndRedirect();
  }, [router]);

  // Loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
