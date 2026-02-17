/**
 * PLATFORM ASSISTANT WRAPPER
 *
 * This component fetches the user's role and passes it to the PlatformAssistant.
 * It's used in the root layout to provide role-aware AI assistance.
 */

"use client";

import { useEffect, useState } from "react";
import { PlatformAssistant } from "@/components/ai/platform-assistant";
import { useUser } from "@clerk/nextjs";

type UserRole = "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";

export function PlatformAssistantWrapper(props: { className?: string }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [userName, setUserName] = useState<string>("User");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    // Fetch user role from API
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        const role = data.userType || data.type || "student";
        setUserRole(role);
        setUserName(data.name || user?.firstName || user?.fullName || "User");
      })
      .catch(() => {
        // Default to student if API fails
        setUserRole("student");
        setUserName(user?.firstName || user?.fullName || "User");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoaded, isSignedIn, user]);

  // Don't render if not authenticated or still loading
  if (!isLoaded || !isSignedIn || isLoading) {
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
