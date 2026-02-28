"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * UNIFIED AI ASSISTANT
 *
 * A stub component that logs user role information.
 * The full AI assistant implementation is pending re-architecture
 * to avoid React hooks ordering issues with lazy loading.
 */
export function UnifiedAIAssistant() {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    // Skip during SSR
    if (typeof window === "undefined") {
      return;
    }

    // Check if Clerk is properly configured
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return;
    }

    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Fetch user role from API
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        const profile = data.profile || data;
        console.log("[UnifiedAIAssistant] User role:", profile.type);
      })
      .catch(() => {
        console.log("[UnifiedAIAssistant] Using default role: student");
      });
  }, [isLoaded, isSignedIn]);

  // This component currently renders nothing
  // TODO: Re-implement AI assistant with proper architecture
  return null;
}
