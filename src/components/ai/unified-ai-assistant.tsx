"use client";

import { logger } from "@/lib/logger";
/**
 * UNIFIED AI ASSISTANT
 *
 * This component shows the appropriate AI assistant based on user role:
 * - Students: See Career Coach (orange theme, career-focused)
 * - Teachers: See Teacher Assistant (blue theme, teaching-focused)
 * - Admin, Ministry: See Platform Assistant (pink/purple theme, system-focused)
 * - Counselor, Parent, School-Admin: See Platform Assistant (role-themed)
 *
 * Each portal gets a specialized AI assistant for their specific needs.
 * Only ONE bubble is shown at a time.
 */


import { useEffect, useState } from "react";
import { PlatformAssistant } from "@/components/ai/platform-assistant";
import { AICareerCoach } from "@/components/ai/career-coach";
import { TeacherAssistant } from "@/components/ai/teacher-assistant";
import { useUser } from "@clerk/nextjs";

type UserRole = "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";

export function UnifiedAIAssistant() {
  // During build time or when Clerk is not configured, return null
  if (typeof window === "undefined") {
    return null;
  }

  // Check if Clerk is properly configured
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
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
        // Normalize role names - handle database underscores vs hyphens
        let role = profile.type || "student";
        // Convert school_admin to school-admin for consistency
        if (role === "school_admin") {
          role = "school-admin";
        }
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

  // Show role-specific AI assistant
  if (userRole === "student") {
    return <AICareerCoach />;
  }

  if (userRole === "teacher") {
    return <TeacherAssistant userName={userName} />;
  }

  // Admin, Ministry, Counselor, Parent, School-Admin get Platform Assistant
  return (
    <PlatformAssistant
      userName={userName}
      userRole={userRole}
    />
  );
}
