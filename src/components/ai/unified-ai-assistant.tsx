"use client";

import { useState, useEffect } from "react";
import { PlatformAssistant } from "./platform-assistant";

/**
 * UNIFIED AI ASSISTANT
 *
 * Wraps the PlatformAssistant component with role detection.
 *
 * NOTE: The PlatformAssistant component manages its own sidebar state internally.
 * To add external keyboard shortcut control, the component would need to accept
 * an `open` prop or expose an `openChat` method via ref.
 */
export interface UnifiedAIAssistantProps {
  userId?: string;
  userName?: string;
  userRole?: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry";
}

export function UnifiedAIAssistant({ userId, userName, userRole }: UnifiedAIAssistantProps) {
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(userId);
  const [resolvedUserName, setResolvedUserName] = useState<string | undefined>(userName);
  const [resolvedUserRole, setResolvedUserRole] = useState<"student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin" | "ministry" | undefined>(userRole);

  // Fetch user profile data if not provided
  useEffect(() => {
    // Skip during SSR
    if (typeof window === "undefined") {
      return;
    }

    // If all props are provided, no need to fetch
    if (userId && userName && userRole) {
      return;
    }

    // Check if Clerk is properly configured
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return;
    }

    // Fetch user role from API
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((response) => {
        // API returns { success: true, data: { profile: {...} } }
        const profile = response.data?.profile || response.profile || response;

        if (!resolvedUserId && profile.id) {
          setResolvedUserId(profile.id);
        }
        if (!resolvedUserName) {
          const name = profile.firstName && profile.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile.firstName || profile.lastName || profile.name || "User";
          setResolvedUserName(name);
        }
        if (!resolvedUserRole && profile.type) {
          setResolvedUserRole(profile.type);
        }
      })
      .catch(() => {
        // Use defaults if fetch fails
        if (!resolvedUserName) setResolvedUserName("User");
        if (!resolvedUserRole) setResolvedUserRole("student");
      });
  }, [userId, userName, userRole, resolvedUserId, resolvedUserName, resolvedUserRole]);

  // Don't render until we have the required data
  if (!resolvedUserRole) {
    return null;
  }

  return (
    <PlatformAssistant
      userId={resolvedUserId}
      userName={resolvedUserName}
      userRole={resolvedUserRole}
      key={resolvedUserRole} // Force re-render when role changes
    />
  );
}
