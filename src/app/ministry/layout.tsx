"use client";

import { logger } from "@/lib/logger";
/**
 * MINISTRY PORTAL LAYOUT
 *
 * Uses the Universal Mobile Template for consistent mobile UX across all portals.
 * - Mobile: Hamburger menu with slide-in sidebar
 * - Desktop: Always-visible sidebar
 * - NO bottom navigation (removed as per user decision)
 *
 * To change mobile behavior, edit: src/config/portal-config.ts
 */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";

export default function MinistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous fetch calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Fetch user info and check if setup is needed
    Promise.all([
      fetch("/api/auth/set-role"),
      fetch("/api/user/profile")
    ])
      .then(([roleRes, profileRes]) => Promise.all([roleRes.json(), profileRes.json()]))
      .then(([roleData, profileData]) => {
        // Portal type validation: redirect non-ministry users to their correct portal
        if (roleData.userType && roleData.userType !== 'ministry') {
          const portalMap: Record<string, string> = {
            student: '/student',
            teacher: '/teacher',
            parent: '/parent',
            counselor: '/counselor',
            'school-admin': '/school-admin',
            admin: '/admin',
          };
          router.push(portalMap[roleData.userType] || '/dashboard');
          return;
        }

        // Check if user is ministry type
        if (roleData.userType === 'ministry') {
          if (profileData?.profile) {
            setUserName(`${profileData.profile.firstName} ${profileData.profile.lastName || ''}`.trim());
          } else {
            setUserName("Ministry Official");
          }
          setIsReady(true);
          return;
        }

        // Check if user needs setup (first time login, not in database)
        if (roleData.needsSetup || !roleData.userType) {
          setNeedsSetup(true);
          // Redirect to setup after a short delay to allow state update
          setTimeout(() => {
            router.push("/setup/ministry");
          }, 100);
          return;
        }

        // Set user name if available
        if (profileData?.profile) {
          setUserName(`${profileData.profile.firstName} ${profileData.profile.lastName || ""}`.trim());
        } else {
          setUserName("Ministry Official");
        }

        setIsReady(true);
      })
      .catch((error) => {
        logger.error("API fetch failed:", error);
        // If APIs fail completely, redirect to setup to ensure user is properly configured
        setNeedsSetup(true);
        setTimeout(() => {
          router.push("/setup/ministry");
        }, 100);
      });
  }, [router]);

  // Show loading while checking auth - Uses 100dvh to fix iOS Safari address bar bug
  if (!isReady) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show loading while redirecting to setup
  if (needsSetup) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Setting up your Ministry profile...</p>
      </div>
    );
  }

  // Purple/violet theme banner
  const bannerStyle = {
    background: 'linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)'
  };

  // Main layout - Uses 100dvh for proper mobile viewport height
  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Universal Sidebar - Now Ministry uses the SAME component as other portals! */}
      <UniversalMobileSidebar portalType="ministry" userName={userName} />

      {/* Main content area with desktop padding for sidebar */}
      <div className="lg:pl-64">
        <UniversalPortalHeader portalType="ministry" userName={userName} />
        <main className="p-6">
          {/* Portal Banner */}
          <div className="mb-6 text-white rounded-xl p-6 shadow-lg" style={bannerStyle}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to Ministry Portal</h1>
                <p className="text-white/90">
                  Manage national education policies, schools, and analytics.
                </p>
              </div>
              <div className="hidden md:block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-16 h-16 text-white/80"
                >
                  <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
