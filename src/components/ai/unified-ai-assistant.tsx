"use client";

import { logger } from "@/lib/logger";
/**
 * UNIFIED AI ASSISTANT
 *
 * This component shows the appropriate AI assistant based on user role:
 * - Students: See Career Coach (orange theme, career-focused)
 * - All others (admin, ministry, teacher, parent, counselor, school-admin): See Platform Assistant (role-themed, full-featured)
 *
 * Only ONE bubble is shown at a time.
 */


import { useEffect, useState } from "react";
import { PlatformAssistant } from "@/components/ai/platform-assistant";
import { AICareerCoach } from "@/components/ai/career-coach";
import { useUser } from "@clerk/nextjs";

type UserRole = "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";

export function UnifiedAIAssistant() {
  // During build time, Clerk hooks may not be available
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return null;
  }

  const { isLoaded, isSignedIn, user } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
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
        // API returns { profile: { type, name, ... } }
        const profile = data.profile || data;
        const role = profile.type || "student";
        setUserRole(role);
        setUserName(profile.name || user?.firstName || user?.fullName || "User");
      })
      .catch((error) => {
        logger.error("Failed to fetch user profile:", error);
        // Default to student if API fails
        setUserRole("student");
        setUserName(user?.firstName || user?.fullName || "User");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoaded, isSignedIn, user]);

  // Don't render if not authenticated or still loading
  if (!isLoaded || !isSignedIn || isLoading || !userRole) {
    return null;
  }

  // Students get Career Coach, everyone else gets Platform Assistant
  if (userRole === "student") {
    return <AICareerCoach />;
  }

  return (
    <PlatformAssistant
      userName={userName}
      userRole={userRole}
    />
  );
}
