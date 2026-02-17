"use client";

/**
 * PLATFORM ADMIN PORTAL LAYOUT
 *
 * For platform administrators to manage multi-tenant operations.
 * Uses client-side auth to check if admin needs setup.
 */


import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { AdminBottomNav, MainContentWithBottomNav } from "@/components/shared/portal-bottom-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userType, setUserType] = useState<"student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry" | null>(null);
  const [userName, setUserName] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous fetch calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Fetch user info and set type (parallel requests for speed)
    Promise.all([
      fetch("/api/auth/set-role"),
      fetch("/api/user/profile")
    ])
      .then(([roleRes, profileRes]) => Promise.all([roleRes.json(), profileRes.json()]))
      .then(([roleData, profileData]) => {
        // Portal type validation: redirect non-admins to their correct portal
        if (roleData.userType && roleData.userType !== 'admin') {
          const portalMap: Record<string, string> = {
            student: '/student',
            teacher: '/teacher',
            parent: '/parent',
            counselor: '/counselor',
            'school-admin': '/school-admin',
            ministry: '/ministry',
          };
          // Use router.push to redirect to appropriate portal
          router.push(portalMap[roleData.userType] || '/setup/unified');
          return;
        }

        // Platform admins skip setup entirely - always let them through
        if (roleData.userType === 'admin') {
          setUserType('admin');
          if (profileData?.profile) {
            setUserName(`${profileData.profile.firstName} ${profileData.profile.lastName || ''}`.trim());
          } else {
            setUserName("Admin");
          }
          return;
        }

        // Check if user needs setup (first time login, not in database)
        if (roleData.needsSetup || !roleData.userType) {
          setNeedsSetup(true);
          // Redirect to setup after a short delay to allow state update
          setTimeout(() => {
            router.push("/setup/unified");
          }, 100);
          return;
        }

        // Set user type
        if (roleData.userType || profileData?.userType) {
          setUserType(roleData.userType || profileData.userType || "admin");
        }

        // Set user name - handle missing data.profile by checking for existence
        if (profileData?.profile) {
          setUserName(`${profileData.profile.firstName} ${profileData.profile.lastName || ""}`.trim());
        } else {
          // Fallback to a generic name if profile not found but userType exists
          setUserName("Admin");
        }
      })
      .catch((error) => {
        // Log error but don't expose details to client
        // If APIs fail completely, redirect to setup to ensure user is properly configured
        setNeedsSetup(true);
        setTimeout(() => {
          router.push("/setup/unified");
        }, 100);
      });
  }, [router]);

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show loading while redirecting to setup
  if (needsSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Setting up your profile...</p>
      </div>
    );
  }

  // Admin portal uses pink gradient
  const bannerStyle = {
    background: 'linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalSidebar userType="admin" userName={userName} />
      <div className="lg:pl-64">
        <PortalHeader userType="admin" userName={userName} />
        <MainContentWithBottomNav>
          <main className="p-6">
            {/* Portal Banner */}
            <div className="mb-6 text-white rounded-xl p-6 shadow-lg premium-card" style={bannerStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Welcome to Admin Portal</h1>
                  <p className="text-white/90">
                    Manage entire platform - schools, users, analytics, and settings.
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
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
            </div>

            {children}
          </main>
        </MainContentWithBottomNav>
      </div>
      <AdminBottomNav />
    </div>
  );
}
