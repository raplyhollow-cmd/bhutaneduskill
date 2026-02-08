"use client";

import { useEffect, useState } from "react";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userType, setUserType] = useState<"student" | "teacher" | "parent" | "counselor" | "admin" | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Fetch user info and set type
    fetch("/api/auth/set-role")
      .then((res) => res.json())
      .then((data) => {
        if (data.userType) {
          setUserType(data.userType);
        }
      })
      .catch(() => {
        // Default to student for demo
        setUserType("student");
      });

    // Get user name from profile
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserName(`${data.user.firstName} ${data.user.lastName || ""}`.trim());
        }
      })
      .catch(() => setUserName("Student"));
  }, []);

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-hunter-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ash-grey-50">
      <PortalSidebar userType={userType} userName={userName} />
      <div className="lg:pl-64">
        <PortalHeader userType={userType} userName={userName} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
