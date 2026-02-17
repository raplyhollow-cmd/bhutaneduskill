"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { StudentBottomNav, MainContentWithBottomNav } from "@/components/shared/portal-bottom-nav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userType, setUserType] = useState<"student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry" | null>(null);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous fetch calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    Promise.all([
      fetch("/api/auth/set-role"),
      fetch("/api/user/profile")
    ])
      .then(([roleRes, profileRes]) => Promise.all([roleRes.json(), profileRes.json()]))
      .then(([roleData, profileData]) => {
        // Portal type validation: redirect non-students to their correct portal
        if (roleData.userType && roleData.userType !== 'student') {
          const portalMap: Record<string, string> = {
            teacher: '/teacher',
            parent: '/parent',
            counselor: '/counselor',
            'school-admin': '/school-admin',
            admin: '/admin',
            ministry: '/ministry',
          };
          router.push(portalMap[roleData.userType] || '/dashboard');
          return;
        }

        // Check if user needs setup
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/unified");
          return;
        }

        // Set user type and name
        setUserType(roleData.userType || "student");
        if (profileData?.profile) {
          setUserName(`${profileData.profile.firstName} ${profileData.profile.lastName || ""}`.trim());
        } else {
          setUserName("Student");
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("API fetch failed:", error);
        // If API fails, redirect to setup to ensure user is properly configured
        router.push("/setup/unified");
      });
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalSidebar userType={userType} userName={userName} />
      <div className="lg:pl-64">
        <PortalHeader userType={userType} userName={userName} />
        <MainContentWithBottomNav>
          <main className="p-6">{children}</main>
        </MainContentWithBottomNav>
      </div>
      <StudentBottomNav />
    </div>
  );
}
