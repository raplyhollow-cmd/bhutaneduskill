"use client";

// Force dynamic rendering - this page does client-side routing
export const dynamic = 'force-dynamic';

// Prevent any caching
export const fetchCache = 'force-no-store';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Route Page - Intelligent User Routing
 *
 * This page handles routing after sign-in/sign-up:
 * 1. Checks /api/resources/users/actions?action=get-role to get user type
 * 2. If user is set up, redirects to their portal
 * 3. If user needs setup, redirects to /setup/unified
 *
 * This replaces middleware routing without causing build-time issues.
 */
export default function RoutePage() {
  const router = useRouter();

  useEffect(() => {
    console.log("[Route] Page loaded, checking auth...");
    fetch("/api/resources/users/actions?action=get-role", {
      credentials: "include",
    })
      .then(async (res) => {
        console.log("[Route] API response status:", res.status);
        const data = await res.json();
        console.log("[Route] API response data:", data);

        const { userType, needsSetup } = data;

        if (!needsSetup && userType) {
          // User is set up - redirect to portal
          const redirectMap: Record<string, string> = {
            student: "/student",
            teacher: "/teacher",
            parent: "/parent",
            counselor: "/counselor",
            "school-admin": "/school-admin",
            admin: "/admin",
            ministry: "/ministry",
          };
          const redirectPath = redirectMap[userType] || "/setup/unified";
          console.log("[Route] Redirecting to:", redirectPath, "for user type:", userType);
          router.push(redirectPath);
        } else {
          // User needs setup - redirect to setup wizard
          console.log("[Route] User needs setup, redirecting to /setup/unified");
          router.push("/setup/unified");
        }
      })
      .catch((error) => {
        console.error("[Route] Route check failed:", error);
        // On error, go to setup
        router.push("/setup/unified");
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Setting up your experience...</p>
      </div>
    </div>
  );
}
