"use client";

import { ClerkProvider as Clerk } from "@clerk/nextjs";
import { ReactNode } from "react";

export function ClerkProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // During build or when key is not available/empty, render children without Clerk
  if (!publishableKey || publishableKey === "" || publishableKey.startsWith("pk_test_") === false && publishableKey.startsWith("pk_live_") === false) {
    return <>{children}</>;
  }

  return <Clerk publishableKey={publishableKey}>{children}</Clerk>;
}
