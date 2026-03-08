"use client";

import { ClerkProvider as Clerk } from "@clerk/nextjs";
import { ReactNode } from "react";

export function ClerkProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  // Only show error in production if key is missing
  // In development, always render Clerk - it will handle missing keys gracefully
  if (isProduction && !publishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600">This page requires Clerk authentication to be configured.</p>
        </div>
      </div>
    );
  }

  // Always render Clerk - in dev it shows sign-in form even without keys
  return <Clerk publishableKey={publishableKey}>{children}</Clerk>;
}
