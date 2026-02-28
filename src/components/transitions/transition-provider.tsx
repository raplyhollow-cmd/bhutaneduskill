/**
 * Transition Provider
 *
 * A simplified provider that wraps children with a pathname-keyed div.
 * Originally used AnimatePresence for page transitions, but that was causing
 * React hooks mismatch errors with route transitions.
 *
 * This provider ensures consistent component structure across route changes.
 */

"use client";

import { usePathname } from "next/navigation";

interface TransitionProviderProps {
  children: React.ReactNode;
  mode?: "wait" | "sync" | "popLayout";
}

export function TransitionProvider({
  children,
  mode = "wait",
}: TransitionProviderProps) {
  const pathname = usePathname();

  // Simple wrapper that always renders the same structure
  return <div key={pathname}>{children}</div>;
}
