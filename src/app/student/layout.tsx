"use client";

import { useEffect, useState } from "react";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { StudentBottomNav, MainContentWithBottomNav } from "@/components/shared/portal-bottom-nav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userType, setUserType] = useState<"student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry" | null>(null);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/set-role")
      .then((res) => res.json())
      .then((data) => {
        // Portal type validation: redirect non-students to their correct portal
        if (data.userType && data.userType !== 'student') {
          const portalMap: Record<string, string> = {
            teacher: '/teacher',
            parent: '/parent',
            counselor: '/counselor',
            'school-admin': '/school-admin',
            admin: '/admin',
            ministry: '/ministry',
          };
          window.location.href = portalMap[data.userType] || '/dashboard';
          return;
        }

        // Check if user needs setup
        if (data.needsSetup || !data.userType) {
          window.location.href = "/setup/unified";
          return;
        }

        // Set user type and name
        setUserType(data.userType);
        setUserName(`${data.firstName || ""} ${data.lastName || ""}`.trim() || "Student");
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("API fetch failed:", error);
        // If API fails, redirect to setup to ensure user is properly configured
        window.location.href = "/setup/unified";
      });
  }, []);

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
