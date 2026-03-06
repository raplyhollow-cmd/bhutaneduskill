"use client";

/**
 * PLATFORM ASSISTANT WRAPPER
 *
 * This component fetches the user's role and passes it to the PlatformAssistant.
 * It's used in the root layout to provide role-aware AI assistance.
 */


import { useEffect, useState } from "react";
import { PlatformAssistant } from "@/components/ai/platform-assistant";

type UserRole = "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";

export function PlatformAssistantWrapper(props: { className?: string }) {
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [userName, setUserName] = useState<string>("User");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Fetch user role from API
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        const profile = data.data?.profile || data.profile || data.user;
        if (profile) {
          const role = profile.type || "student";
          setUserRole(role);
          setUserName(profile.name || "User");
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      })
      .catch(() => {
        // Default to student if API fails
        setUserRole("student");
        setUserName("User");
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  // Don't render if not authenticated or still loading
  if (!isAuthenticated || isLoading) {
    return null;
  }

  return (
    <PlatformAssistant
      userName={userName}
      userRole={userRole}
      className={props.className}
    />
  );
}
