"use client";

/**
 * TEACHER PORTAL LAYOUT
 *
 * Uses client-side auth to check if teacher needs setup.
 * Redirects to /setup/teacher if not configured.
 */


import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { TeacherBottomNav, MainContentWithBottomNav } from "@/components/shared/portal-bottom-nav";

export default function TeacherLayout({
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
        // Portal type validation: redirect non-teachers to their correct portal
        if (roleData.userType && roleData.userType !== 'teacher') {
          const portalMap: Record<string, string> = {
            student: '/student',
            parent: '/parent',
            counselor: '/counselor',
            'school-admin': '/school-admin',
            admin: '/admin',
            ministry: '/ministry',
          };
          router.push(portalMap[roleData.userType] || '/dashboard');
          return;
        }

        // Check if user needs setup (first time login, not in database)
        if (roleData.needsSetup || !roleData.userType) {
          setNeedsSetup(true);
          // Redirect to unified setup after a short delay to allow state update
          setTimeout(() => {
            router.push("/setup/unified");
          }, 100);
          return;
        }

        // Set user type
        if (roleData.userType || profileData?.userType) {
          setUserType(roleData.userType || profileData.userType || "teacher");
        }

        // Set user name - handle missing data.profile by checking for existence
        if (profileData?.profile) {
          setUserName(`${profileData.profile.firstName} ${profileData.profile.lastName || ""}`.trim());
        } else {
          // Fallback to a generic name if profile not found but userType exists
          setUserName("Teacher");
        }
      })
      .catch((error) => {
        console.error("API fetch failed:", error);
        // If APIs fail completely, redirect to unified setup to ensure user is properly configured
        setNeedsSetup(true);
        setTimeout(() => {
          router.push("/setup/unified");
        }, 100);
      });
  }, [router]);

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show loading while redirecting to setup
  if (needsSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Setting up your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalSidebar userType="teacher" userName={userName} />
      <div className="lg:pl-64">
        <PortalHeader userType="teacher" userName={userName} />
        <MainContentWithBottomNav>
          <main className="p-6">
            {/* Portal Banner */}
            <div className="mb-6 text-white rounded-xl p-6 shadow-lg" style={{ background: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Welcome to Teacher Portal</h1>
                  <p className="text-white/90">
                    Manage your classes, track student progress, and provide career guidance.
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
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
              </div>
            </div>

            {children}
          </main>
        </MainContentWithBottomNav>
      </div>
      <TeacherBottomNav />
    </div>
  );
}
