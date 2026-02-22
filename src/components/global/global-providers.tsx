/**
 * Global Providers Client Component
 *
 * Contains all client-side global providers that need hooks.
 * This is imported by the root layout.
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { CommandMenu } from "@/components/command-menu/command-menu";
import { SlideOverProvider } from "@/components/slide-over/slide-over-provider";
import { usePathname } from "next/navigation";

/**
 * Client wrapper for CommandMenu to detect current portal
 */
function CommandMenuClientWrapper() {
  const pathname = usePathname();

  // Extract portal type from pathname
  const portalMatch = pathname.match(/^\/([^\/]+)/);
  const portal = portalMatch ? portalMatch[1] as "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry" : null;

  // Only show command menu inside portal routes
  if (!portal || !["student", "teacher", "parent", "counselor", "admin", "school-admin", "ministry"].includes(portal)) {
    return null;
  }

  return <CommandMenu portal={portal} />;
}

/**
 * Slide-over provider wrapped in Suspense for useSearchParams
 * Only rendered after client-side hydration
 */
function SlideOverProviderWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <SlideOverProvider />
    </Suspense>
  );
}

/**
 * Global Providers Component
 *
 * Wraps the app with all global client-side providers.
 * Only renders on client-side to avoid static generation issues.
 */
export function GlobalProviders() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <SlideOverProviderWrapper />
      <CommandMenuClientWrapper />
    </>
  );
}
