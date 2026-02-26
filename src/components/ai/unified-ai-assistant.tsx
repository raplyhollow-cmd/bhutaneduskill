"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * UNIFIED AI ASSISTANT
 *
 * DISABLED: The AI assistant was causing hooks mismatch errors due to lazy loading
 * and conditional rendering. This component is temporarily disabled to fix the
 * "Rendered more hooks than during the previous render" error.
 *
 * TODO: Re-implement with a consistent render pattern that doesn't use lazy loading
 * or conditional returns that change the component tree structure.
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

  // Always render null consistently - no hooks mismatch
  return null;
}
